"use client";

import { motion } from "motion/react";
import { ACCENT_VAR, fmtKwh, fmtW, fmtPct, type EnergyAccent } from "./tokens";
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
  /** 0–100: barra fina bajo el número (porcentajes). */
  progress?: number;
};

/** Tile de KPI: solo la etiqueta lleva el color del canal; el número va en blanco, en mono. */
export function StatTile({ label, value, unit, sub, accent = "solar", to, kind, index = 0, progress }: Props) {
  const color = ACCENT_VAR[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="card p-5"
    >
      <div className="eyebrow" style={{ color }}>{label}</div>
      <div className="num mt-3 flex items-baseline gap-1.5 text-[2rem] font-medium leading-none text-[var(--text)]">
        <span>{to != null && kind ? <AnimatedNumber value={to} format={formatterFor(kind)} /> : value}</span>
        {unit && <span className="text-[0.9rem] font-normal tracking-normal text-[var(--text-muted)]">{unit}</span>}
      </div>
      {progress != null && (
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: color }} />
        </div>
      )}
      {sub && <div className="mt-2.5 text-[13px] text-[var(--text-muted)]">{sub}</div>}
    </motion.div>
  );
}
