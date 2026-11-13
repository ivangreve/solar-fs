import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/layout/Brand";
import { LoginForm } from "./LoginForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// El catch-up histórico del login corre en background con after() (deadline 45s).
// Le damos aire por encima del default (10s en Hobby), igual que la ruta de cron.
export const maxDuration = 60;

const FEATURES = [
  { t: "Tu propio histórico", d: "Guardamos telemetría cada 5 min: más datos que la app oficial." },
  { t: "KPIs reales", d: "Autosuficiencia, autoconsumo, generador y costo de combustible." },
  { t: "Multiusuario y privado", d: "Cada persona ve solo sus plantas." },
];

export default async function LoginPage() {
  // Si ya hay sesión válida, no tiene sentido el login.
  if (await getSessionUser()) redirect("/");

  return (
    <main className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <section className="relative hidden overflow-hidden border-r border-[var(--border)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-amber-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-[24rem] w-[24rem] rounded-full bg-orange-500/10 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <BrandMark size={40} />
          <span className="text-lg font-semibold tracking-tight">
            solar<span className="text-[var(--accent)]">-fs</span>
          </span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">
            Mirá qué hace tu sistema solar,{" "}
            <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
              watt por watt.
            </span>
          </h2>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.t} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <p className="text-sm text-[var(--text-muted)]">
                  <strong className="font-semibold text-[var(--text)]">{f.t}.</strong> {f.d}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-[var(--text-faint)]">Monitoreo para equipos Felicity Solar off-grid</p>
      </section>

      {/* Formulario */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-2.5 lg:hidden">
              <BrandMark />
              <span className="text-[15px] font-semibold tracking-tight">
                solar<span className="text-[var(--accent)]">-fs</span>
              </span>
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Conectá tu cuenta</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Entrá con tu usuario de Felicity Solar.</p>

          <LoginForm />

          <p className="mt-6 flex gap-2 text-xs leading-relaxed text-[var(--text-faint)]">
            <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Tus credenciales se guardan encriptadas y solo se usan para traer tus datos.
          </p>
        </div>
      </section>
    </main>
  );
}
