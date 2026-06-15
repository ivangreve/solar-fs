"use client";

import { useActionState, useState } from "react";
import { updateUserConfigAction, type UserConfigState } from "@/server/users/actions";

type Defaults = {
  fuelPricePerL: number | null;
  genKwhPerL: number | null;
  genLabel: string | null;
  currency: string;
};

/** Presets de generador → rendimiento típico (kWh por litro). */
const GEN_PRESETS = [
  { label: "Nafta chico (~2 kVA)", kwhPerL: 3 },
  { label: "Nafta mediano (~5-7 kVA)", kwhPerL: 3.3 },
  { label: "Diésel", kwhPerL: 4 },
];

const input =
  "w-full rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)] outline-none transition-shadow focus:ring-amber-400/50";
const label = "text-xs uppercase tracking-wide text-[var(--text-muted)]";

/** Config económica del usuario: nafta + generador. */
export function UserConfigForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState<UserConfigState, FormData>(updateUserConfigAction, {});
  const [kwhPerL, setKwhPerL] = useState(defaults.genKwhPerL?.toString() ?? "");
  const [genLabel, setGenLabel] = useState(defaults.genLabel ?? "");

  const applyPreset = (p: (typeof GEN_PRESETS)[number]) => {
    setKwhPerL(String(p.kwhPerL));
    setGenLabel(p.label);
  };

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="fuelPricePerL" className={label}>Precio de la nafta ($/litro)</label>
        <input id="fuelPricePerL" name="fuelPricePerL" type="text" inputMode="decimal"
          defaultValue={defaults.fuelPricePerL ?? ""} placeholder="ej: 1300" className={input} />
        <p className="text-[11px] text-[var(--text-faint)]">Para calcular cuánto te cuesta cada arranque del generador.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="currency" className={label}>Moneda</label>
        <select id="currency" name="currency" defaultValue={defaults.currency} className={input}>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <label className={label}>¿Qué generador tenés?</label>
        <div className="flex flex-wrap gap-2">
          {GEN_PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-xs ring-1 transition-colors ${
                kwhPerL === String(p.kwhPerL)
                  ? "bg-amber-400/15 text-amber-400 ring-amber-400/40"
                  : "text-[var(--text-muted)] ring-[var(--border)] hover:text-[var(--text)] hover:ring-[var(--border-strong)]"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="genLabel" type="text" value={genLabel} onChange={(e) => setGenLabel(e.target.value)}
            placeholder="Nombre o modelo (opcional)" className={input} />
          <div>
            <input name="genKwhPerL" type="text" inputMode="decimal" value={kwhPerL}
              onChange={(e) => setKwhPerL(e.target.value)} placeholder="Rendimiento (kWh/L) — default 3" className={input} />
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">Elegí un preset o ajustá el rendimiento a mano. Si lo dejás vacío, usamos 3 kWh/L.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state.ok && <span className="text-sm text-emerald-400">Guardado ✓</span>}
        {state.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
