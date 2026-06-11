import { SkeletonTile, SkeletonChart } from "@/components/ui/Skeleton";

/**
 * Skeleton genérico para todos los tabs de la planta (es el slot children del layout).
 * Anatomía común: tiles de KPIs arriba + charts abajo. El header/tabs/filtro quedan
 * visibles porque viven en layout.tsx.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </section>
      <SkeletonChart />
      <SkeletonChart height={260} />
    </div>
  );
}
