import Link from "next/link";
import { getPlants, getPlantOverview } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { Reveal } from "@/components/ui/Reveal";
import { ENERGY_COLORS, fmtW, fmtKwh } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function liveness(lastTs: string | null): { color: string; label: string } {
  if (!lastTs) return { color: "#6b7280", label: "sin datos" };
  const mins = Math.round((Date.now() - new Date(lastTs).getTime()) / 60000);
  if (mins < 15) return { color: ENERGY_COLORS.battery, label: mins < 1 ? "en vivo" : `en vivo · ${mins} min` };
  if (mins < 60) return { color: ENERGY_COLORS.solar, label: `hace ${mins} min` };
  return { color: "#6b7280", label: `hace ${Math.round(mins / 60)} h` };
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">solar-fs</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Hola{user.realName ? `, ${user.realName}` : ""} — tus plantas Felicity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/30">
          No se pudo leer la DB: {error}.
        </div>
      )}

      {!error && plants.length === 0 && (
        <div className="mt-8 rounded-xl p-4 text-sm text-[var(--text-muted)] ring-1 ring-[var(--border)]">
          No hay plantas todavía. Cerrá sesión y volvé a entrar para sincronizar tu cuenta Felicity.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {plants.map((p, i) => {
          const ov = overviews[i];
          const live = liveness(ov?.lastTs ?? null);
          return (
            <Reveal key={p.id} index={i}>
              <Link
                href={`/plant/${p.id}`}
                className="block rounded-2xl p-5 ring-1 bg-[var(--surface)] ring-[var(--border)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-amber-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-medium text-[var(--text)]">{p.name}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-faint)]">
                      {p.country ?? "—"}
                      {p.ratedPowerW ? ` · ${(p.ratedPowerW / 1000).toFixed(1)} kWp` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-faint)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${live.label.startsWith("en vivo") ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: live.color }}
                    />
                    {live.label}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">FV ahora</div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums text-amber-400">
                      {fmtW(ov?.pvNowW ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">Hoy</div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums text-sky-400">
                      {fmtKwh(ov?.ePvKwh ?? 0, 1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">Batería</div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums text-emerald-400">
                      {ov?.socAvg != null ? `${ov.socAvg} %` : "—"}
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </main>
  );
}
