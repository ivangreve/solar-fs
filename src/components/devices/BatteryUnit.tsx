"use client";

import { motion } from "motion/react";
import { ENERGY_COLORS } from "@/components/ui/tokens";

/**
 * Ilustración de la batería de litio Felicity (FLA48100): cuerpo blanco vertical
 * con display circular tipo vidrio y anillo de SOC. El anillo se llena al montar,
 * tiene gradiente + glow, y un punto luminoso pulsante en la punta. El display
 * muestra el % con un brillo radial detrás. Sirve para tema claro y oscuro.
 */
export function BatteryUnit({ soc, size = 120 }: { soc: number | null; size?: number }) {
  const w = size;
  const h = size * 1.28;
  const cx = w / 2;
  const cy = h * 0.46;
  const r = w * 0.26;
  const R = r + 7;
  const circ = 2 * Math.PI * R;
  const pct = soc != null ? Math.max(0, Math.min(100, soc)) : 0;
  const dash = (pct / 100) * circ;
  const ringColor = soc == null ? "#9ca3af" : pct < 20 ? ENERGY_COLORS.solar : ENERGY_COLORS.battery;

  // punta del arco (para el punto luminoso) — arranca arriba y gira en sentido horario
  const tipAngle = (-90 + (pct / 100) * 360) * (Math.PI / 180);
  const tipX = cx + R * Math.cos(tipAngle);
  const tipY = cy + R * Math.sin(tipAngle);
  const uid = `bat${size}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Batería">
      <defs>
        <linearGradient id={`${uid}Body`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f1f1f4" />
          <stop offset="1" stopColor="#dcdce1" />
        </linearGradient>
        <linearGradient id={`${uid}Ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ringColor} stopOpacity="0.55" />
          <stop offset="1" stopColor={ringColor} />
        </linearGradient>
        <radialGradient id={`${uid}Disp`} cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#15151a" />
          <stop offset="1" stopColor="#050507" />
        </radialGradient>
        <filter id={`${uid}Shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.28" />
        </filter>
        <filter id={`${uid}Glow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* cuerpo */}
      <rect x="4" y="4" width={w - 8} height={h - 8} rx="16" fill={`url(#${uid}Body)`} stroke="#cdcdd3" filter={`url(#${uid}Shadow)`} />
      <rect x={w * 0.1} y={h * 0.045} width={w * 0.8} height={h * 0.04} rx="6" fill="#ffffff" opacity="0.6" />
      <rect x="9" y="9" width={w - 18} height={h - 18} rx="12" fill="none" stroke="#ffffff" strokeOpacity="0.7" />

      {/* marca */}
      <text x={cx} y={h * 0.16} textAnchor="middle" fontSize={w * 0.088} fill="#86868f" fontWeight="700" letterSpacing="0.5">
        Felicity
      </text>

      {/* aro de fondo */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e2e2e6" strokeWidth="4" />
      {/* arco de SOC */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={`url(#${uid}Ring)`}
        strokeWidth="4.5"
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: pct > 0 ? `drop-shadow(0 0 5px ${ringColor})` : "none" }}
      />
      {/* punto luminoso en la punta del SOC */}
      {soc != null && pct > 0 && (
        <motion.circle
          cx={tipX}
          cy={tipY}
          r="3.2"
          fill="#ffffff"
          stroke={ringColor}
          strokeWidth="1.5"
          filter={`url(#${uid}Glow)`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [1, 0.5, 1], scale: 1 }}
          transition={{ opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 1.2, delay: 1 } }}
        />
      )}

      {/* display */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}Disp)`} stroke="#1c1c20" />
      {/* reflejo de vidrio */}
      <path d={`M${cx - r * 0.7} ${cy - r * 0.45} A ${r} ${r} 0 0 1 ${cx + r * 0.55} ${cy - r * 0.7}`} fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />
      <text x={cx} y={cy + w * 0.06} textAnchor="middle" fontSize={w * 0.17} fill="#f1f1f1" fontWeight="700">
        {soc != null ? `${Math.round(soc)}%` : "—"}
      </text>

      {/* pie */}
      <rect x={cx - w * 0.13} y={h * 0.83} width={w * 0.26} height="4" rx="2" fill="#c9c9cf" />
    </svg>
  );
}
