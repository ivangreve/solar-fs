"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

export type MonthlyMoney = { month: string; ahorro: number; costoGen: number; neto: number };

/** Ahorro bruto vs costo del generador, por mes, con línea de ahorro neto. */
export function FinanceMonthlyBars({ data, currency }: { data: MonthlyMoney[]; currency: string }) {
  const th = useChartTheme();
  if (!data.length) {
    return (
      <EmptyState
        height={300}
        title="Sin meses con datos todavía"
        subtitle="A medida que se acumule histórico vas a ver acá tu ahorro mes a mes."
      />
    );
  }

  const option = {
    backgroundColor: "transparent",
    grid: { left: 14, right: 14, top: 36, bottom: 8, containLabel: true },
    tooltip: {
      ...baseTooltip(th),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (v: number) => `${Math.round(v).toLocaleString("es-AR")} ${currency}`,
    },
    legend: { textStyle: { color: th.legendText }, top: 2, icon: "roundRect", itemWidth: 12, itemHeight: 6 },
    xAxis: {
      type: "category",
      data: data.map((d) => d.month),
      axisLabel: { color: th.axisLabel, fontSize: 11 },
      axisLine: { lineStyle: { color: th.axisLine } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: currency,
      nameTextStyle: { color: th.axisName },
      axisLabel: { color: th.axisLabel, fontSize: 11 },
      splitLine: { lineStyle: { color: th.splitLine } },
    },
    series: [
      {
        name: "Ahorro solar",
        type: "bar",
        itemStyle: { color: ENERGY_COLORS.money, borderRadius: [4, 4, 0, 0] },
        data: data.map((d) => Math.round(d.ahorro)),
      },
      {
        name: "Costo generador",
        type: "bar",
        itemStyle: { color: ENERGY_COLORS.generator, borderRadius: [4, 4, 0, 0] },
        data: data.map((d) => Math.round(d.costoGen)),
      },
      {
        name: "Neto",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 },
        itemStyle: { color: ENERGY_COLORS.battery },
        data: data.map((d) => Math.round(d.neto)),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} notMerge />;
}
