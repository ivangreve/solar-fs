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
