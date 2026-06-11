import { logoutAction } from "@/server/auth/actions";

/** Botón de cierre de sesión. Postea a la Server Action (revoca la sesión + borra cookie). */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-muted)] ring-1 ring-[var(--border)] transition-colors hover:text-[var(--text)] hover:ring-[var(--border-strong)]"
      >
        Salir
      </button>
    </form>
  );
}
