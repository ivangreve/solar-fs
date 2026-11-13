"use client";

/** Vista de error compartida por los boundaries (raíz y planta). */
export function ErrorView({
  error,
  onRetry,
  minHeight = "60vh",
}: {
  error: Error & { digest?: string };
  onRetry: () => void;
  minHeight?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center" style={{ minHeight }}>
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-[var(--c-danger)] ring-1 ring-red-500/25">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      <h2 className="mt-5 text-lg font-semibold tracking-tight text-[var(--text)]">Algo se rompió cargando esta vista</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Probá de nuevo en un toque — si sigue así, avisanos.</p>
      {error.message && (
        <p className="mt-3 max-w-md break-words rounded-lg bg-[var(--surface-2)] px-3 py-2 font-mono text-xs text-[var(--text-faint)]">
          {error.message}
        </p>
      )}
      <button onClick={onRetry} className="btn btn-primary mt-6 !px-5">
        Reintentar
      </button>
    </div>
  );
}
