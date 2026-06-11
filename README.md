# ☀️ solar-fs — Off-grid solar dashboard (Felicity)

Monitoring dashboard for **Felicity Solar** systems, built for **off-grid**
installations (no utility grid): PV panels + inverter + battery bank + backup gasoline
generator. Multi-user: each person connects their own Felicity account and only sees
their plants.

**Live demo:** https://solar-fs.vercel.app

Unlike the official app, `solar-fs` keeps its **own time-series database** (5-minute
telemetry + daily rollups), enabling KPIs and history the Felicity cloud doesn't offer:
real self-sufficiency, generator energy contribution, battery charge/discharge balance
and estimated fuel cost.

![Plant overview](docs/screenshots/overview.png)

## Features

- 🔐 **Sign in with your Felicity account** — identity is validated against the
  Felicity API itself. Multi-user with per-owner isolation (you only see YOUR plants).
- 📊 **Overview** — animated daily KPIs (generation, self-sufficiency,
  self-consumption), live power and intraday curves (PV / generator / load / SOC).
- 🔌 **Devices** — system diagram with illustrations of the real hardware (IVEM
  inverter, FLA48100 batteries with live SOC ring) and animated energy flow.
- ⚡ **Energy** — source mix, daily Sankey diagram (kWh per node) and a 30-day
  generation/consumption comparison.
- 🔋 **Battery** — bank SOC, health (SOH), voltage and charge/discharge cycles
  estimated by energy balance.
- ⛽ **Generator** — energy contributed by gasoline, estimated liters and cost,
  share of consumption covered.
- 🌗 Light/dark theme (server-side cookie, no flash) · 🕐 timestamps in the system's
  local timezone (`APP_TZ`) · animations powered by `motion`.

| Home | Devices |
|------|---------|
| ![Home](docs/screenshots/home.png) | ![Devices](docs/screenshots/devices.png) |

![Energy](docs/screenshots/energy.png)

## Stack

Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · TypeScript · Tailwind ·
ECharts · TypeORM · PostgreSQL · Docker (dev) · Vercel + Neon (prod).

## Architecture

```
                                  ┌────────────────────────────────────────────┐
Felicity API ◄──(per-user client: RSA login + cached token)────────┐           │
                                  │                                │           │
   crons ──► /api/cron/ingest ──► per-user ingestion ──► Postgres (telemetry,  │
 (every 5min)  (CRON_SECRET)      + daily rollup           daily_stats, ...)   │
                                  │                                │           │
  browser ──► proxy.ts (cookie) ──► requireUser() ──► ownership-scoped queries ┘
              (optimistic check)    (DB-backed session)  (fail-closed, anti-IDOR)
```

- **`src/server/felicity/`** — API client (RSA login, automatic re-login) +
  normalization into a canonical model. *Known gotcha:* the snapshot's `dataTime`
  (epoch) is corrupted upstream; timestamps are parsed from `dataTimeStr` + `timeZone`.
- **`src/server/auth/`** — revocable sessions (DB table + httpOnly cookie),
  AES-256-GCM encryption of the Felicity password (reversible on purpose: the cron
  reuses it to re-login — that's why it is NOT a hash) and the per-user ingestion
  iterator.
- **`src/server/db/`** — entities: `User`, `Session`, `Plant` (with `ownerUserId`),
  `Device`, `Telemetry`, `DailyStat`, `HealthSnapshot`.
- **`src/server/ingest/`** — metadata sync, live snapshots, historical backfill
  (with pacing + retry against Felicity's 996 rate limit) and daily rollups.
- **`src/proxy.ts`** — early cookie-based redirect (Next 16 renamed middleware to
  proxy). Real authorization lives in `requireUser()` + per-owner filters in every
  query.

## Local development

### 1. Environment variables (`.env`)

```env
DATABASE_URL=postgres://solarfs:solarfs@localhost:5433/solarfs
APP_ENCRYPTION_KEY=   # openssl rand -base64 32 — encrypts stored Felicity passwords
CRON_SECRET=          # long random string — protects /api/cron/ingest
# APP_TZ=America/Argentina/Buenos_Aires   (default)
```

> ⚠️ Never rotate `APP_ENCRYPTION_KEY` once users exist: it decrypts the stored
> credentials. Without it, nobody can sign in.

### 2. Run everything

```bash
npm install
npm run db:up        # docker compose: Postgres (5433) + nginx (8080) + ingest crons
npm run db:sync      # creates the schema from the entities
PORT=3009 npm run dev
```

Open **http://localhost:8080** (nginx → next dev) and sign in with your Felicity
account. The first login syncs your plants; the `ingest` container keeps data fresh
every 5 minutes. For the full history: `npm run backfill`.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run db:up` / `db:down` | Docker stack (Postgres, nginx, crons) |
| `npm run db:sync` | Creates/updates the schema from the entities |
| `npm run sync:meta` | Re-syncs plants and devices (all users) |
| `npm run backfill [YYYY-MM-DD]` | 5-min history since installation + rollups |
| `npm run ingest` | Live snapshot + daily rollup (what the cron runs) |
| `npm run reroll` | Recomputes all rollups (e.g. after changing `APP_TZ`) |

## Production

Deployed on **Vercel** with **Neon** (managed Postgres). Step-by-step guide in
[`DEPLOY.md`](DEPLOY.md). Ingestion cron summary:

- `vercel.json` defines a **daily** cron (23:50 ART) — the Hobby plan doesn't allow
  higher frequency.
- For 5-minute freshness: the `ingest-prod` service in docker-compose (runs on your
  machine) or a GitHub Actions workflow hitting `/api/cron/ingest` with
  `Authorization: Bearer $CRON_SECRET`.

## Docs

- [`docs/PLAN_PRODUCTO.md`](docs/PLAN_PRODUCTO.md) — product plan and charts.
- [`docs/API_FELICITYSOLAR.md`](docs/API_FELICITYSOLAR.md) — reverse engineering of
  the Felicity API (endpoints, RSA login, useful fields).
- [`DEPLOY.md`](DEPLOY.md) — deploying to Vercel + Neon.

## Roadmap

- [ ] Date/range filter across all views
- [ ] Tariff onboarding + **Finance** section (real savings, payback)
- [ ] TypeORM migrations (currently: `db:sync`)
- [ ] Alerts (low SOC, device offline, generator running)
