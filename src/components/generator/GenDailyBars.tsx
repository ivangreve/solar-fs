"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, gridBase, xCategory, yValue } from "@/components/charts/chartTheme";

type Row = { day: string; kwh: number };

/** Energía del generador por día (se muestra solo si alguna vez se usó). */
export function GenDailyBars({ data }: { data: Row[] }) {
  const t = useChartTheme();
  const option = {
    backgroundColor: "transparent",
    grid: gridBase,
    tooltip: { ...tooltipBox(t), trigger: "axis" },
    xAxis: xCategory(t, data.map((d) => d.day.slice(5))),
    yAxis: yValue(t, { name: "kWh" }),
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
