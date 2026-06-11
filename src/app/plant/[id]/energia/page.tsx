import { getPlantSeries, getPlantOverview, getEnergyDaily } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { SourceMixChart } from "@/components/energy/SourceMixChart";
import { EnergySankey } from "@/components/energy/EnergySankey";
import { EnergyDailyBars } from "@/components/energy/EnergyDailyBars";
import { fmtKwh, fmtPct } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EnergiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [series, ov, daily] = await Promise.all([
    getPlantSeries(id, user.id),
    getPlantOverview(id, user.id),
    getEnergyDaily(id, user.id),
  ]);
  const lastDay = daily.at(-1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Generación hoy" value={fmtKwh(ov?.ePvKwh ?? 0)} accent="solar" />
        <StatTile label="Consumo hoy" value={fmtKwh(ov?.eLoadKwh ?? 0)} accent="load" />
        <StatTile label="Autoconsumo" value={fmtPct(ov?.selfConsumptionPct)} accent="battery"
          sub="de tu sol usado in situ" />
        <StatTile label="A la red" value={fmtKwh(ov?.eGridFeedKwh ?? 0)} accent="grid"
          sub="sistema aislado" />
      </section>

      <SectionCard title="De dónde salió cada watt · hoy">
        <SourceMixChart data={series.intraday} />
      </SectionCard>

      {lastDay && (
        <SectionCard title={`Flujo de energía · ${lastDay.day}`}>
          <EnergySankey day={lastDay} />
          <p className="mt-3 text-xs text-neutral-500">
            Flujos reconstruidos a partir de los totales del día. El sol que no se consume al
            instante carga la batería; de noche el consumo sale de la batería.
          </p>
        </SectionCard>
      )}

      <SectionCard title="Generación y consumo · últimos 30 días">
        <EnergyDailyBars data={daily} />
      </SectionCard>
    </div>
  );
}
