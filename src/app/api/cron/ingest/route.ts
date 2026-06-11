import { NextResponse } from "next/server";
import { getDataSource } from "@/server/db/data-source";
import { ingestAllUsers } from "@/server/auth/ingest-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de ingesta para Vercel Cron (cada 5 min, ver vercel.json).
 * Protegido por CRON_SECRET (Vercel manda `Authorization: Bearer <secret>`).
 * Itera TODOS los usuarios: ingesta con las credenciales de cada uno (aislado por usuario).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const ds = await getDataSource();
    const results = await ingestAllUsers(ds);
    return NextResponse.json({ ok: true, users: results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
