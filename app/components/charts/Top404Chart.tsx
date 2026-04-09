"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface PathRow {
  path: string;
  count: number;
}

interface Props {
  data: PathRow[];
  color?: string;
  label?: string;
}

function truncatePath(path: string, max = 40): string {
  if (path.length <= max) return path;
  return path.slice(0, max - 3) + "...";
}

export default function Top404Chart({ data, color = "#f59e0b", label = "hits" }: Props) {
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
        const fullPath = sorted[p.dataIndex]?.path ?? p.name;
        const pct = ((p.value / total) * 100).toFixed(1);
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px;word-break:break-all;max-width:400px">${fullPath}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} ${label}</div>
          <div style="color:#71717a;font-size:12px">${pct}% of total</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 16, right: 80, bottom: 8, containLabel: true },
    xAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
      },
    },
    yAxis: {
      type: "category" as const,
      data: sorted.map((d) => truncatePath(d.path)),
      ...axisStyle,
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 11,
        fontFamily: "monospace",
        width: 240,
        overflow: "truncate" as const,
      },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.count,
          itemStyle: { color, borderRadius: [0, 6, 6, 0] },
        })),
        barMaxWidth: 28,
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
      style={{ height: `${Math.max(300, sorted.length * 28)}px`, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
