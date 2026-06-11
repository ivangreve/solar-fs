import { publicEncrypt, constants } from "node:crypto";

/**
 * Clave pública RSA-2048 hardcodeada en el frontend de Felicity (ver
 * docs/API_FELICITYSOLAR.md). Se usa para encriptar la contraseña antes del login.
 */
const FELICITY_RSA_PUBKEY_B64 =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnAJE68pjWZmtSg6ZJs9FZugJXC6bBSluTW6mJttOLOaljrdErVnM5DNN+YFzpB9pAysTErjY1bnSVuEwQSwptnqUji7Ch2qMj2n+0eCp8p6vtSh7/tFr2ul8nDRtkoswLANAIwtUk/G85ipMpmY1W642LImnEJmGkkddlbjbjxJTZWR5hc/d9cPWb+AR77LxFFrMik3c+44v1kQlIPFP6EjIbOvt/Lv7fHWD9JI/YzN4y1gK7C/VQdNGuikQyNg+5W3rg9ecYf9I5uLAQwY/hxeI3lbNsErebqKe2EbJ8AwcNIC0lDBz53Sq0ML89QapEuy3fB+upuctxLULVDCbNwIDAQAB";

const PEM =
  "-----BEGIN PUBLIC KEY-----\n" +
  (FELICITY_RSA_PUBKEY_B64.match(/.{1,64}/g) ?? []).join("\n") +
  "\n-----END PUBLIC KEY-----\n";

/**
 * Encripta la contraseña igual que el frontend (JSEncrypt → RSA PKCS#1 v1.5).
 * Verificado end-to-end contra la API real.
 */
export function encryptPassword(plain: string): string {
  return publicEncrypt(
    { key: PEM, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(plain, "utf8"),
  ).toString("base64");
}
