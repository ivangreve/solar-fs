import type { DataSource } from "typeorm";
import { FelicityClient } from "../felicity/client";
import { Device } from "../db/entities/Device";
import { Plant } from "../db/entities/Plant";
import { Session } from "../db/entities/Session";
import { User } from "../db/entities/User";
import { decryptSecret, CredencialIndescifrable } from "./secretbox";
import { syncPlantsAndDevices, ingestSnapshots, rollupDay, backfillDevice } from "../ingest/ingest";
import { localToday, nextDay, APP_TZ } from "../time";
import { checkAlerts, checkIngestAlerts } from "../alerts/check";

/** Cliente Felicity de un usuario (desencripta su contraseña guardada). */
export function clientForUser(user: User): FelicityClient {
  return new FelicityClient(user.felicityUserName, decryptSecret(user.passwordEnc));
}

/** Dispositivos que pertenecen a un usuario (join devices → plants por owner). */
export function devicesForUser(ds: DataSource, userId: string): Promise<Device[]> {
  return ds
    .getRepository(Device)
    .createQueryBuilder("d")
    .innerJoin(Plant, "p", "p.id = d.plant_id")
    .where("p.owner_user_id = :uid", { uid: userId })
    .getMany();
}

export type UserResult = { userName: string; snapshots?: number; backfilled?: number; error?: string };

/** Día local (APP_TZ) de un instante, como "YYYY-MM-DD". */
const localDayOf = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const GAP_MIN = 30; // hueco que dispara el catch-up
const CATCHUP_MAX_DAYS = 3; // tope: huecos más viejos se recuperan con npm run backfill

/**
 * Si un dispositivo tiene un hueco de datos (ingesta caída un rato), lo rellena desde el
 * histórico de Felicity y recalcula los rollups de los días afectados. Acotado por
 * `deadline`: lo que no entra en este ciclo lo continúa el siguiente (upserts idempotentes).
 */
async function catchUpGaps(
  ds: DataSource,
  api: FelicityClient,
  devices: Device[],
  deadline: number,
): Promise<number> {
  const today = localToday();
  let total = 0;
  for (const dev of devices) {
    if (Date.now() > deadline) break;
    // El snapshot en vivo ya se ingestó (hay un dato ~ahora). El hueco se detecta
    // mirando su PREDECESOR: el dato más nuevo de hace >10 min. Si quedó lejos, hay agujero.
    const [prev]: Array<{ ts: string | null }> = await ds.query(
      `SELECT max(ts)::text AS ts FROM telemetry WHERE device_sn = $1 AND ts < now() - interval '10 minutes'`,
      [dev.deviceSn],
    );
    if (!prev?.ts) continue; // sin histórico previo → eso es backfill inicial manual
    const gapMin = (Date.now() - new Date(prev.ts).getTime()) / 60_000;
    if (gapMin <= GAP_MIN) continue;

    // Rellenar desde el día (local) del último dato previo al hueco, con tope de antigüedad.
    let fromDay = localDayOf(new Date(prev.ts));
    const oldest = localDayOf(new Date(Date.now() - CATCHUP_MAX_DAYS * 86_400_000));
    if (fromDay < oldest) fromDay = oldest;

    const n = await backfillDevice(ds, api, dev, fromDay, deadline).catch((err) => {
      console.error(`[catch-up] ${dev.deviceSn}:`, (err as Error).message);
      return 0;
    });
    total += n;
    if (n > 0) {
      for (let d = fromDay; d <= today; d = nextDay(d)) await rollupDay(ds, dev.deviceSn, d);
    }
  }
  return total;
}

/**
 * Ingesta en vivo para TODOS los usuarios: snapshot + rollup del día de sus dispositivos.
 * Aísla errores por usuario (una contraseña caduca no tumba al resto).
 */
export async function ingestAllUsers(ds: DataSource): Promise<UserResult[]> {
  const today = localToday();
  const results: UserResult[] = [];
  const deadline = Date.now() + 45_000; // presupuesto serverless (maxDuration 60s, margen)

  for (const user of await ds.getRepository(User).find()) {
    try {
      const api = clientForUser(user);
      const devices = await devicesForUser(ds, user.id);
      const snapshots = await ingestSnapshots(ds, api, devices);
      for (const dev of devices) await rollupDay(ds, dev.deviceSn, today);
      // Recupera huecos (ingesta caída un rato) desde el histórico de Felicity.
      const backfilled = await catchUpGaps(ds, api, devices, deadline).catch((err) => {
        console.error("[catch-up]", (err as Error).message);
        return 0;
      });
      results.push({ userName: user.felicityUserName, snapshots, ...(backfilled ? { backfilled } : {}) });
    } catch (err) {
      // Credencial indescifrable: cerrar las sesiones web del usuario para forzar el
      // re-login, que es la ÚNICA recuperación posible (re-encripta con la clave actual).
      if (err instanceof CredencialIndescifrable) {
        await ds.getRepository(Session).delete({ userId: user.id }).catch(() => {});
      }
      results.push({ userName: user.felicityUserName, error: (err as Error).message });
    }
  }

  // Alertas tras la ingesta (Telegram; no-op si no está configurado, nunca tumba el cron)
  await checkIngestAlerts(ds, results).catch((err) => console.error("[alerts]", (err as Error).message));
  await checkAlerts(ds).catch((err) => console.error("[alerts]", (err as Error).message));

  return results;
}

/** Re-sincroniza plantas y dispositivos (metadata) de todos los usuarios. */
export async function syncAllUsers(ds: DataSource): Promise<UserResult[]> {
  const results: UserResult[] = [];
  for (const user of await ds.getRepository(User).find()) {
    try {
      const api = clientForUser(user);
      const devices = await syncPlantsAndDevices(ds, api, user.id);
      results.push({ userName: user.felicityUserName, snapshots: devices.length });
    } catch (err) {
      results.push({ userName: user.felicityUserName, error: (err as Error).message });
    }
  }
  return results;
}
