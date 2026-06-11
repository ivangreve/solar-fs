"use server";

import { redirect } from "next/navigation";
import { getDataSource } from "@/server/db/data-source";
import { User } from "@/server/db/entities/User";
import { FelicityClient } from "@/server/felicity/client";
import { encryptSecret } from "@/server/auth/secretbox";
import { createSession, destroySession } from "@/server/auth/session";
import { syncPlantsAndDevices } from "@/server/ingest/ingest";

export type LoginState = { error?: string };

/**
 * Valida las credenciales contra la API de Felicity. Si loguean, sos vos:
 * upsertea el usuario (contraseña encriptada), reclama sus plantas y abre sesión.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const userName = String(formData.get("userName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!userName || !password) return { error: "Completá usuario y contraseña." };

  const client = new FelicityClient(userName, password);
  let userId: string;
  try {
    const data = await client.login(); // lanza FelicityError si las credenciales no sirven
    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const felicityUserName = data.userName ?? userName;
    await repo.upsert(
      {
        felicityUserName,
        passwordEnc: encryptSecret(password),
        realName: data.realName ?? null,
        orgId: data.orgId ?? null,
        orgCode: data.orgCode ?? null,
        orgName: data.orgName ?? null,
      },
      ["felicityUserName"],
    );
    const user = await repo.findOneByOrFail({ felicityUserName });
    userId = user.id;

    // Trae sus plantas al instante para que el home no aparezca vacío.
    // Best-effort: si el sync falla, igual lo dejamos entrar (el cron reintenta).
    try {
      await syncPlantsAndDevices(ds, client, userId);
    } catch (err) {
      console.error("[login] sync inicial falló:", (err as Error).message);
    }
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[login] falló:", msg);
    // En dev mostramos el error real para diagnosticar (en prod, mensaje genérico).
    const detail = process.env.NODE_ENV === "production" ? "" : ` · detalle: ${msg}`;
    return { error: `No se pudo iniciar sesión.${detail}` };
  }

  await createSession(userId);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
