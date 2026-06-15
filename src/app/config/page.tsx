import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { UserConfigForm } from "@/components/config/UserConfigForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const user = await requireUser();

  return (
    <PageShell>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/" className="text-xs text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)]">
            ← Plantas
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text)] sm:text-2xl">Configuración</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">Tus parámetros para los cálculos económicos</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <SectionCard title="Combustible y generador">
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Estos datos son tuyos (no de una planta puntual) y se usan para estimar litros y costo de nafta
          en Finanzas. La tarifa de red y el costo del sistema se cargan en cada planta.
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
  );
}
