import { NextResponse } from "next/server";
import { getDataSource } from "@/server/db/data-source";
import { Plant } from "@/server/db/entities/Plant";
import { getSessionUser } from "@/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lista de plantas del usuario autenticado, desde NUESTRA DB. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const ds = await getDataSource();
    const plants = await ds.getRepository(Plant).find({
      where: { ownerUserId: user.id },
      order: { name: "ASC" },
    });
    return NextResponse.json({ ok: true, plants });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
