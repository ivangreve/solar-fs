"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";

type Point = { t: string; pv: number; load: number; soc: number | null; gen: number };

/** Serie intradía de un dispositivo. Para inversor (pv+load) o batería (soc). */
export function DeviceIntradayChart({ data, mode }: { data: Point[]; mode: "power" | "soc" }) {
  if (!data.length) {
    return <div className="flex h-64 items-center justify-center text-sm text-neutral-500">Sin datos de hoy.</div>;
  }
  const axisLine = { lineStyle: { color: "rgba(128,128,128,0.3)" } };
  const splitLine = { lineStyle: { color: "rgba(128,128,128,0.15)" } };
  const base = {
    backgroundColor: "transparent",
    grid: { left: 48, right: 24, top: 24, bottom: 28 },
    tooltip: { trigger: "axis", backgroundColor: "#171717", borderColor: "#333", textStyle: { color: "#e5e5e5" } },
    xAxis: { type: "category", data: data.map((d) => d.t), axisLabel: { color: "#9ca3af" }, axisLine },
  };

  const option =
    mode === "soc"
      ? {
          ...base,
          legend: { show: false },
          yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: "#9ca3af", formatter: "{value}%" }, splitLine },
          series: [
            {
              name: "SOC",
              type: "line",
              smooth: true,
              showSymbol: false,
              areaStyle: { opacity: 0.15 },
              itemStyle: { color: ENERGY_COLORS.battery },
              data: data.map((d) => d.soc),
            },
          ],
        }
      : {
          ...base,
          legend: { top: 0, textStyle: { color: "#a3a3a3" } },
          yAxis: { type: "value", name: "W", nameTextStyle: { color: "#9ca3af" }, axisLabel: { color: "#9ca3af" }, splitLine },
          series: [
            {
              name: "Generación FV",
              type: "line",
              smooth: true,
              showSymbol: false,
              areaStyle: { opacity: 0.2 },
              itemStyle: { color: ENERGY_COLORS.solar },
              data: data.map((d) => d.pv),
            },
            {
              name: "Consumo",
              type: "line",
              smooth: true,
              showSymbol: false,
              itemStyle: { color: ENERGY_COLORS.load },
              data: data.map((d) => d.load),
            },
          ],
        };

  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}
