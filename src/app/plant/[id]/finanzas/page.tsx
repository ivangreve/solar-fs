import { getFinanceSummary } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { StatTile } from "@/components/ui/StatTile";
import { SectionCard } from "@/components/ui/SectionCard";
import { PlantConfigForm } from "@/components/finance/PlantConfigForm";
import { FinanceMonthlyBars, type MonthlyMoney } from "@/components/finance/FinanceMonthlyBars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEN_KWH_PER_L_DEFAULT = 3;
const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

/**
 * Modelo económico off-grid:
 * - Consumo cubierto por el sistema solar = consumo − generador − red.
 * - Ahorro bruto = eso × tarifa de red de referencia (lo que NO le pagaste a nadie).
 * - Costo generador = (kWh generador ÷ rendimiento) × precio nafta.
 * - Neto = bruto − generador. El payback se proyecta con el ritmo de los últimos 90 días.
 */
export default async function FinanzasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const fin = await getFinanceSummary(id, user.id);
  if (!fin) return <div className="text-[var(--text-muted)]">Planta no encontrada.</div>;

  const { plant, totals, monthly, last90 } = fin;
  const tarifa = plant.buyTariff;
  const nafta = plant.fuelPricePerL;
  const rendimiento = plant.genKwhPerL ?? GEN_KWH_PER_L_DEFAULT;
  const cur = plant.currency;
  const configurado = tarifa != null || nafta != null;

  const solarKwh = (e: { eLoad: number; eGridIn: number; eGen: number }) =>
    Math.max(e.eLoad - e.eGridIn - e.eGen, 0);
  const ahorro = (e: { eLoad: number; eGridIn: number; eGen: number }) =>
    tarifa != null ? solarKwh(e) * tarifa : 0;
  const costoGen = (e: { eGen: number }) => (nafta != null ? (e.eGen / rendimiento) * nafta : 0);

  const ahorroTotal = ahorro(totals);
  const costoGenTotal = costoGen(totals);
  const netoTotal = ahorroTotal - costoGenTotal;
  const litrosTotal = totals.eGen / rendimiento;

  // Payback: % recuperado con el neto histórico + proyección al ritmo de los últimos 90 días.
  const netoDiario90 = last90.days > 0 ? (ahorro(last90) - costoGen(last90)) / last90.days : 0;
  const payback =
    plant.systemCost != null && plant.systemCost > 0 && tarifa != null
      ? {
          pct: Math.min((netoTotal / plant.systemCost) * 100, 100),
          mesesRestantes:
            netoDiario90 > 0 ? Math.max(plant.systemCost - netoTotal, 0) / netoDiario90 / 30.44 : null,
        }
      : null;

  const monthlyMoney: MonthlyMoney[] = monthly.map((m) => ({
    month: m.month,
    ahorro: ahorro(m),
    costoGen: costoGen(m),
    neto: ahorro(m) - costoGen(m),
  }));

  return (
    <div className="space-y-6">
      {!configurado && (
        <SectionCard>
          <div className="py-2 text-center">
            <h3 className="text-xl font-semibold text-[var(--text)]">¿Cuánta plata te ahorra el sol?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
              Cargá abajo tu tarifa de referencia y el precio de la nafta: con eso convertimos tus{" "}
              {fmt(totals.ePv)} kWh históricos en plata.
            </p>
          </div>
        </SectionCard>
      )}

      {configurado && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Ahorro solar histórico" to={ahorroTotal} kind="int" unit={cur} accent="money"
              sub={`${fmt(solarKwh(totals))} kWh cubiertos por tu sistema · ${totals.days} días`} index={0} />
            <StatTile label="Costo generador histórico" to={costoGenTotal} kind="int" unit={cur} accent="generator"
              sub={`${litrosTotal.toFixed(1)} L de nafta estimados`} index={1} />
            <StatTile label="Ahorro neto" to={netoTotal} kind="int" unit={cur} accent="battery"
              sub={netoDiario90 > 0 ? `~${fmt(netoDiario90 * 30.44)} ${cur}/mes al ritmo actual` : ""} index={2} />
            {payback ? (
              <StatTile label="Inversión recuperada" to={payback.pct} kind="dec1" unit="%" accent="solar"
                sub={
                  payback.mesesRestantes != null
                    ? payback.mesesRestantes < 1
                      ? "¡recuperada! 🎉"
                      : `~${Math.round(payback.mesesRestantes)} meses restantes`
                    : "sin ritmo de ahorro aún"
                }
                index={3} />
            ) : (
              <StatTile label="Payback" value="—" accent="solar"
                sub="cargá el costo del sistema (y la tarifa) abajo" index={3} />
            )}
          </section>

          <SectionCard title="Ahorro por mes">
            <FinanceMonthlyBars data={monthlyMoney} currency={cur} />
          </SectionCard>
        </>
      )}

      <SectionCard title="Parámetros económicos">
        <PlantConfigForm
          plantId={id}
          defaults={{
            buyTariff: plant.buyTariff,
            fuelPricePerL: plant.fuelPricePerL,
            genKwhPerL: plant.genKwhPerL,
            systemCost: plant.systemCost,
            currency: plant.currency,
          }}
        />
      </SectionCard>
    </div>
  );
}
