import Link from "next/link";
import { getDeviceDetail, getDeviceSeries } from "@/server/queries";
import { requireUser } from "@/server/auth/session";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { DeviceIntradayChart } from "@/components/devices/DeviceIntradayChart";
import { InverterUnit } from "@/components/devices/InverterUnit";
import { BatteryUnit } from "@/components/devices/BatteryUnit";
import { ENERGY_COLORS, fmtW, fmtKwh } from "@/components/ui/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { inverter: "Inversor", battery: "Batería", meter: "Medidor" };

function liveness(lastTs: string | null): { color: string; label: string; online: boolean } {
  if (!lastTs) return { color: "#6b7280", label: "sin datos", online: false };
  const mins = Math.round((Date.now() - new Date(lastTs).getTime()) / 60000);
  if (mins < 15) return { color: ENERGY_COLORS.battery, label: mins < 1 ? "en vivo" : `en vivo · hace ${mins} min`, online: true };
  if (mins < 60) return { color: ENERGY_COLORS.solar, label: `hace ${mins} min`, online: true };
  const h = Math.round(mins / 60);
  return { color: "#6b7280", label: h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`, online: false };
}

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
        <span className="text-[var(--text-muted)]">Dispositivo no encontrado. </span>
        <Link href={`/plant/${id}/dispositivos`} className="text-amber-400 underline">
          Volver
        </Link>
      </SectionCard>
    );
  }
  const { device, latest, today, lastTs, sohPct } = detail;
  const series = await getDeviceSeries(sn, user.id);
  const live = liveness(lastTs);

  // Strings FV con dato (los inversores chicos no usan los 4) y su aporte relativo.
  const strings = [1, 2, 3, 4]
    .map((n) => ({ n, w: latest[`pv${n}PowerW`] }))
    .filter((s): s is { n: number; w: number } => s.w != null);
  const stringsTotal = strings.reduce((acc, s) => acc + s.w, 0);

  return (
    <div className="space-y-6">
      {/* Hero: ilustración + identidad + frescura */}
      <SectionCard>
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            {device.role === "battery" ? (
              <BatteryUnit soc={latest.socPct} size={96} />
            ) : device.role === "inverter" ? (
              <InverterUnit online={live.online} size={104} />
            ) : (
              <div className="flex h-24 w-20 items-center justify-center rounded-2xl ring-1 ring-[var(--border)] text-[var(--text-faint)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M12 3v4M5 10a8 8 0 0 1 14 0M8 13a4.5 4.5 0 0 1 8 0M12 17h.01" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/plant/${id}/dispositivos`}
              className="text-xs text-[var(--text-faint)] transition-colors hover:text-[var(--text-muted)]"
            >
              ← Dispositivos
            </Link>
            <h2 className="mt-0.5 truncate text-xl font-semibold text-[var(--text)]">
              {device.model ?? "Dispositivo"}{" "}
              <span className="text-sm font-normal text-[var(--text-muted)]">
                · {ROLE_LABEL[device.role] ?? device.role}
              </span>
            </h2>
            <div className="mt-0.5 font-mono text-[11px] text-[var(--text-faint)]">{device.deviceSn}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${live.label.startsWith("en vivo") ? "animate-pulse" : ""}`}
                style={{ backgroundColor: live.color }}
              />
              {live.label}
            </div>
          </div>
        </div>
      </SectionCard>

      {device.role === "inverter" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="FV ahora" value={fmtW(latest.pvPowerW)} accent="solar" index={0} />
            <StatTile label="Salida AC" value={fmtW(latest.acOutPowerW)} accent="load" index={1}
              sub={latest.acOutVolt != null ? `${Math.round(latest.acOutVolt)} V · ${latest.acOutFreq ?? "—"} Hz` : undefined} />
            <StatTile label="Generado hoy" value={fmtKwh(today.ePvKwh)} accent="solar" index={2} />
            <StatTile label="Temperatura" value={latest.tempMax != null ? `${Math.round(latest.tempMax)}` : "—"} unit="°C" accent="generator" index={3} />
          </section>

          {strings.length > 0 && (
            <SectionCard title="Strings fotovoltaicos · ahora">
              <div className={`grid grid-cols-2 gap-3 ${strings.length > 2 ? "sm:grid-cols-4" : ""}`}>
                {strings.map((s) => {
                  const share = stringsTotal > 0 ? (s.w / stringsTotal) * 100 : 0;
                  return (
                    <div key={s.n} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 ring-1 ring-[var(--border)]">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-[var(--text-muted)]">String {s.n}</span>
                        {stringsTotal > 0 && (
                          <span className="text-[11px] tabular-nums text-[var(--text-faint)]">{Math.round(share)} %</span>
                        )}
                      </div>
                      <div className="mt-1 text-base font-semibold tabular-nums text-[var(--text)]">{fmtW(s.w)}</div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${share}%`, backgroundColor: ENERGY_COLORS.solar }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[var(--text-faint)]">
                El aporte relativo entre strings sirve para detectar sombras o paneles sucios.
              </p>
            </SectionCard>
          )}

          <SectionCard title="Generación y consumo · hoy">
            <DeviceIntradayChart data={series.intraday} mode="power" />
          </SectionCard>
        </>
      )}

      {device.role === "battery" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Carga (SOC)" value={latest.socPct != null ? `${Math.round(latest.socPct)}` : "—"} unit="%" accent="battery" index={0}
              sub={latest.battVolt != null ? `${latest.battVolt.toFixed(1)} V` : undefined} />
            <StatTile label="Salud (SOH)" value={sohPct != null ? `${Math.round(sohPct)}` : "—"} unit="%" accent="battery" index={1}
              sub="capacidad restante vs nueva" />
            {/* La carga/descarga en kWh se estima a nivel sistema (inversor); la batería
                solo reporta SOC → mostramos el rango del día, que sí es dato propio. */}
            <StatTile label="SOC mínimo hoy" value={today.minSoc != null ? `${Math.round(today.minSoc)}` : "—"} unit="%" accent="load" index={2}
              sub="profundidad de descarga" />
            <StatTile label="SOC máximo hoy" value={today.maxSoc != null ? `${Math.round(today.maxSoc)}` : "—"} unit="%" accent="battery" index={3} />
          </section>
          <SectionCard title="Estado de carga (SOC) · hoy">
            <DeviceIntradayChart data={series.intraday} mode="soc" />
          </SectionCard>
        </>
      )}

      {device.role === "meter" && (
        <SectionCard>
          <p className="text-sm text-[var(--text-muted)]">
            Este dispositivo es un medidor/colector y no reporta telemetría propia. Los datos del sistema
            se leen desde el inversor y las baterías.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
