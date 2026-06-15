import Link from "next/link";
import { ENERGY_COLORS, fmtW } from "@/components/ui/tokens";
import { InverterUnit } from "./InverterUnit";
import { BatteryUnit } from "./BatteryUnit";

type Device = {
  deviceSn: string;
  model: string | null;
  role: string;
  socPct: number | null;
  status: "online" | "stale" | "offline";
};

const STATUS_COLOR = {
  online: ENERGY_COLORS.battery,
  stale: ENERGY_COLORS.solar,
  offline: "#9ca3af",
} as const;

/** Panel solar estilizado, con celdas en gradiente y un destello de sol que barre. */
function PanelsGlyph({ size = 110 }: { size?: number }) {
  return (
    <svg viewBox="0 0 110 80" width={size} height={size * 0.73} role="img" aria-label="Paneles">
      <defs>
        <linearGradient id="panelCell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b4f7d" />
          <stop offset="1" stopColor="#13294a" />
        </linearGradient>
        <clipPath id="panelClip">
          <g transform="skewX(-8)">
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => (
                <rect key={`${r}-${c}`} x={20 + c * 24} y={8 + r * 20} width="22" height="18" rx="2" />
              )),
            )}
          </g>
        </clipPath>
      </defs>
      <g transform="skewX(-8)">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <g key={`${r}-${c}`}>
              <rect x={20 + c * 24} y={8 + r * 20} width="22" height="18" rx="2" fill="url(#panelCell)" stroke={ENERGY_COLORS.solar} strokeOpacity="0.4" />
              {/* líneas de celda */}
              <line x1={31 + c * 24} y1={8 + r * 20} x2={31 + c * 24} y2={26 + r * 20} stroke="#0d1d36" strokeWidth="0.6" />
              <line x1={20 + c * 24} y1={17 + r * 20} x2={42 + c * 24} y2={17 + r * 20} stroke="#0d1d36" strokeWidth="0.6" />
            </g>
          )),
        )}
      </g>
      {/* destello de sol que barre las celdas */}
      <g clipPath="url(#panelClip)">
        <rect x="-40" y="0" width="22" height="80" fill="#ffffff" opacity="0.22" transform="skewX(-20)">
          <animate attributeName="x" values="-40;130" dur="4.5s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}

/** Conector con energía que "corre": vertical en mobile, horizontal en desktop. */
function Flow({ label, color = "var(--text-faint)" }: { label?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-1 text-[var(--text-faint)] md:shrink-0 md:px-1 md:py-0">
      {label && <span className="text-[11px] tabular-nums">{label}</span>}
      <svg className="md:hidden" width="12" height="24" viewBox="0 0 12 24" fill="none" aria-hidden>
        <line x1="6" y1="0" x2="6" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.4" />
        <line x1="6" y1="0" x2="6" y2="16" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 7">
          <animate attributeName="stroke-dashoffset" values="10;0" dur="0.9s" repeatCount="indefinite" />
        </line>
        <path d="M2 12l4 4 4-4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <svg className="hidden md:block" width="36" height="12" viewBox="0 0 36 12" fill="none" aria-hidden>
        <line x1="0" y1="6" x2="28" y2="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.4" />
        <line x1="0" y1="6" x2="28" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 7">
          <animate attributeName="stroke-dashoffset" values="10;0" dur="0.9s" repeatCount="indefinite" />
        </line>
        <path d="M24 2l4 4-4 4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

function NodeShell({
  href,
  children,
  caption,
  value,
  status,
}: {
  href?: string;
  children: React.ReactNode;
  caption: string;
  value?: string;
  status?: "online" | "stale" | "offline";
}) {
  const body = (
    <div className="flex flex-col items-center gap-1 rounded-2xl p-2.5 ring-1 bg-[var(--surface)] ring-[var(--border)] transition-all duration-200 hover:ring-[var(--border-strong)] sm:p-3">
      {children}
      <div className="flex items-center gap-1.5">
        {status && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />}
        <span className="text-xs text-[var(--text-muted)]">{caption}</span>
      </div>
      {value && <div className="text-base font-semibold tabular-nums text-[var(--text)]">{value}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Esquema del sistema con ilustraciones del hardware Felicity. */
export function SystemTopology({
  plantId,
  devices,
  pvNowW,
  loadNowW,
}: {
  plantId: string;
  devices: Device[];
  pvNowW: number;
  loadNowW: number;
}) {
  const inverter = devices.find((d) => d.role === "inverter");
  const batteries = devices.filter((d) => d.role === "battery");

  // Mobile: columna (paneles → inversor → resto). Desktop: flujo horizontal en una sola vista.
  return (
    <div className="mx-auto flex max-w-md flex-col items-stretch md:max-w-none md:flex-row md:items-center md:justify-center">
      <NodeShell caption="Paneles solares" value={fmtW(pvNowW)}>
        <PanelsGlyph size={110} />
      </NodeShell>
      <Flow label={fmtW(pvNowW)} color={ENERGY_COLORS.solar} />

      {inverter && (
        <NodeShell
          href={`/plant/${plantId}/dispositivos/${inverter.deviceSn}`}
          caption={`Inversor · ${inverter.model ?? ""}`}
          status={inverter.status}
        >
          <InverterUnit online={inverter.status !== "offline"} size={120} />
        </NodeShell>
      )}
      <Flow color={ENERGY_COLORS.battery} />

      <div className="grid grid-cols-2 gap-2 md:shrink-0 sm:gap-3">
        {batteries.map((b, i) => (
          <NodeShell
            key={b.deviceSn}
            href={`/plant/${plantId}/dispositivos/${b.deviceSn}`}
            caption={`Batería ${i + 1}`}
            status={b.status}
          >
            <BatteryUnit soc={b.socPct} size={76} />
          </NodeShell>
        ))}
        <NodeShell caption="Consumo de la casa" value={fmtW(loadNowW)}>
          <div className="flex h-[84px] items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ENERGY_COLORS.load} strokeWidth="1.4">
              <path d="M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
            </svg>
          </div>
        </NodeShell>
        <NodeShell caption="Red · aislada">
          <div className="flex h-[84px] items-center justify-center text-[var(--text-faint)]">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M4 4l16 16M9 3l6 0M12 3v6M7 9h10l-1.5 11h-7z" strokeOpacity="0.5" />
            </svg>
          </div>
        </NodeShell>
      </div>
    </div>
  );
}
