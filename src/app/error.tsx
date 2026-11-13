"use client"; // los error boundaries deben ser Client Components

import { ErrorView } from "@/components/ui/ErrorView";

/**
 * Error boundary raíz (home y rutas sin boundary propio). `unstable_retry()`
 * (Next 16.2) re-fetchea y re-renderiza; `reset()` solo limpia estado sin re-fetch.
 */
export default function RootError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry?: () => void;
}) {
  return (
    <main>
      <ErrorView error={error} onRetry={() => (unstable_retry ?? reset)()} minHeight="70vh" />
    </main>
  );
}
