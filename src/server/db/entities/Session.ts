import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from "typeorm";

/**
 * Sesión server-side con token opaco (revocable). La cookie `sid` guarda solo el
 * `token`; logout/expiración = borrar la fila. Ver src/server/auth/session.ts.
 */
@Entity("sessions")
export class Session {
  /** Token opaco aleatorio (randomBytes(32).base64url). */
  @PrimaryColumn("varchar")
  token!: string;

  @Index()
  @Column("uuid", { name: "user_id" })
  userId!: string;

  @Index()
  @Column("timestamptz", { name: "expires_at" })
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
