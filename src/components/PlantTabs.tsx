"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";

const ICONS: Record<string, React.ReactNode> = {
  resumen: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  dispositivos: <><rect x="4" y="3" width="16" height="12" rx="2" /><path d="M8 21h8M12 15v6" /></>,
  energia: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  bateria: <><rect x="2" y="7" width="18" height="10" rx="2" /><path d="M22 11v2M6 10v4M10 10v4" /></>,
  generador: <path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3 0-5 2-8Z" />,
  finanzas: <><circle cx="12" cy="12" r="9" /><path d="M14.8 9.2c-.5-1-1.5-1.5-2.8-1.5-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1c1.8.4 2.9 1 2.9 2.2s-1.2 2-2.9 2c-1.4 0-2.5-.6-3-1.6" /></>,
};

/** Tabs de la sección de planta: píldora activa animada (layoutId) + íconos. */
export function PlantTabs({ plantId }: { plantId: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const base = `/plant/${plantId}`;
  // Preservar el filtro de fecha (?dia=&rango=) al navegar entre tabs.
  const filter = new URLSearchParams();
  for (const k of ["dia", "rango"]) {
    const v = sp.get(k);
    if (v) filter.set(k, v);
  }
  const qs = filter.size ? `?${filter}` : "";
  const tabs = [
    { key: "resumen", label: "Resumen", href: base },
    { key: "dispositivos", label: "Dispositivos", href: `${base}/dispositivos` },
    { key: "energia", label: "Energía", href: `${base}/energia` },
    { key: "bateria", label: "Batería", href: `${base}/bateria` },
    { key: "generador", label: "Generador", href: `${base}/generador` },
    { key: "finanzas", label: "Finanzas", href: `${base}/finanzas` },
  ];

  return (
    <nav
      aria-label="Secciones de la planta"
      className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex gap-1 rounded-[14px] bg-[var(--surface)] p-1 ring-1 ring-[var(--border)]">
        {tabs.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={`${tab.href}${qs}`}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-4 text-sm font-medium transition-colors ${
                active ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-[10px] bg-[var(--surface-2)] ring-1 ring-[var(--border)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <svg
                className="relative hidden sm:block"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
              >
                {ICONS[tab.key]}
              </svg>
              <span className="relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
