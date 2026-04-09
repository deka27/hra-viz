"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle } from "../../lib/chartTheme";

interface HourRow {
  hour: number;
  count: number;
}

function toLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

export default function CNSHourlyChart({ data }: { data: HourRow[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const peakHour = data.reduce((mx, d) => (d.count > mx.count ? d : mx), data[0]);
  const isPeak = (h: number) => h >= 13 && h <= 21; // 8am–4pm EST in UTC

  const option = {
    backgroundColor: "transparent",
    grid: { top: 24, left: 8, right: 16, bottom: 24, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: "#3f3f46" } },
      ...tooltipStyle,
      formatter: (params: { dataIndex: number; value: number }[]) => {
        const i = params[0].dataIndex;
        const d = data[i];
        const pct = ((d.count / total) * 100).toFixed(1);
        return `<div><span style="color:#a1a1aa">${toLabel(d.hour)} UTC</span><br/><strong style="color:#fafafa">${d.count.toLocaleString()}</strong> <span style="color:#71717a">(${pct}%)</span></div>`;
      },
    },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => toLabel(d.hour)),
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#71717a", fontSize: 10, interval: 2 },
    },
    yAxis: {
      type: "value" as const,
      show: false,
    },
    series: [
      {
        type: "bar",
        barWidth: "70%",
        data: data.map((d) => ({
          value: d.count,
          itemStyle: {
            color: isPeak(d.hour) ? "#3b82f6" : "#27272a",
            opacity: isPeak(d.hour) ? 0.85 : 0.5,
            borderRadius: [2, 2, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top" as const,
          fontSize: 9,
          color: "#a1a1aa",
          formatter: (p: { value: number }) =>
            p.value === peakHour.count ? `${(p.value / 1000).toFixed(0)}k` : "",
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "200px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
