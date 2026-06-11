import Link from "next/link";
import { getDevicesWithRole, getPlantOverview } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { SectionCard } from "@/components/ui/SectionCard";
import { SystemTopology } from "@/components/devices/SystemTopology";
import { ENERGY_COLORS } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  inverter: "Inversor",
  battery: "Batería",
  meter: "Medidor",
  unknown: "Dispositivo",
};
const STATUS_LABEL = { online: "En línea", stale: "Demorado", offline: "Sin conexión" } as const;
const STATUS_COLOR = { online: ENERGY_COLORS.battery, stale: ENERGY_COLORS.solar, offline: "#6b7280" } as const;

function ago(ts: string | null): string {
  if (!ts) return "—";
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

export default async function DispositivosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [devices, ov] = await Promise.all([getDevicesWithRole(id, user.id), getPlantOverview(id, user.id)]);

  return (
    <div className="space-y-6">
      <SectionCard title="Esquema del sistema">
        <SystemTopology
          plantId={id}
          devices={devices}
          pvNowW={ov?.pvNowW ?? 0}
          loadNowW={ov?.loadNowW ?? 0}
        />
        <p className="mt-5 text-center text-xs text-neutral-500">
          Tocá un dispositivo para ver su detalle. Los paneles se monitorean como strings del inversor.
        </p>
      </SectionCard>

      <SectionCard title="Dispositivos">
        <div className="divide-y divide-white/5">
          {devices.map((d) => {
            const clickable = d.role !== "meter";
            const row = (
              <div className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[d.status] }} />
                    <span className="truncate text-sm text-neutral-200">{d.model ?? "—"}</span>
                    <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-400">
                      {ROLE_LABEL[d.role] ?? d.role}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-neutral-600">{d.deviceSn}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-neutral-400">{STATUS_LABEL[d.status]}</div>
                  <div className="text-[11px] text-neutral-600">{ago(d.lastTs)}</div>
                </div>
              </div>
            );
            return clickable ? (
              <Link
                key={d.deviceSn}
                href={`/plant/${id}/dispositivos/${d.deviceSn}`}
                className="block -mx-2 rounded-lg px-2 transition-colors hover:bg-white/5"
              >
                {row}
              </Link>
            ) : (
              <div key={d.deviceSn} className="-mx-2 px-2 opacity-70">
                {row}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
