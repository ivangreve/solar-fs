"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
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
  const axisLine = { lineStyle: { color: t.axisLine } };
  const splitLine = { lineStyle: { color: t.splitLine } };
  const base = {
    backgroundColor: "transparent",
    grid: { left: 48, right: 24, top: 24, bottom: 28 },
    tooltip: { ...baseTooltip(t), trigger: "axis" },
    xAxis: { type: "category", data: data.map((d) => d.t), axisLabel: { color: t.axisLabel }, axisLine },
  };

  const option =
    mode === "soc"
      ? {
          ...base,
          legend: { show: false },
          yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: t.axisLabel, formatter: "{value}%" }, splitLine },
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
          legend: { top: 0, textStyle: { color: t.legendText } },
          yAxis: { type: "value", name: "W", nameTextStyle: { color: t.axisName }, axisLabel: { color: t.axisLabel }, splitLine },
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
