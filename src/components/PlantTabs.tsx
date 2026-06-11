"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";

/** Tabs de la sección de planta, con indicador activo animado (layoutId). */
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
    { label: "Resumen", href: base },
    { label: "Dispositivos", href: `${base}/dispositivos` },
    { label: "Energía", href: `${base}/energia` },
    { label: "Batería", href: `${base}/bateria` },
    { label: "Generador", href: `${base}/generador` },
    { label: "Finanzas", href: `${base}/finanzas` },
  ];

  return (
    <nav className="flex flex-wrap gap-1 border-b border-[var(--border)]">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${qs}`}
            className={`relative px-3 py-2 text-sm transition-colors ${
              active ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-400"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
