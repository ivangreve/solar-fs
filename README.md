# solar-fs — Monitoreo solar (Felicity) · Fase 0

Web app de estadísticas para sistemas solares Felicity, con **DB propia de series de
tiempo** (no depende de leer la API en vivo en cada request).

- **Plan de producto y gráficos:** [`docs/PLAN_PRODUCTO.md`](docs/PLAN_PRODUCTO.md)
- **Doc de la API de Felicity:** [`docs/API_FELICITYSOLAR.md`](docs/API_FELICITYSOLAR.md)

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind · **TypeORM** · PostgreSQL (Docker) ·
ingesta con `tsx`.

## Arquitectura (Fase 0)
```
Felicity API ──(server-side, BFF)──► capa anti-corrupción ──► Postgres (TypeORM)
                                       (login RSA, token,         │
                                        normalización)            ▼
   cron 5min ─► /api/cron/ingest ─► ingesta + rollup        Next route handlers ─► UI
```

- **`src/server/felicity/`** — cliente de la API (login RSA, token, endpoints) +
  normalización (mapea esquemas live/histórico a un modelo canónico).
- **`src/server/db/`** — DataSource + entities (`Plant`, `Device`, `Telemetry`,
  `DailyStat`, `HealthSnapshot`).
- **`src/server/ingest/`** — sync de metadata, snapshot en vivo, backfill histórico,
  rollup diario (autosuficiencia, autoconsumo, ahorro).
- **`src/app/api/`** — BFF: `/api/plants`, `/api/plants/[id]/overview`, `/api/cron/ingest`.
- **`scripts/`** — entrypoints ejecutables con `tsx`.

## Puesta en marcha

### 1. Variables de entorno
Creá un archivo `.env` en la raíz (está en `.gitignore`). Base:

```env
DATABASE_URL=postgres://solarfs:solarfs@localhost:5433/solarfs
FELICITY_USERNAME=tu-email@ejemplo.com
FELICITY_PASSWORD=tu-password
CRON_SECRET=un-string-random-largo
```

> Atajo en la terminal de Claude Code: `! cp .env.example .env` y editá. (También
> tenés `.env.example` de referencia.)

### 2. Levantar Postgres y crear el schema
```bash
npm run db:up      # docker compose: Postgres en localhost:5433
npm run db:sync    # crea las tablas desde las entities (dev)
```

### 3. Cargar datos
```bash
npm run sync:meta          # trae plantas y dispositivos de Felicity
npm run backfill           # histórico completo (5-min) desde la instalación
# o acotado:  npm run backfill 2026-06-01
npm run ingest             # snapshot en vivo + rollup del día (esto corre el cron)
```

### 4. Levantar la app
```bash
npm run dev                # http://localhost:3000
curl http://localhost:3000/api/plants   # probar el BFF
```

## Scripts
| Comando | Qué hace |
|---------|----------|
| `npm run db:up` / `db:down` | Postgres en Docker |
| `npm run db:sync` | Crea/actualiza schema desde entities (dev) |
| `npm run sync:meta` | Sincroniza plantas y dispositivos |
| `npm run backfill [YYYY-MM-DD]` | Backfill histórico + rollups |
| `npm run ingest` | Snapshot en vivo + rollup (cron 5-min) |
| `npm run dev` | Next.js en dev |

## Producción (cron)
`vercel.json` define un cron cada 5 min que pega a `/api/cron/ingest` (protegido por
`CRON_SECRET`). En otro hosting, agendá un cron equivalente al mismo endpoint, o corré
`npm run ingest` desde un scheduler.

## Estado y próximos pasos
**Fase 0 verificada end-to-end:** login RSA, normalización live/histórico, ingesta,
backfill y rollup diario funcionan contra la API real. Generación, autoconsumo, pico FV
y ciclado de SOC se calculan correctamente.

**Pendiente Fase 1 (modelo energético):**
- Mapear bien el **consumo** (`load`): en inversores off-grid la carga ≈ `acOutPower`.
  Hoy `e_load_kwh` puede dar 0 → la autosuficiencia queda null hasta afinar esto.
- Reemplazar `db:sync` por **migraciones** de TypeORM para producción.
- Construir el Overview y los gráficos de la Fase 1 (ver `docs/PLAN_PRODUCTO.md`).
