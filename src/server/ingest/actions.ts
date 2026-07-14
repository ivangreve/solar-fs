"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getDataSource } from "@/server/db/data-source";
import { requireUser } from "@/server/auth/session";
import { CredencialIndescifrable } from "@/server/auth/secretbox";
import { clientForUser, devicesForUser, catchUpHistory } from "@/server/auth/ingest-users";
import { ingestSnapshots, rollupDay } from "@/server/ingest/ingest";
import { localToday } from "@/server/time";

export type SyncResult = { ok: boolean; snapshots?: number; error?: string };

/**
 * Sync manual desde la app, con el usuario YA logueado (sin re-loguearse). Hace dos cosas:
 *  1) refresco inmediato: snapshot en vivo + rollup de hoy → lo ve al toque;
 *  2) dispara en segundo plano (after()) el catch-up del histórico faltante, igual que el
 *     login — idempotente y resumible, sin colgar la respuesta ni reventar el 996.
 * Reusa las credenciales de la sesión: `clientForUser` desencripta el password guardado.
 */
export async function syncNowAction(): Promise<SyncResult> {
  const user = await requireUser();
  const ds = await getDataSource();

  try {
    const api = clientForUser(user);
    const devices = await devicesForUser(ds, user.id);

    // Refresco inmediato (rápido): último snapshot + rollup del día en curso.
    const snapshots = await ingestSnapshots(ds, api, devices);
    const today = localToday();
    for (const dev of devices) await rollupDay(ds, dev.deviceSn, today);

    // Histórico faltante en background: no bloquea la respuesta del botón.
    after(async () => {
      try {
        const dsBg = await getDataSource();
        const devs = await devicesForUser(dsBg, user.id);
        const filled = await catchUpHistory(dsBg, api, devs, Date.now() + 45_000);
        if (filled) console.log(`[sync] catch-up histórico: ${filled} filas (${user.felicityUserName})`);
      } catch (err) {
        console.error("[sync] catch-up histórico falló:", (err as Error).message);
      }
    });

    revalidatePath("/");
    return { ok: true, snapshots };
  } catch (err) {
    // Credencial indescifrable: la clave de encriptación cambió → la única salida es
    // re-loguearse (re-encripta con la clave actual). Se lo decimos claro al usuario.
    if (err instanceof CredencialIndescifrable) {
      return { ok: false, error: "No pudimos descifrar tu credencial. Cerrá sesión y volvé a entrar." };
    }
    return { ok: false, error: (err as Error).message };
  }
}
