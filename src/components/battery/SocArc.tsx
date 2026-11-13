/** Anillo SVG de estado de carga. Server-compatible. */
export function SocArc({ soc, size = 96 }: { soc: number | null; size?: number }) {
  const stroke = Math.max(8, Math.round(size / 14));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = soc != null ? Math.max(0, Math.min(100, soc)) : 0;
  const dash = (pct / 100) * c;
  // color por nivel: bajo=ámbar, ok=verde
  const color = soc == null ? "var(--text-faint)" : pct < 20 ? "var(--c-solar)" : "var(--c-battery)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-medium text-[var(--text)]" style={{ fontSize: Math.round(size * 0.27) }}>
          {soc != null ? Math.round(soc) : "—"}
        </span>
        {size >= 90 && <span className="eyebrow mt-0.5">carga %</span>}
      </div>
    </div>
  );
}
