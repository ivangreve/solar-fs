"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";

export type BatterySeries = { label: string; points: Array<{ t: string; soc: number | null }> };

/** SOC a lo largo del día, una línea por batería. */
export function BatterySocChart({ series }: { series: BatterySeries[] }) {
  const withData = series.filter((s) => s.points.some((p) => p.soc != null));
  if (!withData.length) {
    return <div className="flex h-64 items-center justify-center text-sm text-[var(--text-faint)]">Sin datos de SOC de hoy.</div>;
  }
  // eje x: usar la serie más larga
  const axis = withData.reduce((a, b) => (b.points.length > a.points.length ? b : a)).points.map((p) => p.t);
  const palette = [ENERGY_COLORS.battery, ENERGY_COLORS.grid, ENERGY_COLORS.solar, ENERGY_COLORS.load];

  const option = {
    backgroundColor: "transparent",
    grid: { left: 44, right: 20, top: 28, bottom: 28 },
    tooltip: { trigger: "axis", backgroundColor: "#171717", borderColor: "#333", textStyle: { color: "#e5e5e5" } },
    legend: { top: 0, textStyle: { color: "#a3a3a3" } },
    xAxis: { type: "category", data: axis, axisLabel: { color: "#9ca3af" }, axisLine: { lineStyle: { color: "rgba(128,128,128,0.3)" } } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: "#9ca3af", formatter: "{value}%" }, splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } } },
    series: withData.map((s, i) => ({
      name: s.label,
      type: "line",
      smooth: true,
      showSymbol: false,
      itemStyle: { color: palette[i % palette.length] },
      data: s.points.map((p) => p.soc),
    })),
  };
  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}
