import Link from "next/link";
import { getPlantOverview, getPlantSeries } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { getSolarForecast } from "@/server/forecast";
import { parseDateFilter } from "@/lib/date-filter";
import { StatTile } from "@/components/ui/StatTile";
import { ForecastCard } from "@/components/ForecastCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { IntradayChart } from "@/components/charts/IntradayChart";
import { DailyBars } from "@/components/charts/DailyBars";
import { PowerFlow, flowHeadline } from "@/components/overview/PowerFlow";
import { SocArc } from "@/components/battery/SocArc";
import { APP_TZ } from "@/server/time";

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
        Planta no encontrada. <Link href="/" className="text-[var(--accent)] underline">Volver</Link>
      </div>
    );
  }
  const series = await getPlantSeries(id, user.id, dia, rango);
  // Frescura (min desde el último dato): viene calculada de la capa de datos
  // para no llamar Date.now() en el render (react-hooks/purity).
  const stale = ov.staleMin;
  const peak = series.intraday.reduce((m, d) => Math.max(m, d.pv), 0);
  const genNowW = series.intraday.at(-1)?.gen ?? 0;
  const lastTime = ov.lastTs
    ? new Intl.DateTimeFormat("es-AR", { timeZone: APP_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ov.lastTs))
    : null;
  const flow = { pvW: ov.pvNowW, loadW: ov.loadNowW, genW: genNowW, soc: ov.socAvg };
  const headline = flowHeadline(flow);
  const surplusW = ov.pvNowW - ov.loadNowW;
  // Pronóstico: solo viendo "hoy" y con ubicación cargada (best-effort, nunca rompe la página)
  const forecast =
    esHoy && ov.plant.lat != null && ov.plant.lon != null
      ? await getSolarForecast(id, ov.plant.lat, ov.plant.lon).catch(() => null)
      : null;

  return (
    <div className="space-y-4">
      {esHoy ? (
        <section className="grid gap-4 lg:grid-cols-12">
          <div className="card p-6 sm:p-7 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="eyebrow">Ahora{lastTime ? ` · ${lastTime}` : ""}</span>
              <span className="inline-flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                <span
                  className={`h-2 w-2 rounded-full ${stale != null && stale < 15 ? "bg-[var(--c-battery)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--c-battery)_18%,transparent)]" : "bg-[var(--text-faint)]"}`}
                />
                {stale == null
                  ? "sin datos"
                  : stale < 15
                    ? `en vivo · hace ${Math.round(stale)} min`
                    : `último dato hace ${Math.round(stale)} min`}
              </span>
            </div>
            <h2 className="mt-3 max-w-[40rem] text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[2.125rem]">
              {headline.title}
            </h2>
            <p className="mt-3 max-w-[40rem] text-base leading-relaxed text-[var(--text-muted)]">{headline.detail}</p>
            <PowerFlow state={flow} />
          </div>

          <div className="card hidden flex-col items-center p-6 text-center sm:p-7 lg:col-span-4 lg:flex">
            <span className="eyebrow self-start">Batería</span>
            <div className="mt-4">
              <SocArc soc={ov.socAvg} size={176} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-muted)]">
              {ov.socAvg == null
                ? "Sin dato de carga."
                : Math.abs(surplusW) < 30
                  ? "Carga estable."
                  : surplusW > 0
                    ? `Cargando a ${fmt(surplusW, 0)} W.`
                    : `Descargando a ${fmt(-surplusW, 0)} W.`}
            </p>
          </div>
        </section>
      ) : (
        <section className="card p-6 sm:p-7">
          <span className="eyebrow">{etiquetaDia}</span>
          <h2 className="mt-3 max-w-[40rem] text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[2.125rem]">
            Generaste <span className="text-[var(--c-solar)]">{fmt(ov.ePvKwh, 2)} kWh</span> y consumiste{" "}
            <span className="text-[var(--c-load)]">{fmt(ov.eLoadKwh, 2)} kWh</span>.
          </h2>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={`Generación ${etiquetaDia}`} to={ov.ePvKwh} kind="dec2" unit="kWh" accent="solar"
          sub={`pico ${w(peak)}`} index={0} />
        <StatTile label={`Consumo ${etiquetaDia}`} to={ov.eLoadKwh} kind="dec2" unit="kWh" accent="load"
          sub={ov.eLoadKwh > 0 ? `promedio ${w((ov.eLoadKwh * 1000) / 24)}` : undefined} index={1} />
        <StatTile label="Autosuficiencia" to={ov.selfSufficiencyPct ?? 0} kind="int" unit="%" accent="battery"
          progress={ov.selfSufficiencyPct ?? 0} sub="de tu consumo lo cubriste vos" index={2} />
        <StatTile label={`Ahorro ${etiquetaDia}`} to={ov.savings} kind="dec2" unit={ov.plant.currency} accent="money"
          sub={ov.plant.buyTariff ? "" : "cargá tu tarifa para calcularlo"} index={3} />
      </section>

      {forecast && <ForecastCard forecast={forecast} />}

      <SectionCard
        title="Hoy, hora por hora"
        description={esHoy ? "Lo sólido ya pasó. Los paneles en amarillo, el consumo en azul, la batería en verde." : etiquetaDia}
      >
        <IntradayChart data={series.intraday} live={esHoy} />
      </SectionCard>

      <SectionCard title="Generación diaria" description={`Últimos ${rango} días. El naranja es lo que puso el generador.`}>
        <DailyBars data={series.daily} />
      </SectionCard>
    </div>
  );
}
