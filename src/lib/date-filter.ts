import { localToday } from "@/server/time";

export type DateFilterState = {
  /** Día seleccionado (YYYY-MM-DD, validado, nunca futuro). */
  dia: string;
  /** Ventana en días para los gráficos de barras. */
  rango: number;
  esHoy: boolean;
  /** "hoy" o "08/06" — para interpolar en labels y títulos. */
  etiquetaDia: string;
};

export const RANGOS = [7, 30, 90] as const;

/** Parsea y valida ?dia=&rango= de searchParams. Inválido o futuro → defaults (hoy/30). */
export function parseDateFilter(sp: Record<string, string | string[] | undefined>): DateFilterState {
  const today = localToday();
  const rawDia = typeof sp.dia === "string" ? sp.dia : undefined;
  const dia = rawDia && /^\d{4}-\d{2}-\d{2}$/.test(rawDia) && rawDia <= today ? rawDia : today;
  const rawRango = typeof sp.rango === "string" ? Number(sp.rango) : 30;
  const rango = (RANGOS as readonly number[]).includes(rawRango) ? rawRango : 30;
  const esHoy = dia === today;
  return {
    dia,
    rango,
    esHoy,
    etiquetaDia: esHoy ? "hoy" : `${dia.slice(8, 10)}/${dia.slice(5, 7)}`,
  };
}
