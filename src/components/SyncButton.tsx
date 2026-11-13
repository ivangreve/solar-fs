"use client";

import { useState, useTransition } from "react";
import { syncNowAction } from "@/server/ingest/actions";

/**
 * Botón de sync manual. Refresca los datos en vivo al instante y dispara en background
 * el catch-up del histórico faltante (mismo trabajo que el login), sin re-loguearse.
 */
export function SyncButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <button
      type="button"
      disabled={pending}
      title="Actualizar datos ahora y recuperar días faltantes"
      onClick={() =>
        start(async () => {
          const res = await syncNowAction();
          setMsg(res.ok ? "✓ Sincronizado" : `⚠ ${res.error ?? "Error"}`);
          setTimeout(() => setMsg(null), 4000);
        })
      }
      className="btn"
    >
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden className={pending ? "animate-spin" : ""}
      >
        <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5" />
      </svg>
      <span className="hidden sm:inline">{pending ? "Sincronizando…" : (msg ?? "Sync")}</span>
    </button>
  );
}
