"use client"; // los error boundaries deben ser Client Components

import { ErrorView } from "@/components/ui/ErrorView";

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
  return <ErrorView error={error} onRetry={() => (unstable_retry ?? reset)()} minHeight="50vh" />;
}
