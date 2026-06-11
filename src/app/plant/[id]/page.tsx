import Link from "next/link";
import { getPlantOverview, getPlantSeries } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { parseDateFilter } from "@/lib/date-filter";
import { StatTile } from "@/components/ui/StatTile";
import { SectionCard } from "@/components/ui/SectionCard";
import { IntradayChart } from "@/components/charts/IntradayChart";
import { DailyBars } from "@/components/charts/DailyBars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fmt = (n: number, d = 1) => n.toLocaleString("es-AR", { maximumFractionDigits: d });
const w = (n: number) => (n >= 1000 ? `${fmt(n / 1000, 2)} kW` : `${fmt(n, 0)} W`);

export default async function PlantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { dia, rango, esHoy, etiquetaDia } = parseDateFilter(await searchParams);
  const user = await requireUser();
  const ov = await getPlantOverview(id, user.id, dia);
  if (!ov) {
    return (
      <div className="text-[var(--text-muted)]">
        Planta no encontrada. <Link href="/" className="text-amber-400 underline">Volver</Link>
      </div>
    );
  }
  const series = await getPlantSeries(id, user.id, dia, rango);
  const stale = ov.lastTs ? (Date.now() - new Date(ov.lastTs).getTime()) / 60000 : null;
  const peak = series.intraday.reduce((m, d) => Math.max(m, d.pv), 0);

  return (
    <div className="space-y-6">
      {esHoy && (
        <div className="flex items-center justify-end gap-2 text-xs text-[var(--text-faint)]">
          {stale != null && stale < 15 && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          )}
          {stale == null
            ? "sin datos"
            : stale < 15
              ? `en vivo · hace ${Math.round(stale)} min`
              : `último dato hace ${Math.round(stale)} min`}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={`Generación ${etiquetaDia}`} to={ov.ePvKwh} kind="dec2" unit="kWh" accent="solar"
          sub={`pico ${w(peak)}`} index={0} />
        <StatTile label="Autosuficiencia" to={ov.selfSufficiencyPct ?? 0} kind="int" unit="%" accent="battery"
          sub="de tu consumo lo cubriste vos" index={1} />
        <StatTile label="Autoconsumo" to={ov.selfConsumptionPct ?? 0} kind="int" unit="%" accent="grid"
          sub="de tu sol lo aprovechaste" index={2} />
        <StatTile label={`Ahorro ${etiquetaDia}`} to={ov.savings} kind="dec2" unit={ov.plant.currency} accent="money"
          sub={ov.plant.buyTariff ? "" : "cargá tu tarifa para calcularlo"} index={3} />
      </section>

      {esHoy && (
        <section className="grid gap-4 sm:grid-cols-3">
          <StatTile label="FV ahora" to={ov.pvNowW} kind="w" accent="solar" index={4} />
          <StatTile label="Consumo ahora" to={ov.loadNowW} kind="w" accent="load" index={5} />
          <StatTile label="Batería (SOC prom.)" value={ov.socAvg != null ? String(ov.socAvg) : "—"} unit="%" accent="battery" index={6} />
        </section>
      )}

      <SectionCard title={`De dónde salió cada watt · ${etiquetaDia}`}>
        <IntradayChart data={series.intraday} />
      </SectionCard>

      <SectionCard title={`Generación diaria · últimos ${rango} días`}>
        <DailyBars data={series.daily} />
      </SectionCard>
    </div>
  );
}
