"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle } from "../../lib/chartTheme";

interface StatusRow {
  status: number;
  count: number;
}

const STATUS_COLORS: Record<number, string> = {
  200: "#10b981",
  304: "#3b82f6",
  404: "#f59e0b",
  500: "#f43f5e",
  403: "#8b5cf6",
};

const STATUS_LABELS: Record<number, string> = {
  200: "200 OK",
  304: "304 Not Modified",
  404: "404 Not Found",
  500: "500 Server Error",
  403: "403 Forbidden",
  421: "421 Misdirected",
  206: "206 Partial",
  400: "400 Bad Request",
  301: "301 Redirect",
  408: "408 Timeout",
};

export default function HTTPStatusChart({ data }: { data: StatusRow[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  // Group small statuses into "Other"
  const threshold = total * 0.01;
  const mainItems: { name: string; value: number; color: string }[] = [];
  let otherTotal = 0;

  for (const d of data) {
    if (d.count >= threshold) {
      mainItems.push({
        name: STATUS_LABELS[d.status] ?? `${d.status}`,
        value: d.count,
        color: STATUS_COLORS[d.status] ?? "#71717a",
      });
    } else {
      otherTotal += d.count;
    }
  }

  if (otherTotal > 0) {
    mainItems.push({ name: "Other", value: otherTotal, color: "#71717a" });
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      ...tooltipStyle,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${p.value.toLocaleString()} requests</div>
          <div style="color:#71717a">${p.percent.toFixed(1)}%</div>
        </div>`,
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "middle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
      formatter: (name: string) => {
        const item = mainItems.find((d) => d.name === name);
        const pct = item ? ((item.value / total) * 100).toFixed(1) : "0";
        return `${name}  ${pct}%`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "75%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false }, scaleSize: 5 },
        data: mainItems.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color, borderWidth: 0 },
        })),
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "320px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
