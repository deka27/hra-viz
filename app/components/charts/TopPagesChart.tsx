"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle } from "../../lib/chartTheme";

interface PageRow {
  page: string;
  visits: number;
}

const BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#ec4899", "#f472b6",
  "#f59e0b", "#fbbf24", "#3b82f6", "#60a5fa", "#10b981",
];

export default function TopPagesChart({ data, count = 10 }: { data: PageRow[]; count?: number }) {
  const top = data.slice(0, count);
  const sorted = [...top].reverse();

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `<div style="font-weight:500;color:#fafafa;word-break:break-all">${p.name}</div><div style="color:#a1a1aa">${p.value.toLocaleString()} visits</div>`;
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
      type: "value" as const,
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) =>
          v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
      },
      splitLine: { lineStyle: { color: "#27272a" } },
    },
    yAxis: {
      type: "category" as const,
      data: sorted.map((d) => {
        const label = d.page.length > 30 ? d.page.slice(0, 27) + "..." : d.page;
        return label;
      }),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: 500 as const },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d, i) => ({
          value: d.visits,
          itemStyle: {
            color: BAR_COLORS[i % BAR_COLORS.length],
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barMaxWidth: 32,
        label: {
          show: true,
          position: "right" as const,
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: `${Math.max(sorted.length * 36, 200)}px`, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
