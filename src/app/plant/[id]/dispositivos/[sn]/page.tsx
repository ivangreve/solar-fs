import Link from "next/link";
import { getDeviceDetail, getDeviceSeries } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { DeviceIntradayChart } from "@/components/devices/DeviceIntradayChart";
import { fmtW, fmtKwh, fmtPct } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { inverter: "Inversor", battery: "Batería", meter: "Medidor" };

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string; sn: string }>;
}) {
  const { id, sn } = await params;
  const user = await requireUser();
  const detail = await getDeviceDetail(sn, user.id);
  if (!detail) {
    return (
      <SectionCard>
        Dispositivo no encontrado.{" "}
        <Link href={`/plant/${id}/dispositivos`} className="text-amber-400 underline">
          Volver
        </Link>
      </SectionCard>
    );
  }
  const { device, latest, today } = detail;
  const series = await getDeviceSeries(sn, user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <Link href={`/plant/${id}/dispositivos`} className="text-xs text-neutral-500 hover:text-neutral-300">
            ← Dispositivos
          </Link>
          <h2 className="text-lg font-medium text-neutral-100">
            {device.model ?? "Dispositivo"}{" "}
            <span className="text-sm text-neutral-500">· {ROLE_LABEL[device.role] ?? device.role}</span>
          </h2>
          <div className="font-mono text-[11px] text-neutral-600">{device.deviceSn}</div>
        </div>
      </div>

      {device.role === "inverter" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="FV ahora" value={fmtW(latest.pvPowerW)} accent="solar" />
            <StatTile label="Salida AC" value={fmtW(latest.acOutPowerW)} accent="load"
              sub={latest.acOutVolt != null ? `${Math.round(latest.acOutVolt)} V · ${latest.acOutFreq ?? "—"} Hz` : undefined} />
            <StatTile label="Generado hoy" value={fmtKwh(today.ePvKwh)} accent="solar" />
            <StatTile label="Temperatura" value={latest.tempMax != null ? `${Math.round(latest.tempMax)}` : "—"} unit="°C" accent="generator" />
          </section>

          <SectionCard title="Strings fotovoltaicos · ahora">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((n) => {
                const v = latest[`pv${n}PowerW` as keyof typeof latest];
                return (
                  <div key={n} className="rounded-lg bg-neutral-800/50 px-3 py-2">
                    <div className="text-xs text-neutral-500">String {n}</div>
                    <div className="text-base font-semibold tabular-nums text-neutral-100">{fmtW(v)}</div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Generación y consumo · hoy">
            <DeviceIntradayChart data={series.intraday} mode="power" />
          </SectionCard>
        </>
      )}

      {device.role === "battery" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Carga (SOC)" value={latest.socPct != null ? `${Math.round(latest.socPct)}` : "—"} unit="%" accent="battery" />
            <StatTile label="Voltaje" value={latest.battVolt != null ? `${latest.battVolt.toFixed(1)}` : "—"} unit="V" accent="battery" />
            <StatTile label="Cargado hoy" value={fmtKwh(today.eBatCharKwh)} accent="battery" />
            <StatTile label="Descargado hoy" value={fmtKwh(today.eBatDisCharKwh)} accent="load" />
          </section>
          <SectionCard title="Estado de carga (SOC) · hoy">
            <DeviceIntradayChart data={series.intraday} mode="soc" />
          </SectionCard>
        </>
      )}

      {device.role === "meter" && (
        <SectionCard>
          <p className="text-sm text-neutral-400">
            Este dispositivo es un medidor/colector y no reporta telemetría propia. Los datos del sistema
            se leen desde el inversor y las baterías.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
