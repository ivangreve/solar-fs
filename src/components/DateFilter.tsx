"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const RANGOS = [7, 30, 90];

/** Suma días a un "YYYY-MM-DD" (aritmética UTC, sin arrastre de TZ). */
function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Filtro de fecha transversal: día (intradía/KPIs) + rango (gráficos de barras).
 * Vive en la URL (?dia=&rango=) → compartible, back funciona y lo leen los Server
 * Components. `today` viene del server (zona horaria del equipo, no del navegador).
 * Se oculta en tabs "en vivo" (dispositivos) y sin datos por fecha (finanzas).
 */
export function DateFilter({ today }: { today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  if (/\/(dispositivos|finanzas)/.test(pathname)) return null;

  const dia = sp.get("dia") ?? today;
  const rango = sp.get("rango") ?? "30";

  const apply = (nextDia: string, nextRango: string) => {
    const q = new URLSearchParams(sp.toString());
    // defaults → URL limpia
    if (nextDia === today) q.delete("dia");
    else q.set("dia", nextDia);
    if (nextRango === "30") q.delete("rango");
    else q.set("rango", nextRango);
    router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  const esHoy = dia === today;
  const btn =
    "rounded-lg px-2 py-1 text-xs ring-1 ring-[var(--border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text)] hover:ring-[var(--border-strong)] disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <button type="button" className={btn} aria-label="Día anterior" onClick={() => apply(shiftDay(dia, -1), rango)}>
          ‹
        </button>
        <input
          type="date"
          value={dia}
          max={today}
          onChange={(e) => e.target.value && apply(e.target.value, rango)}
          className="rounded-lg bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text)] ring-1 ring-[var(--border)] outline-none [color-scheme:inherit]"
        />
        <button type="button" className={btn} aria-label="Día siguiente" disabled={esHoy} onClick={() => apply(shiftDay(dia, 1), rango)}>
          ›
        </button>
        {!esHoy && (
          <button type="button" className={btn} onClick={() => apply(today, rango)}>
            Hoy
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {RANGOS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => apply(dia, String(r))}
            className={`rounded-lg px-2.5 py-1 text-xs ring-1 transition-colors ${
              String(r) === rango
                ? "bg-amber-400/15 text-amber-400 ring-amber-400/40"
                : "text-[var(--text-muted)] ring-[var(--border)] hover:text-[var(--text)]"
            }`}
          >
            {r} días
          </button>
        ))}
      </div>
    </div>
  );
}
