"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface DowRow {
  dow_num: number;
  day_name: string;
  visits: number;
}

const DAY_COLORS: Record<string, string> = {
  Sunday: "#6366f1",
  Monday: "#3b82f6",
  Tuesday: "#3b82f6",
  Wednesday: "#3b82f6",
  Thursday: "#3b82f6",
  Friday: "#3b82f6",
  Saturday: "#6366f1",
};

export default function CNSDowChart({ data }: { data: DowRow[] }) {
  const total = data.reduce((s, d) => s + d.visits, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        const pct = ((p.value / total) * 100).toFixed(1);
        return `<div style="font-weight:500;color:#fafafa">${p.name}</div><div style="color:#a1a1aa">${p.value.toLocaleString()} visits (${pct}%)</div>`;
      },
    },
    grid: { top: 16, left: 8, right: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => d.day_name.slice(0, 3)),
      ...axisStyle,
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
      },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 48,
        data: data.map((d) => ({
          value: d.visits,
          itemStyle: {
            color: DAY_COLORS[d.day_name] ?? "#3b82f6",
            opacity: d.day_name === "Sunday" || d.day_name === "Saturday" ? 0.5 : 0.85,
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top" as const,
          color: "#71717a",
          fontSize: 10,
          formatter: (p: { value: number }) => `${(p.value / 1_000_000).toFixed(1)}M`,
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "220px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
