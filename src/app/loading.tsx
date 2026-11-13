import { Skeleton } from "@/components/ui/Skeleton";

function GhostPlantCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1.5 h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-20 shrink-0 !rounded-full" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="mt-2 h-6 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-5 h-1.5 w-full !rounded-full" />
    </div>
  );
}

/** Skeleton de la home: barra superior fantasma + título + grid de cards de planta. */
export default function Loading() {
  return (
    <>
      <div className="h-14 border-b border-[var(--border)]" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <GhostPlantCard />
          <GhostPlantCard />
        </div>
      </main>
    </>
  );
}
