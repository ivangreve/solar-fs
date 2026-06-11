/**
 * Tokens del design system compartido. Tema oscuro, limpio.
 * Colores por canal de energía + helpers de formato (consistentes en toda la app).
 */

export const ENERGY_COLORS = {
  solar: "#fbbf24",
  battery: "#34d399",
  grid: "#38bdf8",
  load: "#a78bfa",
  generator: "#fb923c",
  money: "#f472b6",
} as const;

export type EnergyAccent = keyof typeof ENERGY_COLORS;

/** Clase Tailwind de texto por acento (para tiles/labels). */
export const ACCENT_TEXT: Record<EnergyAccent, string> = {
  solar: "text-amber-400",
  battery: "text-emerald-400",
  grid: "text-sky-400",
  load: "text-violet-400",
  generator: "text-orange-400",
  money: "text-pink-400",
};

const nf = (d: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: d, minimumFractionDigits: 0 });

/** Energía en kWh con sufijo. `null`/NaN → "—". */
export function fmtKwh(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${nf(decimals).format(value)} kWh`;
}

/** Potencia en W o kW (auto-escala a kW si >= 1000). `null`/NaN → "—". */
export function fmtW(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value >= 1000 ? `${nf(2).format(value / 1000)} kW` : `${nf(0).format(value)} W`;
}

/** Porcentaje. `null`/NaN → "—". */
export function fmtPct(value: number | null | undefined, decimals = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${nf(decimals).format(value)} %`;
}

/** Monto con moneda (la moneda va como sufijo, ej "1.234,56 USD"). `null`/NaN → "—". */
export function fmtMoney(value: number | null | undefined, currency = "USD"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${nf(2).format(value)} ${currency}`;
}
