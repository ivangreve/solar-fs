/** Primitivas de skeleton para estados de carga. Server-compatible. */

/** Bloque fantasma básico con pulso. Dimensioná con className (o style para alturas dinámicas). */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse rounded bg-[var(--surface-2)] ${className}`} style={style} />;
}

/** Imita un StatTile: label chico + número grande fantasma. */
export function SkeletonTile() {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-[var(--border)]">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

/** Imita una SectionCard con chart: título fantasma + área de altura configurable. */
export function SkeletonChart({ height = 320 }: { height?: number }) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-[var(--border)]">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}
