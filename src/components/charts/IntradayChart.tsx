"use client";

import ReactECharts from "echarts-for-react";
import type { PlantSeries } from "@/server/queries";
import { ENERGY_COLORS } from "@/components/ui/tokens";

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
  if (!data.length) {
    return <Empty msg="Sin datos intradía todavía. Corré la ingesta o esperá al próximo ciclo." />;
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
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: "rgba(128,128,128,0.4)" } },
      backgroundColor: "rgba(20,20,22,0.92)", borderWidth: 0,
      textStyle: { color: "#e5e5e5", fontSize: 12 },
    },
    legend: { textStyle: { color: "#a3a3a3" }, top: 2, icon: "roundRect", itemWidth: 12, itemHeight: 6 },
    xAxis: {
      type: "category", boundaryGap: false, data: data.map((d) => d.t),
      axisLabel: { color: "#9ca3af", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(128,128,128,0.25)" } },
      axisTick: { show: false },
    },
    yAxis: [
      { type: "value", name: "W", nameTextStyle: { color: "#6b7280" }, axisLabel: { color: "#9ca3af", fontSize: 11 },
        splitLine: { lineStyle: { color: "rgba(128,128,128,0.12)" } } },
      { type: "value", name: "SOC %", min: 0, max: 100, nameTextStyle: { color: "#6b7280" },
        axisLabel: { color: "#9ca3af", fontSize: 11 }, splitLine: { show: false } },
    ],
    series,
  };
  return <ReactECharts option={option} style={{ height: 320 }} notMerge />;
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-xl bg-neutral-900/40 text-sm text-neutral-500">
      {msg}
    </div>
  );
}
