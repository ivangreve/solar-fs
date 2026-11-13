import { notFound } from "next/navigation";
import { getPlants } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { PlantTabs } from "@/components/PlantTabs";
import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateFilter } from "@/components/DateFilter";
import { localToday } from "@/server/time";

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
    <>
      <AppHeader />
      <PageShell>
        <PageHeader
          title={plant.name}
          back={{ href: "/", label: "Plantas" }}
          subtitle={
            [plant.country, plant.ratedPowerW ? `${(plant.ratedPowerW / 1000).toFixed(1)} kWp` : null]
              .filter(Boolean)
              .join(" · ") || undefined
          }
        />
        <div className="mt-5">
          <PlantTabs plantId={id} />
        </div>
        <DateFilter today={localToday()} />
        <div className="mt-6">{children}</div>
      </PageShell>
    </>
  );
}
