"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, legendBase, gridBase, xCategory, yValue, areaGradient } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

type Point = { t: string; pv: number; load: number; soc: number | null; gen: number };

/** Serie intradía de un dispositivo. Para inversor (pv+load) o batería (soc). */
export function DeviceIntradayChart({ data, mode }: { data: Point[]; mode: "power" | "soc" }) {
  const t = useChartTheme();
  if (!data.length) {
    return (
      <EmptyState
        height={280}
        title="Todavía no hay datos de hoy"
        subtitle="Los datos aparecen en cuanto el equipo reporta."
      />
    );
  }
  const base = {
    backgroundColor: "transparent",
    grid: gridBase,
    tooltip: { ...tooltipBox(t), trigger: "axis" },
    xAxis: xCategory(t, data.map((d) => d.t), false),
  };

  const option =
    mode === "soc"
      ? {
          ...base,
          legend: { show: false },
          yAxis: yValue(t, { min: 0, max: 100, formatter: "{value}%" }),
          series: [
            {
              name: "SOC",
              type: "line",
              smooth: true,
              showSymbol: false,
              areaStyle: { color: areaGradient(ENERGY_COLORS.battery) },
              lineStyle: { width: 2 },
              itemStyle: { color: ENERGY_COLORS.battery },
              data: data.map((d) => d.soc),
            },
          ],
        }
      : {
          ...base,
          legend: legendBase(t),
          yAxis: yValue(t, { name: "W" }),
          series: [
            {
              name: "Generación FV",
              type: "line",
              smooth: true,
              showSymbol: false,
              areaStyle: { color: areaGradient(ENERGY_COLORS.solar) },
              lineStyle: { width: 2 },
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
