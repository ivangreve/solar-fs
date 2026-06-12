import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * Encriptación reversible at-rest (AES-256-GCM) para la contraseña Felicity de cada
 * usuario. Es REVERSIBLE a propósito: el cron debe desencriptarla para re-loguear.
 * NO confundir con felicity/crypto.ts (RSA, solo para el payload del login a Felicity)
 * ni con un hash (bcrypt es irreversible → no sirve acá).
 *
 * Clave: env APP_ENCRYPTION_KEY. Acepta 32 bytes en base64, o cualquier passphrase
 * (se deriva con SHA-256 a 32 bytes). Falla ruidoso si falta.
 */
function key(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "Falta APP_ENCRYPTION_KEY en el entorno (32 bytes en base64, o una passphrase).",
    );
  }
  const asB64 = Buffer.from(raw, "base64");
  if (asB64.length === 32) return asB64;
  // No es base64 de 32 bytes → derivar a 32 bytes desde la passphrase.
  return createHash("sha256").update(raw, "utf8").digest();
}

/** plain → "iv:tag:ciphertext" (cada parte en base64). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ct].map((b) => b.toString("base64")).join(":");
}

/**
 * Error tipado: el secreto guardado no se puede desencriptar con la clave actual
 * (fue encriptado con OTRA APP_ENCRYPTION_KEY, o los datos están corruptos).
 * La única recuperación es que el dueño re-ingrese la credencial.
 */
export class CredencialIndescifrable extends Error {
  constructor() {
    super("Credencial encriptada con otra clave — requiere re-login del usuario");
    this.name = "CredencialIndescifrable";
  }
}

/** "iv:tag:ciphertext" → plain. Lanza CredencialIndescifrable si el tag no valida. */
export function decryptSecret(stored: string): string {
  const [iv, tag, ct] = stored.split(":").map((s) => Buffer.from(s, "base64"));
  if (!iv || !tag || !ct) throw new CredencialIndescifrable();
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    throw new CredencialIndescifrable();
  }
}
