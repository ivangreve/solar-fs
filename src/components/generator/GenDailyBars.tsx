"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";

type Row = { day: string; kwh: number };

/** Energía del generador por día (se muestra solo si alguna vez se usó). */
export function GenDailyBars({ data }: { data: Row[] }) {
  const t = useChartTheme();
  const option = {
    backgroundColor: "transparent",
    grid: { left: 44, right: 20, top: 20, bottom: 28 },
    tooltip: { ...baseTooltip(t), trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((d) => d.day.slice(5)),
      axisLabel: { color: t.axisLabel },
      axisLine: { lineStyle: { color: t.axisLine } },
    },
    yAxis: { type: "value", name: "kWh", nameTextStyle: { color: t.axisName }, axisLabel: { color: t.axisLabel }, splitLine: { lineStyle: { color: t.splitLine } } },
    series: [
      {
        name: "Generador",
        type: "bar",
        itemStyle: { color: ENERGY_COLORS.generator, borderRadius: [3, 3, 0, 0] },
        data: data.map((d) => Math.round(d.kwh * 100) / 100),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 260 }} notMerge />;
}
