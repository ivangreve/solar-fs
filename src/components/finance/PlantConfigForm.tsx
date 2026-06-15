"use client";

import { useActionState } from "react";
import { updatePlantConfigAction, type ConfigState } from "@/server/plants/actions";

type Defaults = {
  buyTariff: number | null;
  systemCost: number | null;
  currency: string;
};

const input =
  "w-full rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)] outline-none transition-shadow focus:ring-amber-400/50";
const label = "text-xs uppercase tracking-wide text-[var(--text-muted)]";

/** Parámetros económicos de la PLANTA: tarifa de red de referencia y costo del sistema. */
export function PlantConfigForm({ plantId, defaults }: { plantId: string; defaults: Defaults }) {
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    updatePlantConfigAction.bind(null, plantId),
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="buyTariff" className={label}>Tarifa de red ($/kWh)</label>
        <input id="buyTariff" name="buyTariff" type="text" inputMode="decimal"
          defaultValue={defaults.buyTariff ?? ""} placeholder="ej: 120" className={input} />
        <p className="text-[11px] text-[var(--text-faint)]">
          Lo que pagarías por kWh si tuvieras red — valoriza lo que el sol te ahorra.
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="systemCost" className={label}>Costo del sistema ($)</label>
        <input id="systemCost" name="systemCost" type="text" inputMode="decimal"
          defaultValue={defaults.systemCost ?? ""} placeholder="ej: 4500000" className={input} />
        <p className="text-[11px] text-[var(--text-faint)]">Paneles + inversor + baterías: habilita el payback.</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="currency" className={label}>Moneda</label>
        <select id="currency" name="currency" defaultValue={defaults.currency} className={input}>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="flex items-end gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state.ok && <span className="text-sm text-emerald-400">Guardado ✓</span>}
        {state.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
