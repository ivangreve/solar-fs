"use client";

import { useSyncExternalStore } from "react";

/** Tokens de color para ejes/leyenda/tooltip de ECharts según tema. */
export type ChartTheme = {
  axisLabel: string;
  axisName: string;
  axisLine: string;
  splitLine: string;
  legendText: string;
  tooltipBg: string;
  tooltipText: string;
  crosshair: string;
  /** Sombra del tooltip (extraCssText) — despega el tooltip del fondo. */
  tooltipShadow: string;
};

const DARK: ChartTheme = {
  axisLabel: "#9ca3af",
  axisName: "#6b7280",
  axisLine: "rgba(128,128,128,0.25)",
  splitLine: "rgba(128,128,128,0.12)",
  legendText: "#a3a3a3",
  tooltipBg: "rgba(20,20,22,0.92)",
  tooltipText: "#e5e5e5",
  crosshair: "rgba(128,128,128,0.4)",
  tooltipShadow: "box-shadow: 0 4px 16px rgba(0,0,0,0.35)",
};

const LIGHT: ChartTheme = {
  axisLabel: "#52525b",
  axisName: "#71717a",
  axisLine: "rgba(9,9,11,0.2)",
  splitLine: "rgba(9,9,11,0.08)",
  legendText: "#52525b",
  tooltipBg: "rgba(255,255,255,0.97)",
  tooltipText: "#18181b",
  crosshair: "rgba(9,9,11,0.3)",
  tooltipShadow: "box-shadow: 0 4px 16px rgba(0,0,0,0.08)",
};

// Store externo: la clase "light" de <html>. useSyncExternalStore maneja
// SSR/hidratación sin setState en effects (getServerSnapshot → dark, el default).
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isLightNow = () => document.documentElement.classList.contains("light");

/**
 * ¿Está activo el tema claro? Suscripto a la clase "light" de <html> vía
 * MutationObserver; en SSR asume dark (el default).
 */
export function useIsLightTheme(): boolean {
  return useSyncExternalStore(subscribe, isLightNow, () => false);
}

/**
 * Tokens de chart según el tema activo (clase "light" en <html>).
 * Se actualiza en vivo vía MutationObserver; en SSR asume dark (el default).
 */
export function useChartTheme(): ChartTheme {
  return useIsLightTheme() ? LIGHT : DARK;
}

/** Props comunes de tooltip — cada chart agrega trigger/axisPointer/formatter. */
export const baseTooltip = (t: ChartTheme) => ({
  backgroundColor: t.tooltipBg,
  borderWidth: 0,
  textStyle: { color: t.tooltipText, fontSize: 12 },
  extraCssText: t.tooltipShadow,
});

/** Tooltip común con formato más legible (esquinas redondeadas, padding, borde sutil). */
export const tooltipBox = (t: ChartTheme) => ({
  ...baseTooltip(t),
  padding: [8, 12],
  borderWidth: 1,
  borderColor: t.axisLine,
  extraCssText: `${t.tooltipShadow}; border-radius: 10px; backdrop-filter: blur(6px);`,
});

/** Leyenda común (arriba a la izquierda, marcadores redondeados). */
export const legendBase = (t: ChartTheme) => ({
  top: 0,
  left: 0,
  icon: "circle",
  itemWidth: 8,
  itemHeight: 8,
  itemGap: 16,
  textStyle: { color: t.legendText, fontSize: 12 },
});

/** Grid común: deja aire para la leyenda y calcula el ancho de las etiquetas solo. */
export const gridBase = { left: 4, right: 8, top: 58, bottom: 4, containLabel: true } as const;

/** Eje X de categorías con estilo unificado. */
export const xCategory = (t: ChartTheme, data: string[], boundaryGap = true) => ({
  type: "category" as const,
  data,
  boundaryGap,
  axisLabel: { color: t.axisLabel, fontSize: 11, hideOverlap: true },
  axisLine: { lineStyle: { color: t.axisLine } },
  axisTick: { show: false },
});

/** Eje Y de valores con estilo unificado (sin línea de eje, grilla tenue). */
export const yValue = (
  t: ChartTheme,
  opts: { name?: string; min?: number; max?: number; split?: boolean; formatter?: string } = {},
) => ({
  type: "value" as const,
  min: opts.min,
  max: opts.max,
  // La unidad va en las etiquetas (no como título de eje): no choca con la leyenda al partirse en móvil.
  axisLabel: {
    color: t.axisLabel,
    fontSize: 11,
    formatter: opts.formatter ?? (opts.name ? `{value} ${opts.name}` : undefined),
  },
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: opts.split === false ? { show: false } : { lineStyle: { color: t.splitLine, type: "dashed" as const } },
});

/** Gradiente vertical (color sólido arriba → más tenue abajo) para barras. */
export const barGradient = (hex: string) => ({
  type: "linear" as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: hex },
    { offset: 1, color: hex + "66" },
  ],
});

/** Relleno de área (color arriba → transparente abajo). */
export const areaGradient = (hex: string, top = "59") => ({
  type: "linear" as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: hex + top },
    { offset: 1, color: hex + "05" },
  ],
});
