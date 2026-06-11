import { getDataSource } from "./db/data-source";
import { APP_TZ } from "./time";

export type ForecastDay = {
  day: string; // YYYY-MM-DD
  estKwh: number;
  radiation: number; // MJ/m²
};

export type SolarForecast = {
  days: ForecastDay[]; // hoy + próximos 3
  /** Días reales usados para calibrar (menos de 5 = estimación floja). */
  calibrationDays: number;
};

/**
 * Pronóstico de generación: radiación de Open-Meteo (gratis, sin key) CALIBRADA contra
 * la generación real de la planta. Una sola llamada trae 14 días pasados + 4 futuros;
 * el factor kWh/(MJ/m²) sale de cruzar la radiación pasada con los rollups reales —
 * así el pronóstico absorbe la orientación, sombras y tamaño del sistema sin configurar nada.
 */
export async function getSolarForecast(
  plantId: string,
  lat: number,
  lon: number,
): Promise<SolarForecast | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=shortwave_radiation_sum&past_days=14&forecast_days=4&timezone=${encodeURIComponent(APP_TZ)}`;

  let data: { daily?: { time: string[]; shortwave_radiation_sum: Array<number | null> } };
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }
  const time = data.daily?.time ?? [];
  const rad = data.daily?.shortwave_radiation_sum ?? [];
  if (!time.length) return null;

  // Generación real por día (para calibrar)
  const ds = await getDataSource();
  const real: Array<{ day: string; e_pv: string }> = await ds.query(
    `SELECT ds.day::text AS day, COALESCE(SUM(e_pv_kwh),0) e_pv
     FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
     WHERE d.plant_id = $1 GROUP BY ds.day ORDER BY ds.day DESC LIMIT 20`,
    [plantId],
  );
  const realByDay = new Map(real.map((r) => [r.day, Number(r.e_pv)]));

  // factor = mediana de (kWh real / radiación) en días con datos de ambos
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ }).format(new Date());
  const ratios: number[] = [];
  time.forEach((day, i) => {
    const r = rad[i];
    const e = realByDay.get(day);
    if (day < today && r != null && r > 1 && e != null && e > 0.05) ratios.push(e / r);
  });
  if (ratios.length < 2) return null; // sin un mínimo de calibración no pronosticamos
  ratios.sort((a, b) => a - b);
  const factor = ratios[Math.floor(ratios.length / 2)];

  const days: ForecastDay[] = [];
  time.forEach((day, i) => {
    const r = rad[i];
    if (day >= today && r != null) {
      days.push({ day, radiation: r, estKwh: Math.round(r * factor * 100) / 100 });
    }
  });

  return { days: days.slice(0, 4), calibrationDays: ratios.length };
}
