"use client";

import ReactECharts from "echarts-for-react";
import type { PlantSeries } from "@/server/queries";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, legendBase, gridBase, xCategory, yValue, barGradient } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

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
      itemStyle: { color: barGradient(ENERGY_COLORS.solar), borderRadius: hasGen ? 0 : [4, 4, 0, 0] },
      data: data.map((d) => d.ePv),
    },
    ...(hasGen
      ? [{
          name: "Generador", type: "bar", stack: "energía",
          itemStyle: { color: barGradient(ENERGY_COLORS.generator), borderRadius: [4, 4, 0, 0] },
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
    grid: gridBase,
    tooltip: { ...tooltipBox(t), trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: t.splitLine } } },
    legend: legendBase(t),
    xAxis: xCategory(t, data.map((d) => d.day.slice(5))),
    yAxis: [yValue(t, { name: "kWh" }), yValue(t, { name: "%", min: 0, max: 100, split: false })],
    series,
  };
  return <ReactECharts option={option} style={{ height: 300 }} notMerge />;
}
