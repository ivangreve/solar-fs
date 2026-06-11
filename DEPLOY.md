# Deploy a Vercel

> **Por qué no es "un botón"**: Vercel es **serverless**. NO corre tu `docker-compose`
> (ni el Postgres, ni nginx, ni el contenedor `ingest`). En Vercel solo vive el Next.
> Por eso, antes de deployar, hay que resolver la **base de datos administrada** y las
> **variables de entorno**. El `vercel.json` (cron) y la config de Next ya están listos.

---

## Paso 1 — Postgres administrada (el bloqueante)

Necesitás una Postgres en la nube con **conexión pooled** (serverless abre muchas
conexiones; sin pooler, las agota). Recomendado: **Neon** (https://neon.tech, free tier).

1. Crear un proyecto en Neon → te da dos connection strings.
2. Usá la **POOLED** (la que dice `-pooler` en el host). Ej:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

> Alternativas equivalentes: Supabase, Railway, Vercel Postgres. Siempre la URL **pooled**.

## Paso 2 — Crear el schema en la DB de producción

El proyecto no usa migraciones formales; el schema se crea con `db:sync`. Una sola vez,
apuntando a la DB nueva (reemplazá la URL):

```bash
DATABASE_URL='postgresql://...-pooler.../neondb?sslmode=require' npm run db:sync
```

Crea las tablas `plants, devices, telemetry, daily_stats, health_snapshots, users, sessions`.

## Paso 3 — Variables de entorno en Vercel

Estas son las que la app necesita en producción (generadas frescas para vos):

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | la URL **pooled** de Neon del Paso 1 |
| `APP_ENCRYPTION_KEY` | generar con `openssl rand -base64 32` (la vigente ya está cargada en Vercel — NO se rota: encripta las contraseñas Felicity guardadas) |
| `CRON_SECRET` | el mismo del `.env` local (unificado local/prod para que el docker `ingest-prod` y GitHub Actions usen uno solo) |
| `APP_TZ` | `America/Argentina/Buenos_Aires` (opcional; es el default) |
| `FELICITY_API_BASE` | opcional (default `https://shine-api.felicitysolar.com`) |

> ⚠️ **`APP_ENCRYPTION_KEY` NO se cambia nunca** una vez que un usuario se logueó:
> encripta las contraseñas de Felicity guardadas. Si la rotás, nadie puede re-loguear.

Las cargás con el CLI (te las pide una por una, sin que queden en el repo):

```bash
vercel login            # abre el navegador — ESTE es tu único "botón"
vercel link             # vincula la carpeta al proyecto Vercel (lo crea si no existe)
vercel env add DATABASE_URL production
vercel env add APP_ENCRYPTION_KEY production
vercel env add CRON_SECRET production
vercel env add APP_TZ production
```

## Paso 4 — Deploy

```bash
vercel --prod
```

Eso buildea y publica. Te devuelve la URL (`https://solar-fs-xxx.vercel.app`).

## Paso 5 — El cron en Vercel (LEER)

`vercel.json` ya tiene el cron cada 5 min apuntando a `/api/cron/ingest`. **Vercel manda
solo el header `Authorization: Bearer $CRON_SECRET`** — por eso con setear `CRON_SECRET`
en las env, el endpoint lo autentica automáticamente. No hace falta el contenedor docker
en prod.

> ⚠️ **Plan**: el cron cada `*/5` (5 min) requiere **Vercel Pro**. En el plan **Hobby
> (free) los crons corren 1 vez por día**. Opciones si estás en Hobby:
> - Subir a Pro, o
> - Cambiar el schedule en `vercel.json` a algo diario, o
> - Usar un cron externo gratis (cron-job.org) que pegue cada 5 min a
>   `https://tu-app.vercel.app/api/cron/ingest` con el header `Authorization: Bearer <CRON_SECRET>`.

---

## Resumen de comandos (todo de una)

```bash
# 1. schema en la DB de prod (una vez)
DATABASE_URL='<URL-pooled-de-neon>' npm run db:sync

# 2. login + vincular + env vars
vercel login
vercel link
vercel env add DATABASE_URL production
vercel env add APP_ENCRYPTION_KEY production
vercel env add CRON_SECRET production
vercel env add APP_TZ production

# 3. deploy
vercel --prod
```

## Notas / gotchas
- **nginx no va a prod**: era solo para el proxy local (`localhost:8080 → 3009`). En
  Vercel el dominio pega directo a Next.
- **`allowedOrigins` en `next.config.ts`** tiene `localhost:*` (para el dev). En prod las
  Server Actions son same-origin y andan solas. Si Vercel reportara un error de CSRF en el
  login, agregá tu dominio de Vercel a ese array y re-deployá.
- **Primer uso en prod**: la DB arranca vacía. Entrás a `/login`, te logueás con tu cuenta
  Felicity, y el sync trae tus plantas. Después el cron mantiene la data fresca.
- **Backfill histórico** (opcional): para traer el histórico a la DB de prod, corré una vez
  `DATABASE_URL='<prod>' npm run backfill` desde tu máquina, tras loguearte una vez en prod.
- No corrí `next build` local (regla del proyecto). Vercel buildea en su infra; si querés
  pre-chequear, `npm run build`.
