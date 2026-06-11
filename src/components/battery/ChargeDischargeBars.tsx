"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";

type Row = { day: string; eBatChar: number; eBatDischar: number };

/** Carga vs descarga de la batería por día. */
export function ChargeDischargeBars({ data }: { data: Row[] }) {
  if (!data.length) {
    return <div className="flex h-64 items-center justify-center text-sm text-neutral-500">Sin histórico todavía.</div>;
  }
  const option = {
    backgroundColor: "transparent",
    grid: { left: 44, right: 20, top: 28, bottom: 28 },
    tooltip: { trigger: "axis", backgroundColor: "#171717", borderColor: "#333", textStyle: { color: "#e5e5e5" } },
    legend: { top: 0, textStyle: { color: "#a3a3a3" } },
    xAxis: {
      type: "category",
      data: data.map((d) => d.day.slice(5)),
      axisLabel: { color: "#9ca3af" },
      axisLine: { lineStyle: { color: "rgba(128,128,128,0.3)" } },
    },
    yAxis: { type: "value", name: "kWh", nameTextStyle: { color: "#9ca3af" }, axisLabel: { color: "#9ca3af" }, splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } } },
    series: [
      {
        name: "Carga",
        type: "bar",
        stack: "b",
        itemStyle: { color: ENERGY_COLORS.battery, borderRadius: [3, 3, 0, 0] },
        data: data.map((d) => Math.round(d.eBatChar * 100) / 100),
      },
      {
        name: "Descarga",
        type: "bar",
        stack: "b",
        itemStyle: { color: ENERGY_COLORS.load },
        data: data.map((d) => -Math.round(d.eBatDischar * 100) / 100),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}
