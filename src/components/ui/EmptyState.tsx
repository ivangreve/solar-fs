/**
 * Estado vacío amigable para reemplazar un chart sin datos.
 * Server-compatible (sin "use client"). `height` en px mantiene el alto
 * del chart que reemplaza para que el layout no salte.
 */
export function EmptyState({
  title,
  subtitle,
  height = 280,
}: {
  title: string;
  subtitle?: string;
  height?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]/50 px-8 text-center"
      style={{ height }}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="M20 12h2" />
          <path d="m19.07 4.93-1.41 1.41" />
          <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
          <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
        </svg>
      </span>
      <p className="mt-1 text-sm font-medium text-[var(--text)]">{title}</p>
      {subtitle && <p className="max-w-xs text-xs text-[var(--text-faint)]">{subtitle}</p>}
    </div>
  );
}
