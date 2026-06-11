"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

export type BatterySeries = { label: string; points: Array<{ t: string; soc: number | null }> };

/** SOC a lo largo del día, una línea por batería. */
export function BatterySocChart({ series }: { series: BatterySeries[] }) {
  const t = useChartTheme();
  const withData = series.filter((s) => s.points.some((p) => p.soc != null));
  if (!withData.length) {
    return (
      <EmptyState
        height={280}
        title="Todavía no hay datos de carga hoy"
        subtitle="El estado de la batería aparece en cuanto tu equipo reporta."
      />
    );
  }
  // eje x: usar la serie más larga
  const axis = withData.reduce((a, b) => (b.points.length > a.points.length ? b : a)).points.map((p) => p.t);
  const palette = [ENERGY_COLORS.battery, ENERGY_COLORS.grid, ENERGY_COLORS.solar, ENERGY_COLORS.load];

  const option = {
    backgroundColor: "transparent",
    grid: { left: 44, right: 20, top: 28, bottom: 28 },
    tooltip: { ...baseTooltip(t), trigger: "axis" },
    legend: { top: 0, textStyle: { color: t.legendText } },
    xAxis: { type: "category", data: axis, axisLabel: { color: t.axisLabel }, axisLine: { lineStyle: { color: t.axisLine } } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: t.axisLabel, formatter: "{value}%" }, splitLine: { lineStyle: { color: t.splitLine } } },
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
