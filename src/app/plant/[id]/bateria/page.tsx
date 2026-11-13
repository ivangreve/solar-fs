import { getBatteryFleet, getEnergyDaily, getDeviceSeries } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { parseDateFilter } from "@/lib/date-filter";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { SocArc } from "@/components/battery/SocArc";
import { BatterySocChart, type BatterySeries } from "@/components/battery/BatterySocChart";
import { ChargeDischargeBars } from "@/components/battery/ChargeDischargeBars";
import { fmtKwh } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ago(ts: string | null): string {
  if (!ts) return "sin datos";
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

export default async function BateriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { dia, rango, etiquetaDia } = parseDateFilter(await searchParams);
  const user = await requireUser();
  const [fleet, daily] = await Promise.all([
    getBatteryFleet(id, user.id),
    getEnergyDaily(id, user.id, dia, rango),
  ]);

  const seriesList = await Promise.all(fleet.map((b) => getDeviceSeries(b.deviceSn, user.id, dia, rango)));
  const socSeries: BatterySeries[] = fleet.map((b, i) => ({
    label: `Batería ${i + 1}`,
    points: seriesList[i].intraday.map((p) => ({ t: p.t, soc: p.soc })),
  }));

  const socs = fleet.map((b) => b.socPct).filter((s): s is number => s != null);
  const socAvg = socs.length ? Math.round(socs.reduce((a, b) => a + b, 0) / socs.length) : null;
  const today = daily.at(-1);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="card flex flex-col items-center p-7 text-center lg:col-span-4">
          <span className="eyebrow self-start">Carga ahora</span>
          <div className="mt-4">
            <SocArc soc={socAvg} size={200} />
          </div>
          <p className="mt-4 text-[15px] text-[var(--text-muted)]">
            {socAvg == null ? "Sin dato de carga." : `${fleet.length} ${fleet.length === 1 ? "batería" : "baterías"} en el banco.`}
          </p>
        </div>
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-8">
          <StatTile label={`Cargado ${etiquetaDia}`} value={fmtKwh(today?.eBatChar ?? 0)} accent="battery" />
          <StatTile label={`Descargado ${etiquetaDia}`} value={fmtKwh(today?.eBatDischar ?? 0)} accent="load" />
          {fleet.map((b, i) => (
            <SectionCard key={b.deviceSn}>
              <div className="flex items-center gap-5">
                <SocArc soc={b.socPct} size={88} />
                <div className="min-w-0">
                  <div className="text-base font-semibold text-[var(--text)]">Batería {i + 1}</div>
                  <div className="num text-[11px] tracking-normal text-[var(--text-faint)]">{b.model ?? b.deviceSn}</div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                    <dt className="text-[var(--text-faint)]">Salud</dt>
                    <dd className="num tracking-normal text-[var(--c-battery)]">{b.sohPct != null ? `${b.sohPct} %` : "—"}</dd>
                    <dt className="text-[var(--text-faint)]">Voltaje</dt>
                    <dd className="num tracking-normal text-[var(--text)]">{b.battVolt != null ? `${b.battVolt.toFixed(1)} V` : "—"}</dd>
                    <dt className="text-[var(--text-faint)]">Dato</dt>
                    <dd className="text-[var(--text-muted)]">{ago(b.lastTs)}</dd>
                  </dl>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </section>
      <SectionCard title="Carga hora por hora" description="Sube con el sol, baja de noche.">
        <BatterySocChart series={socSeries} />
      </SectionCard>

      <SectionCard title="Cuánto entra y cuánto sale" description={`Últimos ${rango} días. Arriba lo cargado, abajo lo usado.`}>
        <ChargeDischargeBars data={daily} />
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          El detalle por celda y el conteo de ciclos no están disponibles en este modelo de batería.
        </p>
      </SectionCard>
    </div>
  );
}
