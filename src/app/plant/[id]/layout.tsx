import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlants } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { PlantTabs } from "@/components/PlantTabs";
import { PageShell } from "@/components/ui/PageShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const plants = await getPlants(user.id);
  const plant = plants.find((p) => p.id === id);
  // Si la planta no es del usuario (o no existe), 404 — no filtramos datos ajenos.
  if (!plant) notFound();

  return (
    <PageShell>
      <header className="mb-4 flex items-start justify-between">
        <div>
          <Link href="/" className="text-xs text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)]">
            ← Plantas
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{plant.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      <PlantTabs plantId={id} />
      <div className="mt-6">{children}</div>
    </PageShell>
  );
}
