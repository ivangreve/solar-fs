"use client"; // los error boundaries deben ser Client Components

/**
 * Error boundary de los tabs de planta. `unstable_retry()` (Next 16.2) re-fetchea
 * y re-renderiza el segmento; `reset()` solo limpia el estado sin re-fetch,
 * inútil acá porque el error viene de queries server-side.
 */
export default function PlantError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry?: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center">
      {/* Triángulo de alerta */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10 text-[var(--text-muted)]"
        aria-hidden
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <h2 className="mt-4 text-base font-semibold text-[var(--text)]">
        Algo se rompió cargando esta vista
      </h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Probá de nuevo en un toque — si sigue así, avisanos.
      </p>
      {error.message && (
        <p className="mt-3 max-w-md break-words font-mono text-xs text-[var(--text-faint)]">
          {error.message}
        </p>
      )}
      <button
        onClick={() => (unstable_retry ?? reset)()}
        className="mt-6 rounded-lg px-4 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)] transition-colors hover:ring-[var(--border-strong)]"
      >
        Reintentar
      </button>
    </div>
  );
}
