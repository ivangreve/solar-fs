"use server";

import { revalidatePath } from "next/cache";
import { getDataSource } from "@/server/db/data-source";
import { Plant } from "@/server/db/entities/Plant";
import { requireUser } from "@/server/auth/session";

export type ConfigState = { ok?: boolean; error?: string };

/** Parsea un número de form: vacío → null; inválido o negativo → undefined (error). */
function numOrNull(v: FormDataEntryValue | null): number | null | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Guarda los parámetros económicos de la planta (tarifa de red de referencia, nafta,
 * rendimiento del generador, costo del sistema). Solo el dueño puede editarla.
 */
export async function updatePlantConfigAction(
  plantId: string,
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const user = await requireUser();
  const ds = await getDataSource();
  const plant = await ds.getRepository(Plant).findOneBy({ id: plantId, ownerUserId: user.id });
  if (!plant) return { error: "Planta no encontrada." };

  const buyTariff = numOrNull(formData.get("buyTariff"));
  const fuelPricePerL = numOrNull(formData.get("fuelPricePerL"));
  const genKwhPerL = numOrNull(formData.get("genKwhPerL"));
  const systemCost = numOrNull(formData.get("systemCost"));
  if ([buyTariff, fuelPricePerL, genKwhPerL, systemCost].includes(undefined)) {
    return { error: "Revisá los valores: tienen que ser números positivos (o vacío)." };
  }
  const currency = String(formData.get("currency") ?? "ARS").trim().toUpperCase().slice(0, 3) || "ARS";

  await ds.getRepository(Plant).update(plantId, {
    buyTariff: buyTariff as number | null,
    fuelPricePerL: fuelPricePerL as number | null,
    genKwhPerL: genKwhPerL as number | null,
    systemCost: systemCost as number | null,
    currency,
  });

  revalidatePath(`/plant/${plantId}/finanzas`);
  revalidatePath(`/plant/${plantId}/generador`);
  return { ok: true };
}
