"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, legendBase, gridBase, xCategory, yValue } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

type Row = { day: string; eBatChar: number; eBatDischar: number };

/** Carga vs descarga de la batería por día. */
export function ChargeDischargeBars({ data }: { data: Row[] }) {
  const t = useChartTheme();
  if (!data.length) {
    return (
      <EmptyState
        height={280}
        title="Sin histórico todavía"
        subtitle="A medida que pasen los días vas a ver acá la carga y descarga de tu batería."
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
        name: "Carga",
        type: "bar", barMaxWidth: 22,
        stack: "b",
        itemStyle: { color: ENERGY_COLORS.battery, borderRadius: [3, 3, 0, 0] },
        data: data.map((d) => Math.round(d.eBatChar * 100) / 100),
      },
      {
        name: "Descarga",
        type: "bar", barMaxWidth: 22,
        stack: "b",
        itemStyle: { color: ENERGY_COLORS.load },
        data: data.map((d) => -Math.round(d.eBatDischar * 100) / 100),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}
