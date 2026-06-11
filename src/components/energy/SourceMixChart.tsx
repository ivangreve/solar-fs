"use client";

import ReactECharts from "echarts-for-react";
import type { PlantSeries } from "@/server/queries";
import { ENERGY_COLORS } from "@/components/ui/tokens";

/**
 * "De dónde salió cada watt" — descomposición instantánea del consumo por fuente.
 *
 * A partir de la serie intradía (pv, load) reconstruimos, en cada muestra, qué parte
 * del consumo vino del sol directo y qué parte de la batería. Como el sistema es
 * off-grid, asumimos que la red no aporta (el residual de red queda en cero salvo
 * que aparezcan datos que lo contradigan en el futuro).
 *
 * Reglas por muestra:
 *   - FV directo  = min(pv, load)           → sol que se consume al instante
 *   - Batería     = max(0, load - pv)       → déficit cubierto por descarga
 *   - Excedente   = max(0, pv - load)       → sol sobrante (va a cargar batería)
 *
 * Las áreas FV directo + Batería se apilan y suman exactamente al consumo, así que
 * la línea de consumo queda como el techo del relleno. El excedente se dibuja como
 * un área tenue por encima para no perder de vista cuánto sol sobró.
 */
export function SourceMixChart({ data }: { data: PlantSeries["intraday"] }) {
  if (!data.length) {
    return <Empty msg="Todavía no entró telemetría de hoy. Aparece en cuanto corra el próximo ciclo." />;
  }

  const t = data.map((d) => d.t);
  const fvDirect = data.map((d) => Math.max(0, Math.min(d.pv, d.load)));
  const battery = data.map((d) => Math.max(0, d.load - d.pv));
  const surplus = data.map((d) => Math.max(0, d.pv - d.load));
  const load = data.map((d) => d.load);

  const option = {
    backgroundColor: "transparent",
    grid: { left: 52, right: 24, top: 36, bottom: 28 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#171717",
      borderColor: "rgba(128,128,128,0.3)",
      textStyle: { color: "#e5e5e5" },
      valueFormatter: (v: number) => (v == null ? "—" : `${Math.round(v)} W`),
    },
    legend: {
      textStyle: { color: "#a3a3a3" },
      top: 4,
      itemWidth: 10,
      itemHeight: 10,
      icon: "roundRect",
    },
    xAxis: {
      type: "category",
      data: t,
      boundaryGap: false,
      axisLabel: { color: "#9ca3af", interval: Math.ceil(t.length / 8) },
      axisLine: { lineStyle: { color: "rgba(128,128,128,0.3)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "W",
      nameTextStyle: { color: "#9ca3af", align: "right" },
      axisLabel: { color: "#9ca3af" },
      splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } },
    },
    series: [
      {
        name: "FV directo",
        type: "line",
        stack: "consumo",
        showSymbol: false,
        lineStyle: { width: 0 },
        areaStyle: { color: ENERGY_COLORS.solar, opacity: 0.55 },
        itemStyle: { color: ENERGY_COLORS.solar },
        data: fvDirect,
      },
      {
        name: "Batería",
        type: "line",
        stack: "consumo",
        showSymbol: false,
        lineStyle: { width: 0 },
        areaStyle: { color: ENERGY_COLORS.battery, opacity: 0.5 },
        itemStyle: { color: ENERGY_COLORS.battery },
        data: battery,
      },
      {
        name: "Consumo",
        type: "line",
        showSymbol: false,
        smooth: false,
        lineStyle: { color: ENERGY_COLORS.load, width: 1.5 },
        itemStyle: { color: ENERGY_COLORS.load },
        z: 3,
        data: load,
      },
      {
        name: "Excedente FV",
        type: "line",
        showSymbol: false,
        lineStyle: { color: ENERGY_COLORS.solar, width: 1, type: "dashed", opacity: 0.6 },
        itemStyle: { color: ENERGY_COLORS.solar },
        areaStyle: { color: ENERGY_COLORS.solar, opacity: 0.08 },
        data: surplus,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 340 }} notMerge />;
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed border-white/10 px-8 text-center text-sm text-[var(--text-faint)]">
      {msg}
    </div>
  );
}
