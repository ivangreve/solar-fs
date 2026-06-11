# ☀️ solar-fs — Dashboard solar off-grid (Felicity)

Dashboard de monitoreo para sistemas solares **Felicity Solar**, pensado para
instalaciones **off-grid** (sin red): paneles + inversor + banco de baterías + generador
a nafta de respaldo. Multi-usuario: cada persona conecta su cuenta Felicity y ve solo
sus plantas.

**Demo en producción:** https://solar-fs.vercel.app

A diferencia de la app oficial, `solar-fs` mantiene una **base de datos propia de series
de tiempo** (telemetría 5-min + rollups diarios), lo que permite KPIs e históricos que la
nube de Felicity no ofrece: autosuficiencia real, energía aportada por el generador,
balance de carga/descarga de baterías y costo estimado de nafta.

## Features

- 🔐 **Login con tu cuenta Felicity** — la identidad la valida la API de Felicity.
  Multi-usuario con aislamiento por dueño (cada uno ve SUS plantas).
- 📊 **Resumen** — KPIs animados del día (generación, autosuficiencia, autoconsumo),
  potencia en vivo y curvas intradía (FV / generador / consumo / SOC).
- 🔌 **Dispositivos** — esquema del sistema con ilustraciones del hardware real
  (inversor IVEM, baterías FLA48100 con anillo de SOC) y flujo de energía animado.
- ⚡ **Energía** — mix de fuentes, diagrama Sankey del día (con kWh por nodo) y
  comparativa generación/consumo de 30 días.
- 🔋 **Batería** — SOC del banco, salud (SOH), voltaje y ciclos de carga/descarga
  estimados por balance de energía.
- ⛽ **Generador** — energía aportada por nafta, litros y costo estimados, % del
  consumo cubierto.
- 🌗 Tema claro/oscuro (cookie server-side, sin flash) · 🕐 horas en zona local del
  equipo (`APP_TZ`) · animaciones con `motion`.

## Stack

Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · TypeScript · Tailwind ·
ECharts · TypeORM · PostgreSQL · Docker (dev) · Vercel + Neon (prod).

## Arquitectura

```
                                  ┌────────────────────────────────────────────┐
Felicity API ◄──(cliente por usuario: login RSA + token cacheado)──┐           │
                                  │                                │           │
   crons ──► /api/cron/ingest ──► ingesta por usuario ──► Postgres (telemetry, │
 (cada 5min)   (CRON_SECRET)      + rollup diario          daily_stats, ...)   │
                                  │                                │           │
 navegador ──► proxy.ts (cookie) ──► requireUser() ──► queries con ownership ──┘
               (chequeo optimista)   (sesión en DB)     (fail-closed, anti-IDOR)
```

- **`src/server/felicity/`** — cliente API (login RSA, re-login automático) +
  normalización a un modelo canónico. *Gotcha conocido:* el `dataTime` (epoch) del
  snapshot viene corrupto; se parsea desde `dataTimeStr` + `timeZone`.
- **`src/server/auth/`** — sesiones revocables (tabla + cookie httpOnly), encriptación
  AES-256-GCM de la contraseña Felicity (reversible a propósito: el cron la reusa para
  re-loguear; por eso NO es un hash) e iterador de ingesta por usuario.
- **`src/server/db/`** — entities: `User`, `Session`, `Plant` (con `ownerUserId`),
  `Device`, `Telemetry`, `DailyStat`, `HealthSnapshot`.
- **`src/server/ingest/`** — sync de metadata, snapshots en vivo, backfill histórico
  (con pacing + retry ante el rate-limit 996 de Felicity) y rollup diario.
- **`src/proxy.ts`** — redirección temprana por cookie (Next 16 renombró middleware a
  proxy). La autorización real vive en `requireUser()` + filtros por dueño en cada query.

## Desarrollo local

### 1. Variables de entorno (`.env`)

```env
DATABASE_URL=postgres://solarfs:solarfs@localhost:5433/solarfs
APP_ENCRYPTION_KEY=   # openssl rand -base64 32 — encripta las contraseñas Felicity
CRON_SECRET=          # string random largo — protege /api/cron/ingest
# APP_TZ=America/Argentina/Buenos_Aires   (default)
```

> ⚠️ `APP_ENCRYPTION_KEY` no se rota una vez que hay usuarios: desencripta las
> credenciales guardadas. Sin ella, nadie puede loguearse.

### 2. Levantar todo

```bash
npm install
npm run db:up        # docker compose: Postgres (5433) + nginx (8080) + crons de ingesta
npm run db:sync      # crea el schema desde las entities
PORT=3009 npm run dev
```

Abrí **http://localhost:8080** (nginx → next dev) y logueate con tu cuenta Felicity.
El primer login sincroniza tus plantas; el contenedor `ingest` mantiene los datos
frescos cada 5 min. Para el histórico completo: `npm run backfill`.

### Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run db:up` / `db:down` | Stack de Docker (Postgres, nginx, crons) |
| `npm run db:sync` | Crea/actualiza el schema desde las entities |
| `npm run sync:meta` | Re-sincroniza plantas y dispositivos (todos los usuarios) |
| `npm run backfill [YYYY-MM-DD]` | Histórico 5-min desde la instalación + rollups |
| `npm run ingest` | Snapshot en vivo + rollup del día (lo que corre el cron) |
| `npm run reroll` | Recalcula todos los rollups (ej: tras cambiar `APP_TZ`) |

## Producción

Deploy en **Vercel** con **Neon** (Postgres administrada). Guía paso a paso en
[`DEPLOY.md`](DEPLOY.md). Resumen del cron de ingesta:

- `vercel.json` define un cron **diario** (23:50 ART) — el plan Hobby no permite más
  frecuencia.
- Para frescura de 5 min: el servicio `ingest-prod` del docker-compose (corre en tu
  máquina) o un workflow de GitHub Actions pegándole a
  `/api/cron/ingest` con `Authorization: Bearer $CRON_SECRET`.

## Docs

- [`docs/PLAN_PRODUCTO.md`](docs/PLAN_PRODUCTO.md) — plan de producto y gráficos.
- [`docs/API_FELICITYSOLAR.md`](docs/API_FELICITYSOLAR.md) — ingeniería inversa de la
  API de Felicity (endpoints, login RSA, campos útiles).
- [`DEPLOY.md`](DEPLOY.md) — deploy a Vercel + Neon.

## Roadmap

- [ ] Filtro por fecha/rango transversal a todas las vistas
- [ ] Onboarding de tarifas + sección **Finanzas** (ahorro real, payback)
- [ ] Migraciones de TypeORM (hoy: `db:sync`)
- [ ] Alertas (SOC bajo, equipo offline, generador encendido)
