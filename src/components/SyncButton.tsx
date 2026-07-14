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
      className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-muted)] ring-1 ring-[var(--border)] transition-colors hover:text-[var(--text)] hover:ring-[var(--border-strong)] disabled:opacity-60"
    >
      {pending ? "Sincronizando…" : (msg ?? "Sync")}
    </button>
  );
}
