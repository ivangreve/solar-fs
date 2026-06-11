"use client";

import ReactECharts from "echarts-for-react";
import type { PlantSeries } from "@/server/queries";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

/** Gradiente vertical para las barras (color arriba → más oscuro/transparente abajo). */
const bar = (hex: string) => ({
  type: "linear" as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: hex },
    { offset: 1, color: hex + "55" },
  ],
});

/** Mix diario: generación FV + generador (apilado) y autoconsumo % de los últimos 30 días. */
export function DailyBars({ data }: { data: PlantSeries["daily"] }) {
  const t = useChartTheme();
  if (!data.length) {
    return (
      <EmptyState
        height={300}
        title="Sin histórico todavía"
        subtitle="A medida que pasen los días vas a ver acá tu generación diaria."
      />
    );
  }
  const hasGen = data.some((d) => d.eGen > 0);

  const series = [
    {
      name: "FV", type: "bar", stack: "energía",
      itemStyle: { color: bar(ENERGY_COLORS.solar), borderRadius: hasGen ? 0 : [4, 4, 0, 0] },
      data: data.map((d) => d.ePv),
    },
    ...(hasGen
      ? [{
          name: "Generador", type: "bar", stack: "energía",
          itemStyle: { color: bar(ENERGY_COLORS.generator), borderRadius: [4, 4, 0, 0] },
          data: data.map((d) => d.eGen),
        }]
      : []),
    {
      name: "Autoconsumo %", type: "line", yAxisIndex: 1, smooth: true, showSymbol: false,
      lineStyle: { width: 2 }, itemStyle: { color: ENERGY_COLORS.battery },
      data: data.map((d) => d.selfCons),
    },
  ];

  const option = {
    backgroundColor: "transparent",
    grid: { left: 14, right: 14, top: 36, bottom: 8, containLabel: true },
    tooltip: { ...baseTooltip(t), trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { textStyle: { color: t.legendText }, top: 2, icon: "roundRect", itemWidth: 12, itemHeight: 6 },
    xAxis: {
      type: "category", data: data.map((d) => d.day.slice(5)),
      axisLabel: { color: t.axisLabel, fontSize: 11 },
      axisLine: { lineStyle: { color: t.axisLine } },
      axisTick: { show: false },
    },
    yAxis: [
      { type: "value", name: "kWh", nameTextStyle: { color: t.axisName }, axisLabel: { color: t.axisLabel, fontSize: 11 },
        splitLine: { lineStyle: { color: t.splitLine } } },
      { type: "value", name: "%", min: 0, max: 100, nameTextStyle: { color: t.axisName },
        axisLabel: { color: t.axisLabel, fontSize: 11 }, splitLine: { show: false } },
    ],
    series,
  };
  return <ReactECharts option={option} style={{ height: 300 }} notMerge />;
}
