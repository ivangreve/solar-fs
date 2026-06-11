"use client";

import { motion } from "motion/react";
import { ACCENT_TEXT, ENERGY_COLORS, fmtKwh, fmtW, fmtPct, type EnergyAccent } from "./tokens";
import { AnimatedNumber } from "./AnimatedNumber";

/** Tipo de formato para el count-up (no se pueden pasar funciones server→client). */
export type StatKind = "int" | "dec1" | "dec2" | "w" | "kwh" | "pct";

const nf = (d: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: d });

function formatterFor(kind: StatKind): (n: number) => string {
  switch (kind) {
    case "w": return fmtW;
    case "kwh": return (n) => fmtKwh(n);
    case "pct": return (n) => fmtPct(n);
    case "dec2": return (n) => nf(2).format(n);
    case "dec1": return (n) => nf(1).format(n);
    default: return (n) => nf(0).format(n);
  }
}

type Props = {
  label: string;
  value?: string;
  unit?: string;
  sub?: string;
  accent?: EnergyAccent;
  /** Si se pasa `to` + `kind`, el número hace count-up animado. */
  to?: number;
  kind?: StatKind;
  index?: number;
};

/** Tile de KPI con aparición animada, hover sutil y count-up opcional. */
export function StatTile({ label, value, unit, sub, accent = "solar", to, kind, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 ring-1 bg-[var(--surface)] ring-[var(--border)] transition-colors duration-200 hover:ring-[var(--border-strong)]"
    >
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full opacity-80"
          style={{ backgroundColor: ENERGY_COLORS[accent] }}
        />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-3xl font-semibold tabular-nums ${ACCENT_TEXT[accent]}`}>
          {to != null && kind ? <AnimatedNumber value={to} format={formatterFor(kind)} /> : value}
        </span>
        {unit && <span className="text-sm text-[var(--text-muted)]">{unit}</span>}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-[var(--text-faint)]">{sub}</div>}
    </motion.div>
  );
}
