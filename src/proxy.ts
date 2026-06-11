import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Chequeo OPTIMISTA de auth (Next 16 llama "proxy" al middleware). Solo mira si existe
 * la cookie `sid` para redirigir temprano — NO consulta la DB ni valida el token. La
 * validación real (token existe y no expiró) la hace requireUser() server-side en cada
 * página. Las rutas /api se auto-protegen con getSessionUser (devuelven 401, no redirect).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("sid")?.value);
  const isLogin = pathname === "/login";

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo salvo /api, assets de Next y archivos con extensión.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
