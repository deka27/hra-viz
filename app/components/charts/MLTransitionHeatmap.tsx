"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export interface TransitionRow {
  from_tool: string;
  to_tool: string;
  count: number;
  probability: number;
}

const TOOL_ORDER = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"];

export default function MLTransitionHeatmap({ data }: { data: TransitionRow[] }) {
  const tools = TOOL_ORDER.filter((tool) => data.some((d) => d.from_tool === tool || d.to_tool === tool));
  const indexMap = new Map(tools.map((tool, idx) => [tool, idx]));
  const matrix: [number, number, number][] = [];

  for (const from of tools) {
    for (const to of tools) {
      const row = data.find((d) => d.from_tool === from && d.to_tool === to);
      matrix.push([indexMap.get(to) ?? 0, indexMap.get(from) ?? 0, row?.probability ?? 0]);
    }
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      formatter: (p: { data: [number, number, number] }) => {
        const to = tools[p.data[0]];
        const from = tools[p.data[1]];
        const prob = p.data[2];
        const match = data.find((d) => d.from_tool === from && d.to_tool === to);
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${from} → ${to}</div>
          <div style="color:#a1a1aa">After people use <strong>${from}</strong>, about <strong>${(prob * 100).toFixed(1)}%</strong> next move to <strong>${to}</strong>.</div>
          <div style="color:#71717a;font-size:11px">Observed transitions: ${(match?.count ?? 0).toLocaleString()}</div>
        </div>`;
      },
    },
    grid: { top: 24, left: 56, right: 8, bottom: 44, containLabel: true },
    xAxis: {
      type: "category",
      name: "Next tool",
      nameTextStyle: { color: "#71717a", fontSize: 11, padding: [12, 0, 0, 0] },
      data: tools,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: "bold" as const, interval: 0, rotate: 20 },
      splitArea: { show: true, areaStyle: { color: ["#18181b", "#1c1c1f"] } },
    },
    yAxis: {
      type: "category",
      name: "Current tool",
      nameTextStyle: { color: "#71717a", fontSize: 11, padding: [0, 0, 8, 0] },
      data: tools,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: "bold" as const },
      splitArea: { show: true, areaStyle: { color: ["#18181b", "#1c1c1f"] } },
    },
    visualMap: {
      min: 0,
      max: Math.max(...matrix.map((d) => d[2]), 0.01),
      show: false,
      inRange: { color: ["#1f2937", "#334155", "#1d4ed8", "#22c55e"] },
    },
    series: [
      {
        type: "heatmap",
        data: matrix,
        label: {
          show: true,
          formatter: (p: { data: [number, number, number] }) => (p.data[2] < 0.01 ? "–" : `${(p.data[2] * 100).toFixed(0)}%`),
          color: "#fafafa",
          fontSize: 11,
          fontWeight: "bold" as const,
        },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(34,197,94,0.4)" } },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "320px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}
