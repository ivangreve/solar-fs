import { logoutAction } from "@/server/auth/actions";

/** Botón de cierre de sesión. Postea a la Server Action (revoca la sesión + borra cookie). */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn" aria-label="Cerrar sesión">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span className="hidden sm:inline">Salir</span>
      </button>
    </form>
  );
}
