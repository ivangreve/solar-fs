/** Anillo SVG de estado de carga. Server-compatible. */
export function SocArc({ soc, size = 96 }: { soc: number | null; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = soc != null ? Math.max(0, Math.min(100, soc)) : 0;
  const dash = (pct / 100) * c;
  // color por nivel: bajo=ámbar, ok=verde
  const color = soc == null ? "var(--text-faint)" : pct < 20 ? "var(--c-solar)" : "var(--c-battery)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 55%, transparent))`, transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-[var(--text)]">
          {soc != null ? Math.round(soc) : "—"}
        </span>
        <span className="text-[10px] text-[var(--text-faint)]">SOC %</span>
      </div>
    </div>
  );
}
