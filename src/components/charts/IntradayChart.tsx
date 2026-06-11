"use client";

import ReactECharts from "echarts-for-react";
import type { PlantSeries } from "@/server/queries";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

/** Relleno de área con gradiente vertical (color sólido arriba → transparente abajo). */
const area = (hex: string) => ({
  type: "linear" as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: hex + "59" },
    { offset: 1, color: hex + "05" },
  ],
});

/** "De dónde salió cada watt" — FV, generador, consumo y SOC a lo largo del día (5-min). */
export function IntradayChart({ data }: { data: PlantSeries["intraday"] }) {
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
      name: "FV", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 2 },
      itemStyle: { color: ENERGY_COLORS.solar }, areaStyle: { color: area(ENERGY_COLORS.solar) },
      data: data.map((d) => d.pv),
    },
    ...(hasGen
      ? [{
          name: "Generador", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 2 },
          itemStyle: { color: ENERGY_COLORS.generator }, areaStyle: { color: area(ENERGY_COLORS.generator) },
          data: data.map((d) => d.gen),
        }]
      : []),
    {
      name: "Consumo", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 2 },
      itemStyle: { color: ENERGY_COLORS.load }, data: data.map((d) => d.load),
    },
    {
      name: "SOC batería", type: "line", yAxisIndex: 1, smooth: true, showSymbol: false,
      itemStyle: { color: ENERGY_COLORS.battery }, lineStyle: { type: "dashed", width: 1.5 },
      data: data.map((d) => d.soc),
    },
  ];

  const option = {
    backgroundColor: "transparent",
    grid: { left: 14, right: 14, top: 36, bottom: 8, containLabel: true },
    tooltip: {
      ...baseTooltip(t),
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: t.crosshair } },
    },
    legend: { textStyle: { color: t.legendText }, top: 2, icon: "roundRect", itemWidth: 12, itemHeight: 6 },
    xAxis: {
      type: "category", boundaryGap: false, data: data.map((d) => d.t),
      axisLabel: { color: t.axisLabel, fontSize: 11 },
      axisLine: { lineStyle: { color: t.axisLine } },
      axisTick: { show: false },
    },
    yAxis: [
      { type: "value", name: "W", nameTextStyle: { color: t.axisName }, axisLabel: { color: t.axisLabel, fontSize: 11 },
        splitLine: { lineStyle: { color: t.splitLine } } },
      { type: "value", name: "SOC %", min: 0, max: 100, nameTextStyle: { color: t.axisName },
        axisLabel: { color: t.axisLabel, fontSize: 11 }, splitLine: { show: false } },
    ],
    series,
  };
  return <ReactECharts option={option} style={{ height: 320 }} notMerge />;
}
