/** Primitivas de skeleton para estados de carga. Server-compatible. */

/** Bloque fantasma básico con pulso. Dimensioná con className (o style para alturas dinámicas). */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse rounded-md bg-[var(--surface-2)] ${className}`} style={style} />;
}

/** Imita un StatTile: label chico + número grande fantasma. */
export function SkeletonTile() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 !rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

/** Imita una SectionCard con chart: título fantasma + área de altura configurable. */
export function SkeletonChart({ height = 320 }: { height?: number }) {
  return (
    <div className="card p-5 sm:p-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 w-full !rounded-xl" style={{ height }} />
    </div>
  );
}
