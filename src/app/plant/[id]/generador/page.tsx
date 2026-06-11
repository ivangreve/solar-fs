import { getGeneratorSummary, getEnergyDaily } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { GenDailyBars } from "@/components/generator/GenDailyBars";
import { fmtKwh, fmtMoney, fmtPct } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Estimaciones (configurables). Un generador a nafta rinde ~3 kWh por litro.
const GEN_KWH_PER_LITER = 3.0;
const NAFTA_PRICE = 1200; // ARS por litro (estimado · configurable)

export default async function GeneradorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [gen, daily] = await Promise.all([getGeneratorSummary(id, user.id), getEnergyDaily(id, user.id)]);

  const totalLoad = daily.reduce((s, d) => s + d.eLoad, 0);
  const sharePct = totalLoad > 0 ? (gen.totalKwh / totalLoad) * 100 : 0;
  const liters = gen.totalKwh / GEN_KWH_PER_LITER;
  const cost = liters * NAFTA_PRICE;

  return (
    <div className="space-y-6">
      {!gen.everUsed && (
        <SectionCard>
          <div className="flex flex-col items-start gap-2">
            <div className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Combustible</div>
            <div className="text-3xl font-semibold text-[var(--text)]">
              No usaste el generador
            </div>
            <p className="max-w-prose text-sm text-[var(--text-muted)]">
              0 kWh generados, 0 litros de nafta, $0 en combustible. Toda tu energía vino del sol y
              la batería. El día que arranques el generador, esta sección registra cuánto aportó y
              cuánto te costó.
            </p>
          </div>
        </SectionCard>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Energía del generador" value={fmtKwh(gen.totalKwh)} accent="generator"
          sub={`hoy ${fmtKwh(gen.todayKwh)}`} />
        <StatTile label="Nafta estimada" value={liters > 0 ? liters.toFixed(1) : "0"} unit="L" accent="generator"
          sub={`~${GEN_KWH_PER_LITER} kWh/L · estimado`} />
        <StatTile label="Costo estimado" value={fmtMoney(cost, "ARS")} accent="money"
          sub="estimado · configurable" />
        <StatTile label="Consumo cubierto" value={fmtPct(sharePct, 1)} accent="generator"
          sub="por nafta vs sol+batería" />
      </section>

      {gen.everUsed && (
        <SectionCard title="Energía del generador · últimos 30 días">
          <GenDailyBars data={gen.last30} />
        </SectionCard>
      )}
    </div>
  );
}
