import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Un usuario de la app = una cuenta Felicity conectada. La identidad la da Felicity:
 * si `felicityUserName`/contraseña loguean contra su API, sos vos.
 *
 * `passwordEnc` guarda la contraseña de Felicity ENCRIPTADA (reversible, AES-256-GCM),
 * NO hasheada: el cron debe reusarla para re-loguear cuando el token JWT vence (~30d).
 * Ver src/server/auth/secretbox.ts.
 */
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { name: "felicity_user_name", unique: true })
  felicityUserName!: string;

  @Column("text", { name: "password_enc" })
  passwordEnc!: string;

  @Column("varchar", { name: "real_name", nullable: true })
  realName!: string | null;

  @Column("varchar", { name: "org_id", nullable: true })
  orgId!: string | null;

  @Column("varchar", { name: "org_code", nullable: true })
  orgCode!: string | null;

  @Column("varchar", { name: "org_name", nullable: true })
  orgName!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
