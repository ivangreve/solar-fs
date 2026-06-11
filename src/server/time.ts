/**
 * Zona horaria del equipo. Los timestamps se guardan en UTC (timestamptz), pero
 * la hora que se MUESTRA y los días que se BUCKETEAN deben ser los del lugar donde
 * está el sistema. Configurable por env APP_TZ; default Argentina (UTC-3, sin DST).
 *
 * Uso en SQL: `to_char(ts AT TIME ZONE $tz, 'HH24:MI')` y comparaciones de día
 * contra `(ts AT TIME ZONE $tz)`.
 */
export const APP_TZ = process.env.APP_TZ || "America/Argentina/Buenos_Aires";

/** "YYYY-MM-DD" del día de HOY en la zona del equipo (no en UTC). */
export function localToday(): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Día siguiente a un "YYYY-MM-DD" (aritmética en UTC para no arrastrar TZ). */
export function nextDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
