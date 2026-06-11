import { Skeleton } from "@/components/ui/Skeleton";

/** Mini-stat fantasma de una card de planta (label + valor). */
function GhostStat() {
  return (
    <div>
      <Skeleton className="h-2.5 w-14" />
      <Skeleton className="mt-1.5 h-5 w-16" />
    </div>
  );
}

/** Card fantasma de planta: nombre, badge de liveness y 3 mini-stats. */
function GhostPlantCard() {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-[var(--border)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1.5 h-3 w-28" />
        </div>
        <Skeleton className="h-3 w-16 shrink-0" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <GhostStat />
        <GhostStat />
        <GhostStat />
      </div>
    </div>
  );
}

/** Skeleton de la home: header fantasma + grid de cards de planta. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <GhostPlantCard />
        <GhostPlantCard />
      </div>
    </main>
  );
}
