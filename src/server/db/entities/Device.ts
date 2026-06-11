import { Entity, PrimaryColumn, Column, Index } from "typeorm";

/** Un dispositivo (inversor) dentro de una planta. */
@Entity("devices")
export class Device {
  /** PK = deviceSn de Felicity. */
  @PrimaryColumn("varchar", { name: "device_sn" })
  deviceSn!: string;

  @Index()
  @Column("varchar", { name: "plant_id" })
  plantId!: string;

  @Column("varchar", { nullable: true })
  model!: string | null;

  /** Rol derivado del modelo: inverter | battery | meter | unknown. */
  @Column("varchar", { default: "unknown" })
  role!: string;

  /** Tipo de dispositivo de Felicity (ej "OG"). Necesario en los payloads. */
  @Column("varchar", { name: "device_type", default: "OG" })
  deviceType!: string;

  @Column("double precision", { name: "rated_power_w", nullable: true })
  ratedPowerW!: number | null;

  /** Marca de tiempo del último dato persistido (para ingesta incremental). */
  @Column("timestamptz", { name: "last_ingested_at", nullable: true })
  lastIngestedAt!: Date | null;
}
