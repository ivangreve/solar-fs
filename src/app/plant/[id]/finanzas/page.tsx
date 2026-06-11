import { SectionCard } from "@/components/ui/SectionCard";
import { ENERGY_COLORS } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPCOMING = [
  {
    title: "Ahorro real",
    desc: "Cuánto te habría costado cada kWh que generaste, según tu tarifa eléctrica de referencia.",
    color: ENERGY_COLORS.money,
  },
  {
    title: "Costo del generador",
    desc: "Litros de nafta y pesos gastados, con precio del combustible configurable.",
    color: ENERGY_COLORS.generator,
  },
  {
    title: "Payback del sistema",
    desc: "Cuánto falta para recuperar la inversión, proyectado con tu generación real.",
    color: ENERGY_COLORS.battery,
  },
];

export default function FinanzasPage() {
  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="py-4 text-center">
          <div className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Próximamente</div>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">
            ¿Cuánta plata te ahorra el sol?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Esta sección va a convertir tus kWh en pesos: vas a cargar tu tarifa de referencia y el
            precio de la nafta, y el resto sale de los datos que ya estamos juntando.
          </p>
        </div>
      </SectionCard>

      <section className="grid gap-4 sm:grid-cols-3">
        {UPCOMING.map((f) => (
          <SectionCard key={f.title}>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.color }} />
              {f.title}
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{f.desc}</p>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
