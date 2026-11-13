import { getPlantSeries, getPlantOverview, getEnergyDaily } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { parseDateFilter } from "@/lib/date-filter";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { SourceMixChart } from "@/components/energy/SourceMixChart";
import { EnergySankey } from "@/components/energy/EnergySankey";
import { EnergyDailyBars } from "@/components/energy/EnergyDailyBars";
import { fmtKwh, fmtPct } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EnergiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { dia, rango, etiquetaDia } = parseDateFilter(await searchParams);
  const user = await requireUser();
  const [series, ov, daily] = await Promise.all([
    getPlantSeries(id, user.id, dia, rango),
    getPlantOverview(id, user.id, dia),
    getEnergyDaily(id, user.id, dia, rango),
  ]);
  const lastDay = daily.at(-1);

  return (
    <div className="space-y-4">
      <section className="px-1 pb-2">
        <span className="eyebrow">{etiquetaDia}</span>
        <h2 className="mt-3 max-w-[44rem] text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[2.125rem]">
          {ov && ov.ePvKwh > 0 ? (
            <>
              Generaste <span className="text-[var(--c-solar)]">{fmtKwh(ov.ePvKwh)}</span> y consumiste{" "}
              <span className="text-[var(--c-load)]">{fmtKwh(ov.eLoadKwh)}</span>.
            </>
          ) : (
            <>Todavía no hay energía registrada para este día.</>
          )}
        </h2>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={`Generación ${etiquetaDia}`} value={fmtKwh(ov?.ePvKwh ?? 0)} accent="solar" />
        <StatTile label={`Consumo ${etiquetaDia}`} value={fmtKwh(ov?.eLoadKwh ?? 0)} accent="load" />
        <StatTile label="Autoconsumo" value={fmtPct(ov?.selfConsumptionPct)} accent="battery"
          progress={ov?.selfConsumptionPct ?? 0} sub="de tu sol usado in situ" />
        <StatTile label="A la red" value={fmtKwh(ov?.eGridFeedKwh ?? 0)} accent="grid"
          sub="sistema aislado" />
      </section>

      <SectionCard title="Quién puso cada watt" description="Paneles, batería y generador frente al consumo, hora por hora.">
        <SourceMixChart data={series.intraday} />
      </SectionCard>

      {lastDay && (
        <SectionCard title="Adónde fue cada kWh" description={lastDay.day}>
          <EnergySankey day={lastDay} />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Flujos reconstruidos a partir de los totales del día. El sol que no se consume al
            instante carga la batería; de noche el consumo sale de la batería.
          </p>
        </SectionCard>
      )}

      <SectionCard title="Generación y consumo por día" description={`Últimos ${rango} días. Cuando la barra supera a la línea, la batería se llenó.`}>
        <EnergyDailyBars data={daily} />
      </SectionCard>
    </div>
  );
}
