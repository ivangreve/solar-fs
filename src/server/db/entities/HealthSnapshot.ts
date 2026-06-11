import { Entity, PrimaryColumn, Column } from "typeorm";

/**
 * Snapshot diario de salud de la batería/sistema. El histórico de Felicity NO trae
 * SOH fiable (`emsSoh` viene 0), así que lo capturamos nosotros día a día → habilita
 * la tendencia de degradación y la proyección de vida útil.
 */
@Entity("health_snapshots")
export class HealthSnapshot {
  @PrimaryColumn("varchar", { name: "device_sn" })
  deviceSn!: string;

  @PrimaryColumn("date")
  day!: string;

  @Column("double precision", { name: "soh_pct", nullable: true })
  sohPct!: number | null;

  @Column("int", { name: "cycle_index", nullable: true })
  cycleIndex!: number | null;

  @Column("int", { name: "full_count", nullable: true })
  fullCount!: number | null;

  @Column("double precision", { name: "cell_volt_spread_mv", nullable: true })
  cellVoltSpreadMv!: number | null;

  @Column("double precision", { name: "cell_temp_max", nullable: true })
  cellTempMax!: number | null;

  @Column("varchar", { name: "fault_code", nullable: true })
  faultCode!: string | null;

  @Column("int", { name: "warning_count", nullable: true })
  warningCount!: number | null;

  @Column("int", { name: "wifi_signal", nullable: true })
  wifiSignal!: number | null;
}
