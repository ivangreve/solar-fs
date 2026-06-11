import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { MoreThan } from "typeorm";
import { getDataSource } from "@/server/db/data-source";
import { Session } from "@/server/db/entities/Session";
import { User } from "@/server/db/entities/User";

const COOKIE = "sid";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

/**
 * Usuario de la sesión actual, o null. Validación REAL (token existe en DB y no expiró).
 * Usable desde Server Components, queries y route handlers.
 */
export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const ds = await getDataSource();
  const session = await ds.getRepository(Session).findOne({
    where: { token, expiresAt: MoreThan(new Date()) },
  });
  if (!session) return null;

  return ds.getRepository(User).findOneBy({ id: session.userId });
}

/** Como getSessionUser pero redirige a /login si no hay sesión válida. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Crea una sesión y setea la cookie httpOnly. Solo desde Server Actions / Route Handlers
 * (donde cookies().set está permitido).
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);

  const ds = await getDataSource();
  await ds.getRepository(Session).insert({ token, userId, expiresAt });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Borra la sesión actual (fila + cookie). Revocación inmediata. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    const ds = await getDataSource();
    await ds.getRepository(Session).delete({ token });
  }
  store.delete(COOKIE);
}
