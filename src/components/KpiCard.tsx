/**
 * Compat shim: KpiCard se unificó en StatTile (src/components/ui/StatTile.tsx).
 * Re-exportamos para no romper imports existentes. Usá StatTile en código nuevo.
 */
import { StatTile } from "./ui/StatTile";
import type { EnergyAccent } from "./ui/tokens";

type Props = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: EnergyAccent;
};

export function KpiCard(props: Props) {
  return <StatTile {...props} />;
}
