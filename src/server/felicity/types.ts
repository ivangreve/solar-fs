/** Envelope estándar de la API de Felicity. `code === 200` = éxito. */
export interface FelicityEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

/** Datos relevantes de la respuesta de login. */
export interface FelicityLoginData {
  token: string; // "Bearer_eyJ..." (se usa tal cual en Authorization)
  userName: string;
  realName: string;
  orgCode: string;
  orgId: string;
  orgName: string;
  countryName: string;
  [k: string]: unknown;
}

/** Fila de tiempo CANÓNICA — lo que el resto de la app consume (limpio). */
export interface CanonicalTelemetry {
  deviceSn: string;
  ts: Date;
  pvPowerW: number | null;
  pv1PowerW: number | null;
  pv2PowerW: number | null;
  pv3PowerW: number | null;
  pv4PowerW: number | null;
  loadPowerW: number | null;
  gridInPowerW: number | null;
  feedPowerW: number | null;
  battChargeW: number | null;
  battDischargeW: number | null;
  socPct: number | null;
  battVolt: number | null;
  battCurr: number | null;
  acOutPowerW: number | null;
  acOutVolt: number | null;
  acOutFreq: number | null;
  tempMax: number | null;
  mosTemp: number | null;
  pvTemp: number | null;
  eTodayKwh: number | null;
  ePvTodayKwh: number | null;
  eLoadTodayKwh: number | null;
  eGridInTodayKwh: number | null;
  eGridFeedTodayKwh: number | null;
  eBatCharTodayKwh: number | null;
  eBatDisCharTodayKwh: number | null;
  // Generador a nafta (vienen 0 en estos equipos; mapeados para soporte futuro)
  genPowerW: number | null;
  genTodayKwh: number | null;
  genTotalKwh: number | null;
}

/** Salud (cambia lento; el histórico de Felicity NO la trae fiable → captura propia). */
export interface CanonicalHealth {
  deviceSn: string;
  ts: Date;
  sohPct: number | null;
  cycleIndex: number | null;
  fullCount: number | null;
  cellVoltSpreadMv: number | null;
  cellTempMax: number | null;
  faultCode: string | null;
  warningCount: number | null;
  wifiSignal: number | null;
}
