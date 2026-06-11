"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

type Row = { day: string; ePv: number; eLoad: number };

/** Generación FV (barras) vs consumo (línea) por día. */
export function EnergyDailyBars({ data }: { data: Row[] }) {
  const t = useChartTheme();
  if (!data.length) {
    return (
      <EmptyState
        height={300}
        title="Sin histórico todavía"
        subtitle="A medida que pasen los días vas a ver acá tu generación y consumo diarios."
      />
    );
  }
  const option = {
    backgroundColor: "transparent",
    grid: { left: 44, right: 20, top: 28, bottom: 28 },
    tooltip: { ...baseTooltip(t), trigger: "axis" },
    legend: { top: 0, textStyle: { color: t.legendText } },
    xAxis: {
      type: "category",
      data: data.map((d) => d.day.slice(5)),
      axisLabel: { color: t.axisLabel },
      axisLine: { lineStyle: { color: t.axisLine } },
    },
    yAxis: { type: "value", name: "kWh", nameTextStyle: { color: t.axisName }, axisLabel: { color: t.axisLabel }, splitLine: { lineStyle: { color: t.splitLine } } },
    series: [
      {
        name: "Generación",
        type: "bar",
        itemStyle: { color: ENERGY_COLORS.solar, borderRadius: [3, 3, 0, 0] },
        data: data.map((d) => Math.round(d.ePv * 100) / 100),
      },
      {
        name: "Consumo",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        itemStyle: { color: ENERGY_COLORS.load },
        data: data.map((d) => Math.round(d.eLoad * 100) / 100),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} notMerge />;
}
