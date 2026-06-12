import "reflect-metadata";
import { DataSource } from "typeorm";
import { Plant } from "./entities/Plant";
import { Device } from "./entities/Device";
import { Telemetry } from "./entities/Telemetry";
import { DailyStat } from "./entities/DailyStat";
import { HealthSnapshot } from "./entities/HealthSnapshot";
import { User } from "./entities/User";
import { Session } from "./entities/Session";
import { AlertState } from "./entities/AlertState";

const entities = [Plant, Device, Telemetry, DailyStat, HealthSnapshot, User, Session, AlertState];

export function createDataSource(opts: { synchronize?: boolean } = {}): DataSource {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en el entorno");

  // Guardrail: el dev server de Next (NODE_ENV=development) jamás se conecta a una DB
  // remota — un dev contra prod ya causó un incidente (credenciales re-encriptadas con
  // otra clave). Los scripts CLI (db-sync, backfill) corren sin NODE_ENV y no se ven
  // afectados. Escape intencional: ALLOW_REMOTE_DB=1.
  const esLocal = /localhost|127\.0\.0\.1|host\.docker\.internal/.test(url);
  if (process.env.NODE_ENV === "development" && !esLocal && process.env.ALLOW_REMOTE_DB !== "1") {
    throw new Error(
      "DEV apuntando a DB remota (¿prod?). Corregí DATABASE_URL en .env.local — " +
        "tip: mv .env.local .env.vercel-prod — o seteá ALLOW_REMOTE_DB=1 si es intencional.",
    );
  }
  return new DataSource({
    type: "postgres",
    url,
    entities,
    synchronize: opts.synchronize ?? false, // dev: usar script db:sync. prod: migraciones.
    logging: process.env.DB_LOGGING === "true",
  });
}

/**
 * Singleton inicializado para el server de Next (route handlers, runtime Node).
 * Evita reabrir conexiones en hot-reload de desarrollo.
 */
let _ds: DataSource | null = null;
let _init: Promise<DataSource> | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (_ds?.isInitialized) return _ds;
  if (!_init) {
    _ds = createDataSource();
    _init = _ds.initialize();
  }
  return _init;
}
