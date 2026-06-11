"use client";

import { motion } from "motion/react";
import { ENERGY_COLORS } from "@/components/ui/tokens";

/**
 * Ilustración del inversor híbrido Felicity (IVEM). Cuerpo de plástico blanco con
 * bisel y brillo especular, rejillas de ventilación laterales, LCD con reflejo de
 * vidrio y lecturas que titilan, LED de estado con halo, y conectores con relieve.
 * Pensado para verse bien tanto en tema claro como oscuro (hardware blanco).
 */
export function InverterUnit({ online = true, size = 130 }: { online?: boolean; size?: number }) {
  const w = size;
  const h = size * 1.18;
  const led = online ? ENERGY_COLORS.battery : "#9ca3af";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Inversor">
      <defs>
        {/* plástico: highlight arriba-izq → sombra abajo-der */}
        <linearGradient id="invBody" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f1f1f4" />
          <stop offset="1" stopColor="#dcdce1" />
        </linearGradient>
        {/* glow del LCD */}
        <radialGradient id="invLcdGlow" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#0e2a1e" />
          <stop offset="1" stopColor="#06120c" />
        </radialGradient>
        {/* reflejo de vidrio del LCD */}
        <linearGradient id="invGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* relieve de conectores */}
        <radialGradient id="invPort" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fafafc" />
          <stop offset="1" stopColor="#c2c2c9" />
        </radialGradient>
        <filter id="invShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.28" />
        </filter>
        <filter id="invLedGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* cuerpo */}
      <rect x="4" y="4" width={w - 8} height={h - 8} rx="15" fill="url(#invBody)" stroke="#cdcdd3" filter="url(#invShadow)" />
      {/* sheen especular superior */}
      <rect x={w * 0.08} y={h * 0.05} width={w * 0.84} height={h * 0.05} rx="6" fill="#ffffff" opacity="0.6" />
      {/* bisel interno */}
      <rect x="9" y="9" width={w - 18} height={h - 18} rx="11" fill="none" stroke="#ffffff" strokeOpacity="0.7" />

      {/* rejillas de ventilación (dos columnas) */}
      {[0.09, 0.85].map((gx) =>
        [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={`${gx}-${i}`}
            x={w * gx}
            y={h * 0.2 + i * (h * 0.025)}
            width={w * 0.06}
            height={h * 0.012}
            rx={h * 0.006}
            fill="#cdcdd3"
          />
        )),
      )}

      {/* marca + modelo */}
      <text x={w / 2} y={h * 0.155} textAnchor="middle" fontSize={w * 0.082} fill="#86868f" fontWeight="700" letterSpacing="0.5">
        Felicity
      </text>

      {/* LCD */}
      <rect x={w * 0.27} y={h * 0.25} width={w * 0.46} height={h * 0.22} rx="5" fill="url(#invLcdGlow)" stroke="#070d0a" />
      {/* mini-gráfico vivo dentro del LCD */}
      <motion.path
        d={`M${w * 0.31} ${h * 0.4} L${w * 0.38} ${h * 0.34} L${w * 0.45} ${h * 0.38} L${w * 0.52} ${h * 0.31} L${w * 0.59} ${h * 0.36} L${w * 0.66} ${h * 0.32}`}
        fill="none"
        stroke="#34d399"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: online ? 0.9 : 0.3 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      {/* lecturas que titilan */}
      {[0, 1].map((i) => (
        <motion.rect
          key={`r${i}`}
          x={w * 0.31}
          y={h * 0.285 + i * (h * 0.018)}
          width={w * 0.18 - i * 14}
          height={h * 0.009}
          rx="1"
          fill="#2f7d5b"
          animate={online ? { opacity: [0.4, 0.85, 0.4] } : { opacity: 0.25 }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
      {/* reflejo de vidrio sobre el LCD */}
      <rect x={w * 0.27} y={h * 0.25} width={w * 0.46} height={h * 0.22} rx="5" fill="url(#invGlass)" />

      {/* botones con relieve */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`b${i}`}>
          <circle cx={w * 0.33 + i * (w * 0.12)} cy={h * 0.56} r={w * 0.03} fill="#e6e6ea" />
          <circle cx={w * 0.33 + i * (w * 0.12)} cy={h * 0.555} r={w * 0.022} fill="#fbfbfd" stroke="#cfcfd5" strokeWidth="0.5" />
        </g>
      ))}

      {/* LED de estado con halo */}
      <g filter="url(#invLedGlow)">
        <motion.circle
          cx={w * 0.8}
          cy={h * 0.56}
          r={w * 0.026}
          fill={led}
          animate={online ? { opacity: [1, 0.3, 1] } : { opacity: 0.5 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>

      {/* conectores con profundidad */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`c${i}`}>
          <circle cx={w * 0.3 + i * (w * 0.14)} cy={h * 0.86} r={w * 0.045} fill="url(#invPort)" stroke="#b1b1b8" />
          <circle cx={w * 0.3 + i * (w * 0.14)} cy={h * 0.86} r={w * 0.018} fill="#9a9aa2" />
        </g>
      ))}
    </svg>
  );
}
