import type { CanonicalTelemetry, CanonicalHealth } from "./types";

/** Castea string/null/"0.0" a número seguro (o null). Felicity manda todo como string. */
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

type Raw = Record<string, unknown>;

/** Toma el primer campo no-nulo de una lista de posibles nombres (live vs histórico). */
function pick(r: Raw, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = num(r[k]);
    if (v !== null) return v;
  }
  return null;
}

/**
 * Como pick, pero salta los 0 (los trata como "sin dato"). Para `load`: algunos
 * equipos off-grid reportan `loadPower: 0` (sin sensor de carga dedicado) y el
 * consumo real está en `acTotalOutActPower`. Devuelve el primer valor > 0, o 0 si
 * todos son 0/nulos.
 */
function pickPos(r: Raw, ...keys: string[]): number | null {
  let sawZero = false;
  for (const k of keys) {
    const v = num(r[k]);
    if (v !== null && v > 0) return v;
    if (v === 0) sawZero = true;
  }
  return sawZero ? 0 : null;
}

/**
 * Potencia de carga/descarga de batería a partir del campo con signo.
 * emsPower (inversor) o bmsPower (batería): positivo = descarga, negativo = carga.
 * Si no hay campo con signo, cae a los batteryCharging/Discharge (que suelen ser 0).
 */
function signedBattCharge(r: Raw, want: "charge" | "discharge"): number | null {
  const signed = pick(r, "emsPower", "bmsPower");
  if (signed !== null) return want === "charge" ? Math.max(0, -signed) : Math.max(0, signed);
  return want === "charge"
    ? pick(r, "batteryCharging", "bmsPowerCharging")
    : pick(r, "batteryDischarge", "bmsPowerDischarge");
}

/**
 * Normaliza un snapshot/fila de Felicity a nuestro modelo canónico.
 *
 * GOTCHA documentado: los nombres difieren entre la respuesta en vivo
 * (`get_device_snapshot`) y el histórico (`list_storageRealtimeData_new`):
 *   SOC   → vivo `battSoc` | histórico `emsSoc`
 *   PV    → vivo `pvTotalPower` | histórico `pvElectricity`
 *   carga → vivo `loadPower` | histórico `loadConsumption`
 *   red   → vivo `acTtlInPower`/`gridInputPower` | histórico `gridInput`
 *   feed  → vivo `feedPower` | histórico `feedOutput`
 */
export function toCanonicalTelemetry(deviceSn: string, ts: Date, r: Raw): CanonicalTelemetry {
  return {
    deviceSn,
    ts,
    pvPowerW: pick(r, "pvTotalPower", "pvElectricity"),
    pv1PowerW: pick(r, "pvPower", "pv1Power"),
    pv2PowerW: pick(r, "pv2Power"),
    pv3PowerW: pick(r, "pv3Power"),
    pv4PowerW: pick(r, "pv4Power"),
    // En off-grid (OG) la salida AC del inversor ≈ el consumo de la casa. `loadPower`
    // suele venir 0 (sin sensor dedicado), así que pickPos cae a acTotalOutActPower.
    loadPowerW: pickPos(r, "loadPower", "loadConsumption", "totalConsumPower", "acTotalOutActPower", "totalOutPutPower"),
    // Full off-grid: NO hay red. La entrada AC es el generador (ver genPowerW).
    gridInPowerW: pick(r, "gridInputPower", "gridInput"),
    feedPowerW: pick(r, "feedPower", "feedOutput"),
    // batteryCharging/batteryDischarge vienen 0 en estos equipos; la carga/descarga
    // real se estima en el rollup a partir del balance de energía (más robusto que el
    // signo de emsPower, que resultó inconsistente entre días). Guardamos lo crudo.
    battChargeW: pick(r, "batteryCharging", "bmsPowerCharging"),
    battDischargeW: pick(r, "batteryDischarge", "bmsPowerDischarge"),
    socPct: pick(r, "battSoc", "emsSoc"),
    battVolt: pick(r, "battVolt", "emsVoltage"),
    battCurr: pick(r, "battCurr", "emsCurrent"),
    acOutPowerW: pick(r, "acTotalOutActPower", "totalOutPutPower"),
    acOutVolt: pick(r, "acROutVolt", "acUOutVolt"),
    acOutFreq: pick(r, "acROutFreq"),
    tempMax: pick(r, "tempMax", "devTempMax"),
    mosTemp: pick(r, "mosTemp"),
    pvTemp: pick(r, "pvTemp"),
    eTodayKwh: pick(r, "eToday"),
    ePvTodayKwh: pick(r, "ePvToday", "pvElectricityToday"),
    eLoadTodayKwh: pick(r, "eLoadToday"),
    eGridInTodayKwh: pick(r, "eGridInToday", "gridInputToday"),
    eGridFeedTodayKwh: pick(r, "eGridFeedToday", "feedOutputToday"),
    eBatCharTodayKwh: pick(r, "eBatCharToday", "ebatCharToday"),
    eBatDisCharTodayKwh: pick(r, "eBatDisCharToday", "ebatDisCharToday"),
    // Full off-grid: el generador entra como AC input. El campo correcto es
    // `acTtlInpower` (ojo: 'p' minúscula) / `acRInPower`; los gen* dedicados vienen 0.
    genPowerW: pick(r, "genPower", "genTotalPower", "acTtlInpower", "acRInPower"),
    genTodayKwh: pick(r, "genToday"),
    genTotalKwh: pick(r, "genTotal"),
  };
}

/** Spread de voltaje entre celdas (mV) — early warning de celda en falla. */
function cellSpreadMv(r: Raw): number | null {
  const cells: number[] = [];
  for (let i = 1; i <= 16; i++) {
    const v = num(r[`cellVolt${i}`]);
    if (v !== null && v > 0) cells.push(v);
  }
  if (cells.length < 2) return null;
  const spread = Math.max(...cells) - Math.min(...cells);
  // los voltajes vienen en V (ej 3.2) → a mV
  return Math.round(spread * 1000);
}

export function toCanonicalHealth(deviceSn: string, ts: Date, r: Raw): CanonicalHealth {
  const cellTemps: number[] = [];
  for (let i = 1; i <= 8; i++) {
    const t = num(r[`cellTemp${i}`]);
    if (t !== null) cellTemps.push(t);
  }
  return {
    deviceSn,
    ts,
    sohPct: pick(r, "battSoh", "emsSoh"),
    cycleIndex: pick(r, "batCycleIndex"),
    fullCount: pick(r, "batFullCount"),
    cellVoltSpreadMv: cellSpreadMv(r),
    cellTempMax: cellTemps.length ? Math.max(...cellTemps) : pick(r, "cellTempMax"),
    faultCode: r["failCode"] != null && r["failCode"] !== "" ? String(r["failCode"]) : null,
    warningCount: pick(r, "warningCount"),
    wifiSignal: pick(r, "wifiSignal"),
  };
}
