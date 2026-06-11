import { Entity, PrimaryColumn, Column } from "typeorm";

/**
 * Estado de cada regla de alerta (anti-spam). Una alerta se envía cuando su condición
 * pasa a verdadera (active=false→true) y se re-arma cuando vuelve a la normalidad.
 * ruleKey: "soc_low:<plantId>" | "offline:<deviceSn>" | "gen_on:<plantId>" | "temp_high:<deviceSn>"
 */
@Entity("alert_states")
export class AlertState {
  @PrimaryColumn("varchar", { name: "rule_key" })
  ruleKey!: string;

  @Column("boolean", { default: false })
  active!: boolean;

  @Column("timestamptz", { name: "last_sent_at", nullable: true })
  lastSentAt!: Date | null;
}
