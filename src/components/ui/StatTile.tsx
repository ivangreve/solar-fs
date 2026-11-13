"use client";

import { motion } from "motion/react";
import { ACCENT_TEXT, ACCENT_VAR, fmtKwh, fmtW, fmtPct, type EnergyAccent } from "./tokens";
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

/** Íconos por acento (trazo, 24px) — refuerzan el canal de energía sin depender del color. */
const ICONS: Record<EnergyAccent, React.ReactNode> = {
  solar: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  battery: (<><rect x="2" y="7" width="18" height="10" rx="2" /><path d="M22 11v2M6 10v4M10 10v4" /></>),
  grid: (<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />),
  load: (<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>),
  generator: (<><path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3 0-5 2-8Z" /></>),
  money: (<><circle cx="12" cy="12" r="9" /><path d="M14.8 9.2c-.5-1-1.5-1.5-2.8-1.5-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1c1.8.4 2.9 1 2.9 2.2s-1.2 2-2.9 2c-1.4 0-2.5-.6-3-1.6M12 6v1.7M12 16.3V18" /></>),
};

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

/** Tile de KPI: ícono tintado, número grande, brillo sutil del color del canal y count-up opcional. */
export function StatTile({ label, value, unit, sub, accent = "solar", to, kind, index = 0 }: Props) {
  const color = ACCENT_VAR[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="card group relative overflow-hidden p-5 transition-shadow duration-200 hover:shadow-[0_0_0_1px_var(--border-strong),var(--shadow-card)]"
    >
      {/* brillo del color del canal en la esquina */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">{label}</span>
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {ICONS[accent]}
          </svg>
        </span>
      </div>
      <div className="relative mt-3 flex items-baseline gap-1.5">
        <span className={`text-[2rem] font-semibold leading-none tracking-tight tabular-nums ${ACCENT_TEXT[accent]}`}>
          {to != null && kind ? <AnimatedNumber value={to} format={formatterFor(kind)} /> : value}
        </span>
        {unit && <span className="text-sm font-medium text-[var(--text-muted)]">{unit}</span>}
      </div>
      {sub && <div className="relative mt-2 truncate text-xs text-[var(--text-faint)]">{sub}</div>}
    </motion.div>
  );
}
