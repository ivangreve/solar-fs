"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";

type Row = { day: string; kwh: number };

/** Energía del generador por día (se muestra solo si alguna vez se usó). */
export function GenDailyBars({ data }: { data: Row[] }) {
  const option = {
    backgroundColor: "transparent",
    grid: { left: 44, right: 20, top: 20, bottom: 28 },
    tooltip: { trigger: "axis", backgroundColor: "#171717", borderColor: "#333", textStyle: { color: "#e5e5e5" } },
    xAxis: {
      type: "category",
      data: data.map((d) => d.day.slice(5)),
      axisLabel: { color: "#9ca3af" },
      axisLine: { lineStyle: { color: "rgba(128,128,128,0.3)" } },
    },
    yAxis: { type: "value", name: "kWh", nameTextStyle: { color: "#9ca3af" }, axisLabel: { color: "#9ca3af" }, splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } } },
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
