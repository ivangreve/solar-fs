import { requireUser } from "@/server/auth/session";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserConfigForm } from "@/components/config/UserConfigForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const user = await requireUser();

  return (
    <>
      <AppHeader settings={false} />
      <PageShell narrow>
        <PageHeader
          title="Configuración"
          subtitle="Tus parámetros para los cálculos económicos"
          back={{ href: "/", label: "Plantas" }}
        />

        <SectionCard
          className="mt-8"
          title="Combustible y generador"
          description="Datos tuyos, no de una planta puntual"
        >
          <p className="mb-5 text-sm text-[var(--text-muted)]">
            Se usan para estimar litros y costo de nafta en Finanzas. La tarifa de red y el costo del
            sistema se cargan en cada planta.
          </p>
          <UserConfigForm
            defaults={{
              fuelPricePerL: user.fuelPricePerL,
              genKwhPerL: user.genKwhPerL,
              genLabel: user.genLabel,
              currency: user.currency,
            }}
          />
        </SectionCard>
      </PageShell>
    </>
  );
}
