"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS } from "../../lib/chartTheme";


interface ToolVisit {
  tool: string;
  visits: number;
}

export default function ToolVisitsChart({ data }: { data: ToolVisit[] }) {
  const sorted = [...data].sort((a, b) => a.visits - b.visits);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 13 },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `<div style="font-weight:500">${p.name}</div><div style="color:#a1a1aa">${p.value.toLocaleString()} visits</div>`;
      },
    },
    grid: {
      left: 16,
      right: 64,
      top: 8,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
      splitLine: { lineStyle: { color: "#27272a" } },
    },
    yAxis: {
      type: "category",
      data: sorted.map((d) => d.tool),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 13, fontWeight: 500 },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.visits,
          itemStyle: {
            color: TOOL_COLORS[d.tool] ?? "#3b82f6",
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barMaxWidth: 40,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 12,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
