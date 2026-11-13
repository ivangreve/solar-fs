/**
 * Tokens del design system compartido. Tema oscuro, limpio.
 * Colores por canal de energía + helpers de formato (consistentes en toda la app).
 */

/** Colores crudos (para charts/SVG, que no leen CSS vars). Para texto/UI usar ACCENT_TEXT / ACCENT_VAR. */
export const ENERGY_COLORS = {
  solar: "#ffb224",
  battery: "#35d0a0",
  grid: "#5ab4f2",
  load: "#8ea6ff",
  generator: "#ff7b54",
  money: "#d6dde8",
} as const;

export type EnergyAccent = keyof typeof ENERGY_COLORS;

/** Clase Tailwind de texto por acento (para tiles/labels). */
export const ACCENT_TEXT: Record<EnergyAccent, string> = {
  solar: "text-[var(--c-solar)]",
  battery: "text-[var(--c-battery)]",
  grid: "text-[var(--c-grid)]",
  load: "text-[var(--c-load)]",
  generator: "text-[var(--c-generator)]",
  money: "text-[var(--c-money)]",
};

/** Variable CSS por acento (cambia con el tema → contraste correcto en claro y oscuro). */
export const ACCENT_VAR: Record<EnergyAccent, string> = {
  solar: "var(--c-solar)",
  battery: "var(--c-battery)",
  grid: "var(--c-grid)",
  load: "var(--c-load)",
  generator: "var(--c-generator)",
  money: "var(--c-money)",
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
