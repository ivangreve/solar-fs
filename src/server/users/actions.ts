"use server";

import { revalidatePath } from "next/cache";
import { getDataSource } from "@/server/db/data-source";
import { User } from "@/server/db/entities/User";
import { requireUser } from "@/server/auth/session";

export type UserConfigState = { ok?: boolean; error?: string };

/** Parsea un número de form: vacío → null; inválido o negativo → undefined (error). */
function numOrNull(v: FormDataEntryValue | null): number | null | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Config económica POR USUARIO: precio de la nafta y datos del generador (regional/propio,
 * no atado a una planta). Se usa para estimar litros y costo de combustible en Finanzas.
 */
export async function updateUserConfigAction(
  _prev: UserConfigState,
  formData: FormData,
): Promise<UserConfigState> {
  const user = await requireUser();

  const fuelPricePerL = numOrNull(formData.get("fuelPricePerL"));
  const genKwhPerL = numOrNull(formData.get("genKwhPerL"));
  if ([fuelPricePerL, genKwhPerL].includes(undefined)) {
    return { error: "Revisá los valores: tienen que ser números positivos (o vacío)." };
  }
  const genLabel = String(formData.get("genLabel") ?? "").trim().slice(0, 60) || null;
  const currency = String(formData.get("currency") ?? "ARS").trim().toUpperCase().slice(0, 3) || "ARS";

  await getDataSource().then((ds) =>
    ds.getRepository(User).update(user.id, {
      fuelPricePerL: fuelPricePerL as number | null,
      genKwhPerL: genKwhPerL as number | null,
      genLabel,
      currency,
    }),
  );

  revalidatePath("/config");
  return { ok: true };
}
