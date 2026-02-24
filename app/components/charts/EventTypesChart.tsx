"use client";

import dynamic from "next/dynamic";
import { axisStyle, tooltipStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface EventType {
  event: string;
  count: number;
}

const EVENT_COLORS: Record<string, string> = {
  click: "#3b82f6",
  error: "#ef4444",
  hover: "#8b5cf6",
  pageView: "#10b981",
  keyboard: "#f59e0b",
  modelChange: "#06b6d4",
};

const EVENT_LABELS: Record<string, string> = {
  click: "Click",
  error: "Error",
  hover: "Hover",
  pageView: "Page View",
  keyboard: "Keyboard",
  modelChange: "Model Change",
};

export default function EventTypesChart({ data }: { data: EventType[] }) {
  const sorted = [...data].sort((a, b) => a.count - b.count);
  const total = data.reduce((s, d) => s + d.count, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        const pct = ((p.value / total) * 100).toFixed(1);
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} interactions</div>
          <div style="color:#71717a;font-size:12px">${pct}% of total</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 16, right: 80, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
    },
    yAxis: {
      type: "category",
      data: sorted.map((d) => EVENT_LABELS[d.event] ?? d.event),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 13, fontWeight: 500 },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.count,
          itemStyle: {
            color: EVENT_COLORS[d.event] ?? "#3b82f6",
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barMaxWidth: 36,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 12,
          formatter: ({ value }: { value: number }) => {
            const pct = ((value / total) * 100).toFixed(1);
            return `${value.toLocaleString()}  (${pct}%)`;
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
