"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, tooltipBox, legendBase, gridBase, xCategory, yValue } from "@/components/charts/chartTheme";
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
    grid: gridBase,
    tooltip: {
      ...tooltipBox(th),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (v: number) => `${Math.round(v).toLocaleString("es-AR")} ${currency}`,
    },
    legend: legendBase(th),
    xAxis: xCategory(th, data.map((d) => d.month)),
    yAxis: yValue(th, { name: currency }),
    series: [
      {
        name: "Ahorro solar",
        type: "bar", barMaxWidth: 22,
        itemStyle: { color: ENERGY_COLORS.money, borderRadius: [4, 4, 0, 0] },
        data: data.map((d) => Math.round(d.ahorro)),
      },
      {
        name: "Costo generador",
        type: "bar", barMaxWidth: 22,
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
