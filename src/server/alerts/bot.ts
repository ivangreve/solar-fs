import type { DataSource } from "typeorm";
import { APP_TZ, localToday } from "../time";

/**
 * Comandos del bot de Telegram (/estado, /resumen). Texto HTML listo para enviar.
 * Sin scoping por usuario: el bot es del dueño del sistema (TELEGRAM_CHAT_ID),
 * mismo criterio que el motor de alertas.
 */

const nf = (d: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const kwh = (n: number) => `${nf(1).format(n)} kWh`;
const w = (n: number) => (n >= 1000 ? `${nf(2).format(n / 1000)} kW` : `${nf(0).format(n)} W`);

function hhmm(): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: APP_TZ, hour: "2-digit", minute: "2-digit" }).format(new Date());
}

type LiveRow = {
  device_sn: string;
  model: string | null;
  role: string;
  plant_id: string;
  plant_name: string;
  mins_ago: number | null;
  pv: number | null;
  load: number | null;
  soc: number | null;
  gen_w: number | null;
};

/** Último dato de cada dispositivo, con planta (mismo shape que usa el motor de alertas). */
async function liveRows(ds: DataSource): Promise<LiveRow[]> {
  return ds.query(
    `SELECT DISTINCT ON (d.device_sn)
        d.device_sn, d.model, d.role, d.plant_id, p.name AS plant_name,
        EXTRACT(EPOCH FROM (now() - t.ts)) / 60 AS mins_ago,
        t.pv_power_w AS pv, t.load_power_w AS load, t.soc_pct AS soc, t.gen_power_w AS gen_w
     FROM devices d
     JOIN plants p ON p.id = d.plant_id
     LEFT JOIN telemetry t ON t.device_sn = d.device_sn
     ORDER BY d.device_sn, t.ts DESC`,
  );
}

/** /estado — foto del sistema en este momento. */
export async function buildEstado(ds: DataSource): Promise<string> {
  const rows = await liveRows(ds);
  if (!rows.length) return "Todavía no hay dispositivos sincronizados.";

  const parts: string[] = [];
  for (const plantId of new Set(rows.map((r) => r.plant_id))) {
    const inPlant = rows.filter((r) => r.plant_id === plantId);
    const name = inPlant[0]?.plant_name ?? "Planta";
    const pvNow = inPlant.reduce((s, r) => s + Number(r.pv ?? 0), 0);
    const loadNow = inPlant.reduce((s, r) => s + Number(r.load ?? 0), 0);
    const genW = Number(inPlant.find((r) => r.role === "inverter")?.gen_w ?? 0);
    const bats = inPlant.filter((r) => r.role === "battery" && r.soc != null);
    const socAvg = bats.length
      ? Math.round(bats.reduce((s, r) => s + Number(r.soc), 0) / bats.length)
      : null;

    const lines = [
      `📟 <b>${name}</b> · estado ${hhmm()}`,
      `☀️ FV: <b>${w(pvNow)}</b> · 🏠 Consumo: <b>${w(loadNow)}</b>`,
    ];
    if (socAvg != null) {
      const detail = bats.map((b) => `${Math.round(Number(b.soc))}%`).join(" · ");
      lines.push(`🔋 Batería: <b>${socAvg}%</b>${bats.length > 1 ? ` (${detail})` : ""}`);
    }
    lines.push(genW > 100 ? `⛽ Generador: <b>ENCENDIDO</b> (${w(genW)})` : `⛽ Generador: apagado`);

    for (const d of inPlant) {
      if (d.role === "meter") continue;
      const label = d.model ?? d.device_sn;
      const mins = d.mins_ago != null ? Math.round(Number(d.mins_ago)) : null;
      lines.push(
        mins != null && mins <= 35
          ? `✅ ${label} · hace ${mins} min`
          : `⚠️ ${label} · sin reportar hace ${mins ?? "?"} min`,
      );
    }
    parts.push(lines.join("\n"));
  }
  return parts.join("\n\n");
}

/** /resumen — cómo viene el día (agregados de hoy + estado actual de batería). */
export async function buildResumen(ds: DataSource): Promise<string> {
  const today = localToday();
  const rows = await liveRows(ds);
  if (!rows.length) return "Todavía no hay dispositivos sincronizados.";

  const parts: string[] = [];
  for (const plantId of new Set(rows.map((r) => r.plant_id))) {
    const inPlant = rows.filter((r) => r.plant_id === plantId);
    const name = inPlant[0]?.plant_name ?? "Planta";

    const [agg]: Array<Record<string, string>> = await ds.query(
      `SELECT COALESCE(SUM(e_pv_kwh),0) e_pv, COALESCE(SUM(e_load_kwh),0) e_load,
              COALESCE(SUM(e_gen_kwh),0) e_gen, COALESCE(SUM(e_grid_in_kwh),0) e_gin,
              COALESCE(SUM(savings),0) savings
       FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
       WHERE d.plant_id = $1 AND ds.day = $2`,
      [plantId, today],
    );
    const [peak]: Array<Record<string, string | null>> = await ds.query(
      `SELECT MAX(t.pv_power_w) pv_peak, MIN(t.soc_pct) soc_min, MAX(t.soc_pct) soc_max
       FROM telemetry t JOIN devices d ON d.device_sn = t.device_sn
       WHERE d.plant_id = $1 AND (t.ts AT TIME ZONE $2)::date = $3::date`,
      [plantId, APP_TZ, today],
    );

    const ePv = Number(agg.e_pv);
    const eLoad = Number(agg.e_load);
    const eGen = Number(agg.e_gen);
    const eGin = Number(agg.e_gin);
    const savings = Number(agg.savings);
    const autosuf = eLoad > 0 ? Math.round(((eLoad - eGin) / eLoad) * 100) : null;
    const bats = inPlant.filter((r) => r.role === "battery" && r.soc != null);
    const socAvg = bats.length
      ? Math.round(bats.reduce((s, r) => s + Number(r.soc), 0) / bats.length)
      : null;

    const lines = [
      `☀️ <b>${name}</b> · resumen de hoy (${hhmm()})`,
      `⚡ Generación: <b>${kwh(ePv)}</b>${peak?.pv_peak ? ` · pico ${w(Number(peak.pv_peak))}` : ""}`,
      `🏠 Consumo: <b>${kwh(eLoad)}</b>${autosuf != null ? ` · autosuficiencia <b>${autosuf}%</b>` : ""}`,
    ];
    if (socAvg != null) {
      const rango =
        peak?.soc_min != null && peak?.soc_max != null
          ? ` · rango del día ${Math.round(Number(peak.soc_min))}–${Math.round(Number(peak.soc_max))}%`
          : "";
      lines.push(`🔋 Batería ahora: <b>${socAvg}%</b>${rango}`);
    }
    lines.push(eGen > 0 ? `⛽ Generador: ${kwh(eGen)} aportados` : `⛽ Generador: sin uso hoy`);
    if (savings > 0) lines.push(`💰 Ahorro estimado: <b>${nf(2).format(savings)}</b>`);
    parts.push(lines.join("\n"));
  }
  return parts.join("\n\n");
}

export const HELP_TEXT = [
  "¡Hola! Soy <b>ivo-solar</b> ☀️ Comandos:",
  "/estado — foto del sistema en este momento",
  "/resumen — cómo viene el día (generación, consumo, batería)",
  "",
  "Además te aviso solo cuando pasa algo importante: batería baja, equipo sin reportar, generador encendido o temperatura alta.",
].join("\n");
