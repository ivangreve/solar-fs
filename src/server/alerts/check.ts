import type { DataSource } from "typeorm";
import type { UserResult } from "../auth/ingest-users";
import { AlertState } from "../db/entities/AlertState";
import { telegramEnabled, sendTelegram } from "./telegram";
import { APP_TZ } from "../time";

/**
 * Motor de alertas. Corre tras cada ingesta (cron 5 min). Cada regla tiene estado
 * (AlertState) con HISTÉRESIS: dispara al cruzar el umbral y se re-arma recién cuando
 * la condición vuelve claramente a la normalidad — así no spamea ni oscila.
 * Umbrales configurables por env (defaults razonables para off-grid).
 */
const SOC_LOW = Number(process.env.ALERT_SOC_LOW ?? 20); // dispara
const SOC_REARM = SOC_LOW + 10; //                          re-arma
const OFFLINE_MIN = Number(process.env.ALERT_OFFLINE_MIN ?? 35);
const GEN_ON_W = 100;
const GEN_OFF_W = 50;
const TEMP_HIGH = Number(process.env.ALERT_TEMP_HIGH ?? 55);
const TEMP_REARM = TEMP_HIGH - 7;

type DeviceRow = {
  device_sn: string;
  model: string | null;
  role: string;
  plant_id: string;
  plant_name: string;
  ts: string | null;
  mins_ago: number | null;
  soc: number | null;
  gen_w: number | null;
  temp: number | null;
};

async function transition(
  ds: DataSource,
  ruleKey: string,
  condition: boolean,
  rearm: boolean,
  fireMsg: string,
  recoverMsg?: string,
): Promise<void> {
  const repo = ds.getRepository(AlertState);
  const state = await repo.findOneBy({ ruleKey });
  const active = state?.active ?? false;

  if (condition && !active) {
    if (await sendTelegram(fireMsg)) {
      await repo.upsert({ ruleKey, active: true, lastSentAt: new Date() }, ["ruleKey"]);
    }
  } else if (rearm && active) {
    if (recoverMsg) await sendTelegram(recoverMsg);
    await repo.upsert({ ruleKey, active: false, lastSentAt: state?.lastSentAt ?? null }, ["ruleKey"]);
  }
}

/** Hora local corta para los mensajes. */
function hhmm(): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: APP_TZ, hour: "2-digit", minute: "2-digit" }).format(new Date());
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Alerta de ingesta caída POR USUARIO, con la acción para resolverla en el mensaje.
 * Mismo esquema de histéresis: avisa al entrar en falla y al recuperarse.
 */
export async function checkIngestAlerts(ds: DataSource, results: UserResult[]): Promise<void> {
  if (!telegramEnabled()) return;
  for (const r of results) {
    const failing = r.error != null;
    const hint =
      r.error?.includes("Unsupported state") || r.error?.includes("unable to authenticate")
        ? "\n👉 Entrá a solar-fs.vercel.app, cerrá sesión y volvé a iniciarla — eso re-encripta tu contraseña de Felicity y la ingesta revive sola."
        : "\n👉 Si persiste varios ciclos, revisá las credenciales de Felicity o el estado de su API.";
    await transition(
      ds,
      `ingest_fail:${r.userName}`,
      failing,
      !failing,
      `🛑 <b>Ingesta caída</b> (${r.userName}) · ${hhmm()}\n<i>${escapeHtml(r.error ?? "")}</i>${hint}`,
      `✅ <b>Ingesta recuperada</b> (${r.userName}) — los datos vuelven a fluir · ${hhmm()}`,
    );
  }
}

export async function checkAlerts(ds: DataSource): Promise<void> {
  if (!telegramEnabled()) return;

  // Último dato de cada dispositivo + planta (una sola query)
  const rows: DeviceRow[] = await ds.query(
    `SELECT DISTINCT ON (d.device_sn)
        d.device_sn, d.model, d.role, d.plant_id, p.name AS plant_name,
        t.ts::text AS ts,
        EXTRACT(EPOCH FROM (now() - t.ts)) / 60 AS mins_ago,
        t.soc_pct AS soc, t.gen_power_w AS gen_w, t.temp_max AS temp
     FROM devices d
     JOIN plants p ON p.id = d.plant_id
     LEFT JOIN telemetry t ON t.device_sn = d.device_sn
     ORDER BY d.device_sn, t.ts DESC`,
  );

  for (const plantId of new Set(rows.map((r) => r.plant_id))) {
    const inPlant = rows.filter((r) => r.plant_id === plantId);
    const name = inPlant[0]?.plant_name ?? "Planta";

    // ── SOC bajo (promedio del banco) ──
    const socs = inPlant.filter((r) => r.role === "battery" && r.soc != null).map((r) => Number(r.soc));
    if (socs.length) {
      const avg = Math.round(socs.reduce((a, b) => a + b, 0) / socs.length);
      await transition(
        ds,
        `soc_low:${plantId}`,
        avg < SOC_LOW,
        avg >= SOC_REARM,
        `🔋 <b>${name}</b>: batería baja — SOC ${avg}% (umbral ${SOC_LOW}%) · ${hhmm()}`,
        `✅ <b>${name}</b>: batería recuperada — SOC ${avg}%`,
      );
    }

    // ── Generador encendido/apagado ──
    const inv = inPlant.find((r) => r.role === "inverter");
    if (inv) {
      const genW = Number(inv.gen_w ?? 0);
      await transition(
        ds,
        `gen_on:${plantId}`,
        genW > GEN_ON_W,
        genW < GEN_OFF_W,
        `⛽ <b>${name}</b>: generador ENCENDIDO (${Math.round(genW)} W) · ${hhmm()}`,
        `⛽ <b>${name}</b>: generador apagado`,
      );
    }

    // ── Por dispositivo: offline y temperatura ──
    for (const d of inPlant) {
      if (d.role === "meter") continue; // el colector reporta poco; no alertar
      const label = d.model ?? d.device_sn;
      const mins = d.mins_ago != null ? Math.round(Number(d.mins_ago)) : null;

      await transition(
        ds,
        `offline:${d.device_sn}`,
        mins == null || mins > OFFLINE_MIN,
        mins != null && mins <= 10,
        `📡 <b>${name}</b>: ${label} sin reportar hace ${mins ?? "?"} min · ${hhmm()}`,
        `✅ <b>${name}</b>: ${label} volvió a reportar`,
      );

      if (d.role === "inverter" && d.temp != null) {
        const t = Number(d.temp);
        await transition(
          ds,
          `temp_high:${d.device_sn}`,
          t > TEMP_HIGH,
          t < TEMP_REARM,
          `🌡️ <b>${name}</b>: ${label} a ${Math.round(t)}°C (umbral ${TEMP_HIGH}°C) · ${hhmm()}`,
        );
      }
    }
  }
}
