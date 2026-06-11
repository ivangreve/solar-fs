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
