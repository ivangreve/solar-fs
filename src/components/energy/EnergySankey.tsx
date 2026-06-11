"use client";

import ReactECharts from "echarts-for-react";
import { ENERGY_COLORS } from "@/components/ui/tokens";
import { useChartTheme, baseTooltip } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/ui/EmptyState";

export type DayEnergy = {
  ePv: number;
  eLoad: number;
  eGridIn: number;
  eGridFeed: number;
  eBatChar: number;
  eBatDischar: number;
  eGen: number;
};

/**
 * Sankey del flujo de energía de un día. Los flujos se reconstruyen de los totales
 * diarios con supuestos razonables (no hay medición directa de cada flujo):
 *   FV → Batería  = min(ePv, eBatChar)
 *   FV → Red      = eGridFeed
 *   FV → Consumo  = resto de FV
 *   Batería → Consumo = eBatDischar
 *   Red → Consumo     = eGridIn
 *   Generador → Consumo = eGen
 */
export function EnergySankey({ day }: { day: DayEnergy }) {
  const t = useChartTheme();
  const r = (x: number) => Math.round(x * 1000) / 1000;
  const pvToBat = Math.min(day.ePv, day.eBatChar);
  const pvToGrid = day.eGridFeed;
  const pvToLoad = Math.max(0, day.ePv - pvToBat - pvToGrid);

  const raw = [
    { source: "Solar", target: "Batería", value: pvToBat, color: ENERGY_COLORS.solar },
    { source: "Solar", target: "Consumo", value: pvToLoad, color: ENERGY_COLORS.solar },
    { source: "Solar", target: "Red", value: pvToGrid, color: ENERGY_COLORS.solar },
    { source: "Batería", target: "Consumo", value: day.eBatDischar, color: ENERGY_COLORS.battery },
    { source: "Red", target: "Consumo", value: day.eGridIn, color: ENERGY_COLORS.grid },
    { source: "Generador", target: "Consumo", value: day.eGen, color: ENERGY_COLORS.generator },
  ].filter((l) => l.value > 0.001);

  if (!raw.length) {
    return (
      <EmptyState
        height={320}
        title="Sin energía registrada este día"
        subtitle="Probá con otra fecha o volvé más tarde."
      />
    );
  }

  const usedNodes = new Set<string>();
  raw.forEach((l) => {
    usedNodes.add(l.source);
    usedNodes.add(l.target);
  });
  const NODE_COLOR: Record<string, string> = {
    Solar: ENERGY_COLORS.solar,
    Batería: ENERGY_COLORS.battery,
    Red: ENERGY_COLORS.grid,
    Generador: ENERGY_COLORS.generator,
    Consumo: ENERGY_COLORS.load,
  };
  // Fuentes a la izquierda, consumo a la derecha, batería (intermedia) arriba — así
  // las etiquetas no se pisan con los flujos.
  const LABEL_POS: Record<string, "left" | "right" | "top"> = {
    Solar: "left",
    Generador: "left",
    Red: "left",
    Batería: "top",
    Consumo: "right",
  };
  // Throughput por nodo (mayor entre lo que entra y lo que sale) para mostrar kWh.
  const flowOut: Record<string, number> = {};
  const flowIn: Record<string, number> = {};
  raw.forEach((l) => {
    flowOut[l.source] = (flowOut[l.source] ?? 0) + l.value;
    flowIn[l.target] = (flowIn[l.target] ?? 0) + l.value;
  });
  const nodeValue = (name: string) => Math.max(flowOut[name] ?? 0, flowIn[name] ?? 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      ...baseTooltip(t),
      trigger: "item",
      formatter: (p: { name?: string; value?: number; data?: { source?: string; target?: string } }) =>
        p.data?.source
          ? `${p.data.source} → ${p.data.target}<br/><b>${r(p.value ?? 0)} kWh</b>`
          : `${p.name}<br/><b>${r(p.value ?? 0)} kWh</b>`,
    },
    series: [
      {
        type: "sankey",
        left: 70,
        right: 84,
        top: 12,
        bottom: 12,
        nodeWidth: 16,
        nodeGap: 16,
        draggable: false,
        // Nombre en negrita + kWh debajo, con tokens según tema.
        label: {
          color: t.axisName,
          fontSize: 12,
          formatter: (p: { name?: string; value?: number }) =>
            `{name|${p.name}}\n{val|${r(p.value ?? 0)} kWh}`,
          rich: {
            name: { fontWeight: 700, fontSize: 12, color: t.axisName, lineHeight: 16 },
            val: { fontSize: 11, color: t.axisLabel, lineHeight: 14 },
          },
        },
        lineStyle: { color: "gradient", opacity: 0.5, curveness: 0.5 },
        data: [...usedNodes].map((name) => ({
          name,
          value: r(nodeValue(name)),
          itemStyle: { color: NODE_COLOR[name] ?? "#888" },
          label: { position: LABEL_POS[name] ?? "right" },
        })),
        links: raw.map((l) => ({ source: l.source, target: l.target, value: r(l.value) })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} notMerge />;
}
