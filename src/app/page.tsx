import Link from "next/link";
import { getPlants, getPlantOverview } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ENERGY_COLORS, fmtW, fmtKwh, fmtPct } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function liveness(lastTs: string | null): { color: string; label: string } {
  if (!lastTs) return { color: "#7f8a9b", label: "sin datos" };
  const mins = Math.round((Date.now() - new Date(lastTs).getTime()) / 60000);
  if (mins < 15) return { color: ENERGY_COLORS.battery, label: mins < 1 ? "en vivo" : `en vivo · ${mins} min` };
  if (mins < 60) return { color: ENERGY_COLORS.solar, label: `hace ${mins} min` };
  return { color: "#7f8a9b", label: `hace ${Math.round(mins / 60)} h` };
}

export default async function Home() {
  const user = await requireUser();
  let plants: Awaited<ReturnType<typeof getPlants>> = [];
  let error: string | null = null;
  try {
    plants = await getPlants(user.id);
  } catch (e) {
    error = (e as Error).message;
  }

  // Overview en vivo de cada planta (pocas plantas por usuario; barato).
  const overviews = await Promise.all(plants.map((p) => getPlantOverview(p.id, user.id)));

  const totalNow = overviews.reduce((s, o) => s + (o?.pvNowW ?? 0), 0);
  const totalToday = overviews.reduce((s, o) => s + (o?.ePvKwh ?? 0), 0);
  const firstName = user.realName?.split(" ")[0];

  return (
    <>
      <AppHeader sync />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title={firstName ? `Hola, ${firstName}` : "Tus plantas"}
          subtitle={
            plants.length > 0
              ? `${plants.length} ${plants.length === 1 ? "planta conectada" : "plantas conectadas"} · ${fmtW(totalNow)} generando ahora · ${fmtKwh(totalToday, 1)} hoy`
              : "Tus plantas Felicity"
          }
        />

        {error && (
          <div role="alert" className="mt-8 rounded-2xl bg-[color-mix(in_srgb,var(--c-danger)_10%,transparent)] p-4 text-sm text-[var(--c-danger)] ring-1 ring-[color-mix(in_srgb,var(--c-danger)_35%,transparent)]">
            No se pudo leer la DB: {error}.
          </div>
        )}

        {!error && plants.length === 0 && (
          <div className="card mt-8 flex flex-col items-center gap-2 border border-dashed border-[var(--border-strong)] px-6 py-14 text-center">
            <p className="text-base font-medium text-[var(--text)]">Todavía no hay plantas</p>
            <p className="max-w-sm text-sm text-[var(--text-muted)]">
              Cerrá sesión y volvé a entrar para sincronizar tu cuenta Felicity.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {plants.map((p, i) => {
            const ov = overviews[i];
            const live = liveness(ov?.lastTs ?? null);
            const isLive = live.label.startsWith("en vivo");
            const soc = ov?.socAvg ?? null;
            return (
              <Reveal key={p.id} index={i}>
                <Link
                  href={`/plant/${p.id}`}
                  className="card group relative block overflow-hidden p-5 transition-all duration-200 hover:shadow-[0_0_0_1px_var(--border-strong)] sm:p-7"
                >
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold tracking-tight text-[var(--text)]">{p.name}</div>
                      <div className="num mt-1 text-[13px] tracking-normal text-[var(--text-muted)]">
                        {p.country ?? "—"}
                        {p.ratedPowerW ? ` · ${(p.ratedPowerW / 1000).toFixed(1)} kWp` : ""}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] ring-1 ring-[var(--border)]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: live.color }}
                      />
                      {live.label}
                    </span>
                  </div>

                  <div className="relative mt-5 grid grid-cols-3 gap-3">
                    <Metric label="Paneles" value={fmtW(ov?.pvNowW ?? 0)} color="var(--c-solar)" />
                    <Metric label="Generó hoy" value={fmtKwh(ov?.ePvKwh ?? 0, 1)} color="var(--c-solar)" />
                    <Metric label="Batería" value={soc != null ? fmtPct(soc) : "—"} color="var(--c-battery)" />
                  </div>

                  <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden>
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.max(0, Math.min(soc ?? 0, 100))}%`, backgroundColor: ENERGY_COLORS.battery }}
                    />
                  </div>

                  <div className="relative mt-4 flex items-center justify-end gap-1 text-xs font-medium text-[var(--accent)] opacity-80 transition-all group-hover:gap-1.5 group-hover:opacity-100">
                    Ver planta
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="eyebrow" style={{ color }}>{label}</div>
      <div className="num mt-1.5 text-xl font-medium text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}
