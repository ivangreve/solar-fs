import { ENERGY_COLORS } from "./tokens";

const ROLE_COLOR: Record<string, string> = {
  inverter: ENERGY_COLORS.solar,
  battery: ENERGY_COLORS.battery,
  panels: ENERGY_COLORS.solar,
  meter: ENERGY_COLORS.grid,
  unknown: ENERGY_COLORS.grid,
};

const ROLE_LABEL: Record<string, string> = {
  inverter: "Inversor",
  battery: "Batería",
  meter: "Medidor",
  panels: "Paneles",
  unknown: "Dispositivo",
};

/** Chip sobrio con punto de color por rol + etiqueta + nombre. Server-compatible. */
export function DeviceBadge({
  role,
  name,
  className = "",
}: {
  role: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md bg-neutral-800/70 px-2.5 py-1 text-xs ring-1 ring-white/10 ${className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: ROLE_COLOR[role] ?? ROLE_COLOR.unknown }}
        aria-hidden
      />
      <span className="text-neutral-500">{ROLE_LABEL[role] ?? "Dispositivo"}</span>
      <span className="text-neutral-200">{name}</span>
    </span>
  );
}
