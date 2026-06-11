import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

/** Una planta solar (estación). Metadata + parámetros económicos cargados por el usuario. */
@Entity("plants")
export class Plant {
  /** Nuestro id interno = el plantId de Felicity (string numérico). */
  @PrimaryColumn("varchar")
  id!: string;

  /**
   * Dueño (usuario cuya cuenta Felicity reportó esta planta). Nullable para no romper
   * `db:sync` con plantas pre-existentes; se reclama en el primer sync del dueño.
   * Toda la autorización se propaga por join Device.plantId → Plant.ownerUserId.
   */
  @Index()
  @Column("uuid", { name: "owner_user_id", nullable: true })
  ownerUserId!: string | null;

  @Column("varchar")
  name!: string;

  @Column("varchar", { name: "org_code", nullable: true })
  orgCode!: string | null;

  @Column("varchar", { nullable: true })
  country!: string | null;

  @Column("varchar", { nullable: true })
  tz!: string | null;

  /** Ubicación para el pronóstico solar (Felicity no siempre la trae; editable). */
  @Column("double precision", { nullable: true })
  lat!: number | null;

  @Column("double precision", { nullable: true })
  lon!: number | null;

  @Column("date", { name: "install_date", nullable: true })
  installDate!: string | null;

  @Column("double precision", { name: "rated_power_w", nullable: true })
  ratedPowerW!: number | null;

  // ── Inputs del usuario (no vienen de la API) ──
  @Column("double precision", { name: "system_cost", nullable: true })
  systemCost!: number | null;

  @Column("double precision", { name: "buy_tariff", nullable: true })
  buyTariff!: number | null;

  @Column("double precision", { name: "feed_tariff", nullable: true })
  feedTariff!: number | null;

  @Column("varchar", { default: "USD" })
  currency!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
