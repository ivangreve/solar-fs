import Link from "next/link";
import { getPlants } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { Reveal } from "@/components/ui/Reveal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  let plants: Awaited<ReturnType<typeof getPlants>> = [];
  let error: string | null = null;
  try {
    plants = await getPlants(user.id);
  } catch (e) {
    error = (e as Error).message;
  }

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
          No hay plantas. Corré <code>npm run sync:meta</code> para traerlas de Felicity.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((p, i) => (
          <Reveal key={p.id} index={i}>
            <Link
              href={`/plant/${p.id}`}
              className="block rounded-2xl p-5 ring-1 bg-[var(--surface)] ring-[var(--border)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-amber-400/40"
            >
              <div className="text-lg font-medium text-[var(--text)]">{p.name}</div>
              <div className="mt-1 text-xs text-[var(--text-faint)]">
                {p.country ?? "—"} · {p.ratedPowerW ? `${(p.ratedPowerW / 1000).toFixed(1)} kWp` : "—"}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
