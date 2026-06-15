import { getGeneratorSummary, getEnergyDaily } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { parseDateFilter } from "@/lib/date-filter";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { GenDailyBars } from "@/components/generator/GenDailyBars";
import { fmtKwh, fmtMoney, fmtPct } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Defaults si la planta no tiene config (editable en Finanzas → Parámetros económicos).
const GEN_KWH_PER_L_DEFAULT = 3.0;

export default async function GeneradorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { dia, rango, etiquetaDia } = parseDateFilter(await searchParams);
  const user = await requireUser();
  const [gen, daily] = await Promise.all([
    getGeneratorSummary(id, user.id, dia, rango),
    getEnergyDaily(id, user.id, dia, rango),
  ]);

  // Nafta + rendimiento: config POR USUARIO (editable en /config).
  const rendimiento = user.genKwhPerL ?? GEN_KWH_PER_L_DEFAULT;
  const naftaPrice = user.fuelPricePerL ?? null;
  const totalLoad = daily.reduce((s, d) => s + d.eLoad, 0);
  const sharePct = totalLoad > 0 ? (gen.totalKwh / totalLoad) * 100 : 0;
  const liters = gen.totalKwh / rendimiento;
  const cost = naftaPrice != null ? liters * naftaPrice : null;

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
          sub={`${etiquetaDia} ${fmtKwh(gen.todayKwh)}`} />
        <StatTile label="Nafta estimada" value={liters > 0 ? liters.toFixed(1) : "0"} unit="L" accent="generator"
          sub={`~${rendimiento} kWh/L${user.genKwhPerL == null ? " · default" : ""}`} />
        {cost != null ? (
          <StatTile label="Costo estimado" value={fmtMoney(cost, user.currency)} accent="money"
            sub="según tu precio de nafta" />
        ) : (
          <StatTile label="Costo estimado" value="—" accent="money"
            sub="cargá el precio de la nafta en Configuración" />
        )}
        <StatTile label="Consumo cubierto" value={fmtPct(sharePct, 1)} accent="generator"
          sub="por nafta vs sol+batería" />
      </section>

      {gen.everUsed && (
        <SectionCard title={`Energía del generador · últimos ${rango} días`}>
          <GenDailyBars data={gen.last30} />
        </SectionCard>
      )}
    </div>
  );
}
