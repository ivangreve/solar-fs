import { SectionCard } from "@/components/ui/SectionCard";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import type { SolarForecast } from "@/server/forecast";
import { APP_TZ } from "@/server/time";

const dayName = (day: string, idx: number) => {
  if (idx === 0) return "Hoy";
  if (idx === 1) return "Mañana";
  const label = new Intl.DateTimeFormat("es-AR", { timeZone: APP_TZ, weekday: "long" }).format(
    new Date(`${day}T12:00:00Z`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Pronóstico de generación (radiación Open-Meteo calibrada con la generación real). */
export function ForecastCard({ forecast }: { forecast: SolarForecast }) {
  const max = Math.max(...forecast.days.map((d) => d.estKwh), 0.1);
  const nf = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

  return (
    <SectionCard title="Pronóstico de generación">
      <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${Math.min(forecast.days.length, 4)}`}>
        {forecast.days.map((d, i) => (
          <div key={d.day} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 ring-1 ring-[var(--border)]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[var(--text-muted)]">{dayName(d.day, i)}</span>
              <span className="text-[11px] text-[var(--text-faint)]">{d.day.slice(8, 10)}/{d.day.slice(5, 7)}</span>
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--text)]">
              ~{nf.format(d.estKwh)} <span className="text-xs font-normal text-[var(--text-muted)]">kWh</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${(d.estKwh / max) * 100}%`, backgroundColor: ENERGY_COLORS.solar }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-faint)]">
        Radiación pronosticada (Open-Meteo) calibrada con la generación real de tu sistema
        ({forecast.calibrationDays} días). Estimación orientativa.
      </p>
    </SectionCard>
  );
}
