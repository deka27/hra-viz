"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS, tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface Row {
  combo_label: string;
  count: number;
  tools: string[];
}

function comboColor(tools: string[]): string {
  // Color by first tool alphabetically (already sorted)
  const first = tools[0];
  return TOOL_COLORS[first] ?? "#52525b";
}

export default function CrossToolSessionsChart({ data }: { data: Row[] }) {
  // Sort highest at top
  const sorted = [...data].sort((a, b) => a.count - b.count);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ name: string; value: number; dataIndex: number }>) => {
        const d = sorted[params[0].dataIndex];
        return `<div style="padding:2px 0">
          <div style="font-weight:700;color:#fafafa;margin-bottom:4px">${d.combo_label}</div>
          <div style="color:#a1a1aa">${d.count.toLocaleString()} users visited all tools in this combo</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 60, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: {
      type: "category",
      data: sorted.map((d) => d.combo_label),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11, width: 180, overflow: "truncate" as const },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 28,
        data: sorted.map((d) => ({
          value: d.count,
          itemStyle: {
            color: comboColor(d.tools),
            opacity: 0.8,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        emphasis: { itemStyle: { opacity: 1 } },
        label: {
          show: true,
          position: "right",
          color: "#a1a1aa",
          fontSize: 11,
          formatter: (p: { value: number }) => p.value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: `${Math.max(240, sorted.length * 36 + 32)}px`, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
