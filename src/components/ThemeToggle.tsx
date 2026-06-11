"use client";

import { motion, AnimatePresence } from "motion/react";
import { useIsLightTheme } from "@/components/charts/chartTheme";

/** Toggle claro/oscuro: togglea la clase en <html> y persiste en cookie. */
export function ThemeToggle() {
  // El estado vive en el DOM (clase "light" en <html>); nos suscribimos vía
  // useSyncExternalStore + MutationObserver — sin setState en effects ni `mounted`.
  const isDark = !useIsLightTheme();

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.classList.toggle("light", next === "light");
    // cookie para que el server renderice el tema correcto en la próxima carga
    document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] ring-1 ring-[var(--border)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
