import { Entity, PrimaryColumn, Column } from "typeorm";

/**
 * Rollup diario por dispositivo. Lo calcula el job de ingesta a partir de `telemetry`
 * (reemplaza los "continuous aggregates" de Timescale). Acá viven los KPIs derivados
 * que la API no da: autosuficiencia, autoconsumo, ahorro.
 */
@Entity("daily_stats")
export class DailyStat {
  @PrimaryColumn("varchar", { name: "device_sn" })
  deviceSn!: string;

  @PrimaryColumn("date")
  day!: string;

  @Column("double precision", { name: "e_pv_kwh", nullable: true })
  ePvKwh!: number | null;

  @Column("double precision", { name: "e_load_kwh", nullable: true })
  eLoadKwh!: number | null;

  @Column("double precision", { name: "e_grid_in_kwh", nullable: true })
  eGridInKwh!: number | null;

  @Column("double precision", { name: "e_grid_feed_kwh", nullable: true })
  eGridFeedKwh!: number | null;

  @Column("double precision", { name: "e_bat_char_kwh", nullable: true })
  eBatCharKwh!: number | null;

  @Column("double precision", { name: "e_bat_dischar_kwh", nullable: true })
  eBatDisCharKwh!: number | null;

  /** Energía del generador a nafta (kWh). 0 mientras no se use. */
  @Column("double precision", { name: "e_gen_kwh", nullable: true })
  eGenKwh!: number | null;

  /** % del consumo cubierto por generación propia (PV+batería). */
  @Column("double precision", { name: "self_sufficiency_pct", nullable: true })
  selfSufficiencyPct!: number | null;

  /** % de la generación FV consumida in-situ (no exportada). */
  @Column("double precision", { name: "self_consumption_pct", nullable: true })
  selfConsumptionPct!: number | null;

  @Column("double precision", { nullable: true })
  savings!: number | null;

  @Column("double precision", { name: "feed_income", nullable: true })
  feedIncome!: number | null;

  @Column("double precision", { name: "peak_pv_w", nullable: true })
  peakPvW!: number | null;

  @Column("double precision", { name: "min_soc", nullable: true })
  minSoc!: number | null;

  @Column("double precision", { name: "max_soc", nullable: true })
  maxSoc!: number | null;
}
