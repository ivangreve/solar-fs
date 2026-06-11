import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginForm } from "./LoginForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Si ya hay sesión válida, no tiene sentido el login.
  if (await getSessionUser()) redirect("/");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">solar-fs</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Conectá tu cuenta Felicity Solar</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-8 rounded-2xl bg-[var(--surface)] p-6 ring-1 ring-[var(--border)]">
        <LoginForm />
        <p className="mt-5 text-xs text-[var(--text-faint)]">
          Usá el mismo usuario y contraseña con los que entrás a la app de Felicity. Tus
          credenciales se guardan encriptadas y solo se usan para traer tus datos.
        </p>
      </div>
    </main>
  );
}
