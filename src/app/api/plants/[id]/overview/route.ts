import { NextResponse } from "next/server";
import { getDataSource } from "@/server/db/data-source";
import { Plant } from "@/server/db/entities/Plant";
import { Device } from "@/server/db/entities/Device";
import { Telemetry } from "@/server/db/entities/Telemetry";
import { DailyStat } from "@/server/db/entities/DailyStat";
import { getSessionUser } from "@/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Datos para el Overview de una planta: KPIs del día + último dato en vivo.
 * Ejemplo de BFF que consume NUESTRA DB (rápido, sin pegarle a Felicity).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const ds = await getDataSource();

    // findOneBy con ownerUserId: una planta ajena devuelve 404 (no filtra datos).
    const plant = await ds.getRepository(Plant).findOneBy({ id, ownerUserId: user.id });
    if (!plant) return NextResponse.json({ ok: false, error: "planta no encontrada" }, { status: 404 });

    const devices = await ds.getRepository(Device).find({ where: { plantId: id } });
    const today = new Date().toISOString().slice(0, 10);

    const overview = await Promise.all(
      devices.map(async (dev) => {
        const latest = await ds.getRepository(Telemetry).findOne({
          where: { deviceSn: dev.deviceSn },
          order: { ts: "DESC" },
        });
        const daily = await ds.getRepository(DailyStat).findOneBy({ deviceSn: dev.deviceSn, day: today });
        return { device: dev, latest, today: daily };
      }),
    );

    return NextResponse.json({ ok: true, plant, overview });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
