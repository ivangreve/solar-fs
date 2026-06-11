import { Entity, PrimaryColumn, Column, Index } from "typeorm";

/**
 * Telemetría a 5 minutos (la tabla caliente). PK compuesta (device_sn, ts)
 * para idempotencia del upsert. Indexada por ts para queries de rango.
 *
 * A escala actual (≈288 filas/día/dispositivo) Postgres plano sobra. Si el volumen
 * crece a millones de filas, migrar a TimescaleDB (hypertable + compresión) sin
 * tocar el resto del código.
 */
@Entity("telemetry")
@Index(["ts"])
export class Telemetry {
  @PrimaryColumn("varchar", { name: "device_sn" })
  deviceSn!: string;

  @PrimaryColumn("timestamptz")
  ts!: Date;

  @Column("double precision", { name: "pv_power_w", nullable: true })
  pvPowerW!: number | null;

  @Column("double precision", { name: "pv1_power_w", nullable: true })
  pv1PowerW!: number | null;

  @Column("double precision", { name: "pv2_power_w", nullable: true })
  pv2PowerW!: number | null;

  @Column("double precision", { name: "pv3_power_w", nullable: true })
  pv3PowerW!: number | null;

  @Column("double precision", { name: "pv4_power_w", nullable: true })
  pv4PowerW!: number | null;

  @Column("double precision", { name: "load_power_w", nullable: true })
  loadPowerW!: number | null;

  @Column("double precision", { name: "grid_in_power_w", nullable: true })
  gridInPowerW!: number | null;

  @Column("double precision", { name: "feed_power_w", nullable: true })
  feedPowerW!: number | null;

  @Column("double precision", { name: "batt_charge_w", nullable: true })
  battChargeW!: number | null;

  @Column("double precision", { name: "batt_discharge_w", nullable: true })
  battDischargeW!: number | null;

  @Column("double precision", { name: "soc_pct", nullable: true })
  socPct!: number | null;

  @Column("double precision", { name: "batt_volt", nullable: true })
  battVolt!: number | null;

  @Column("double precision", { name: "batt_curr", nullable: true })
  battCurr!: number | null;

  @Column("double precision", { name: "ac_out_power_w", nullable: true })
  acOutPowerW!: number | null;

  @Column("double precision", { name: "ac_out_volt", nullable: true })
  acOutVolt!: number | null;

  @Column("double precision", { name: "ac_out_freq", nullable: true })
  acOutFreq!: number | null;

  @Column("double precision", { name: "temp_max", nullable: true })
  tempMax!: number | null;

  @Column("double precision", { name: "mos_temp", nullable: true })
  mosTemp!: number | null;

  @Column("double precision", { name: "pv_temp", nullable: true })
  pvTemp!: number | null;

  @Column("double precision", { name: "e_today_kwh", nullable: true })
  eTodayKwh!: number | null;

  @Column("double precision", { name: "e_pv_today_kwh", nullable: true })
  ePvTodayKwh!: number | null;

  @Column("double precision", { name: "e_load_today_kwh", nullable: true })
  eLoadTodayKwh!: number | null;

  @Column("double precision", { name: "e_grid_in_today_kwh", nullable: true })
  eGridInTodayKwh!: number | null;

  @Column("double precision", { name: "e_grid_feed_today_kwh", nullable: true })
  eGridFeedTodayKwh!: number | null;

  @Column("double precision", { name: "e_bat_char_today_kwh", nullable: true })
  eBatCharTodayKwh!: number | null;

  @Column("double precision", { name: "e_bat_dischar_today_kwh", nullable: true })
  eBatDisCharTodayKwh!: number | null;

  // ── Generador a nafta (campos existen en Felicity pero vienen 0; nunca usado) ──
  @Column("double precision", { name: "gen_power_w", nullable: true })
  genPowerW!: number | null;

  @Column("double precision", { name: "gen_today_kwh", nullable: true })
  genTodayKwh!: number | null;

  @Column("double precision", { name: "gen_total_kwh", nullable: true })
  genTotalKwh!: number | null;
}
