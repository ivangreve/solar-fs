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
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-8 text-center"
      style={{ height }}
    >
      {/* Nube con sol asomando */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--text-faint)]"
        aria-hidden="true"
      >
        <path d="M12 2v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="M20 12h2" />
        <path d="m19.07 4.93-1.41 1.41" />
        <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
        <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
      </svg>
      <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">{title}</p>
      {subtitle && <p className="max-w-xs text-xs text-[var(--text-faint)]">{subtitle}</p>}
    </div>
  );
}
