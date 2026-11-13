"use client";

import ReactECharts from "echarts-for-react";
import type { PlantSeries } from "@/server/queries";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, legendBase, gridBase, xCategory, yValue, areaGradient } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

/** "De dónde salió cada watt" — FV, generador, consumo y SOC a lo largo del día (5-min). */
export function IntradayChart({ data, live = false }: { data: PlantSeries["intraday"]; live?: boolean }) {
  const t = useChartTheme();
  if (!data.length) {
    return (
      <EmptyState
        height={320}
        title="Todavía no hay datos de hoy"
        subtitle="Los datos llegan cada 5 minutos en cuanto tu equipo reporta."
      />
    );
  }
  const hasGen = data.some((d) => d.gen > 0);

  const series = [
    {
      name: "Paneles", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 2.5, cap: "round" },
      itemStyle: { color: ENERGY_COLORS.solar }, areaStyle: { color: areaGradient(ENERGY_COLORS.solar) },
      data: data.map((d) => d.pv),
      ...(live
        ? {
            markLine: {
              silent: true, symbol: "none",
              lineStyle: { color: t.crosshair, type: [3, 4], width: 1 },
              label: { formatter: "ahora", color: t.legendText, fontSize: 12, position: "insideEndTop" },
              data: [{ xAxis: data[data.length - 1].t }],
            },
          }
        : {}),
    },
    ...(hasGen
      ? [{
          name: "Generador", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 2.5, cap: "round" },
          itemStyle: { color: ENERGY_COLORS.generator }, areaStyle: { color: areaGradient(ENERGY_COLORS.generator, "30") },
          data: data.map((d) => d.gen),
        }]
      : []),
    {
      name: "Consumo", type: "line", smooth: true, showSymbol: false,
      lineStyle: { width: 2.5, cap: "round" }, itemStyle: { color: ENERGY_COLORS.load }, data: data.map((d) => d.load),
    },
    {
      name: "Batería %", type: "line", yAxisIndex: 1, smooth: true, showSymbol: false,
      itemStyle: { color: ENERGY_COLORS.battery }, lineStyle: { width: 2.5, cap: "round" },
      data: data.map((d) => d.soc),
    },
  ];

  const option = {
    backgroundColor: "transparent",
    grid: gridBase,
    tooltip: { ...tooltipBox(t), trigger: "axis", axisPointer: { type: "line", lineStyle: { color: t.crosshair } } },
    legend: legendBase(t),
    xAxis: xCategory(t, data.map((d) => d.t), false),
    yAxis: [yValue(t, { name: "W" }), yValue(t, { name: "%", min: 0, max: 100, split: false })],
    series,
  };
  return <ReactECharts option={option} style={{ height: 320 }} notMerge />;
}
