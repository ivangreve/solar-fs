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
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatTile label="SOC del banco" value={socAvg != null ? String(socAvg) : "—"} unit="%" accent="battery"
          sub={`${fleet.length} baterías`} />
        <StatTile label={`Cargado ${etiquetaDia}`} value={fmtKwh(today?.eBatChar ?? 0)} accent="battery" />
        <StatTile label={`Descargado ${etiquetaDia}`} value={fmtKwh(today?.eBatDischar ?? 0)} accent="load" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {fleet.map((b, i) => (
          <SectionCard key={b.deviceSn}>
            <div className="flex items-center gap-4">
              <SocArc soc={b.socPct} />
              <div className="min-w-0">
                <div className="text-sm text-[var(--text)]">Batería {i + 1}</div>
                <div className="font-mono text-[11px] text-[var(--text-faint)]">{b.model ?? b.deviceSn}</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-[var(--text-faint)]">Salud (SOH)</dt>
                  <dd className="tabular-nums text-emerald-400">{b.sohPct != null ? `${b.sohPct} %` : "—"}</dd>
                  <dt className="text-[var(--text-faint)]">Voltaje</dt>
                  <dd className="tabular-nums text-[var(--text)]">{b.battVolt != null ? `${b.battVolt.toFixed(1)} V` : "—"}</dd>
                  <dt className="text-[var(--text-faint)]">Último dato</dt>
                  <dd className="text-[var(--text-muted)]">{ago(b.lastTs)}</dd>
                </dl>
              </div>
            </div>
          </SectionCard>
        ))}
      </section>

      <SectionCard title={`Estado de carga · ${etiquetaDia}`}>
        <BatterySocChart series={socSeries} />
      </SectionCard>

      <SectionCard title={`Carga y descarga · últimos ${rango} días`}>
        <ChargeDischargeBars data={daily} />
        <p className="mt-3 text-xs text-[var(--text-faint)]">
          El detalle por celda y el conteo de ciclos no están disponibles en este modelo de batería.
        </p>
      </SectionCard>
    </div>
  );
}
