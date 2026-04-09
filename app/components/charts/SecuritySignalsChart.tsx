"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface SignalRow {
  signal_type: string;
  count: number;
}

const SIGNAL_COLORS: Record<string, string> = {
  "Log4Shell (JNDI injection)": "#f43f5e",
  "WordPress brute force": "#f59e0b",
  "SQL injection": "#8b5cf6",
  "XSS attempt": "#ec4899",
  "Path traversal": "#06b6d4",
  "Admin panel probe": "#71717a",
  "Config/debug probe": "#a78bfa",
};

export default function SecuritySignalsChart({ data }: { data: SignalRow[] }) {
  const sorted = [...data].sort((a, b) => a.count - b.count);
  const total = sorted.reduce((s, d) => s + d.count, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        const pct = ((p.value / total) * 100).toFixed(1);
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} attempts</div>
          <div style="color:#71717a;font-size:12px">${pct}% of all signals</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 16, right: 90, bottom: 8, containLabel: true },
    xAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) =>
          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
      },
    },
    yAxis: {
      type: "category" as const,
      data: sorted.map((d) => d.signal_type),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 12, fontWeight: 500 },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.count,
          itemStyle: {
            color: SIGNAL_COLORS[d.signal_type] ?? "#71717a",
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barMaxWidth: 32,
        label: {
          show: true,
          position: "right",
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
      style={{ height: `${Math.max(280, sorted.length * 40)}px`, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
