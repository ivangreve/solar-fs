import type { DataSource } from "typeorm";
import { FelicityClient } from "../felicity/client";
import { Device } from "../db/entities/Device";
import { Plant } from "../db/entities/Plant";
import { User } from "../db/entities/User";
import { decryptSecret } from "./secretbox";
import { syncPlantsAndDevices, ingestSnapshots, rollupDay } from "../ingest/ingest";
import { localToday } from "../time";
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

export type UserResult = { userName: string; snapshots?: number; error?: string };

/**
 * Ingesta en vivo para TODOS los usuarios: snapshot + rollup del día de sus dispositivos.
 * Aísla errores por usuario (una contraseña caduca no tumba al resto).
 */
export async function ingestAllUsers(ds: DataSource): Promise<UserResult[]> {
  const today = localToday();
  const results: UserResult[] = [];

  for (const user of await ds.getRepository(User).find()) {
    try {
      const api = clientForUser(user);
      const devices = await devicesForUser(ds, user.id);
      const snapshots = await ingestSnapshots(ds, api, devices);
      for (const dev of devices) await rollupDay(ds, dev.deviceSn, today);
      results.push({ userName: user.felicityUserName, snapshots });
    } catch (err) {
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
