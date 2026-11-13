"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, legendBase, gridBase, xCategory, yValue } from "@/components/charts/chartTheme";
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
    grid: gridBase,
    tooltip: { ...tooltipBox(t), trigger: "axis" },
    legend: legendBase(t),
    xAxis: xCategory(t, data.map((d) => d.day.slice(5))),
    yAxis: yValue(t, { name: "kWh" }),
    series: [
      {
        name: "Generación",
        type: "bar", barMaxWidth: 22,
        itemStyle: { color: ENERGY_COLORS.solar, borderRadius: [3, 3, 0, 0] },
        data: data.map((d) => Math.round(d.ePv * 100) / 100),
      },
      {
        name: "Consumo",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5, cap: "round" },
        itemStyle: { color: ENERGY_COLORS.load },
        data: data.map((d) => Math.round(d.eLoad * 100) / 100),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} notMerge />;
}
