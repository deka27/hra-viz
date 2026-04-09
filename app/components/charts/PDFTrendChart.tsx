"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface MonthlyItem {
  month_year: string;
  downloads: number;
}

export default function PDFTrendChart({ data }: { data: MonthlyItem[] }) {
  const sorted = [...data].sort((a, b) => a.month_year.localeCompare(b.month_year));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${formatMonth(p.name)}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} downloads</div>
        </div>`;
      },
    },
    grid: { top: 24, left: 16, right: 24, bottom: 48, containLabel: true },
    xAxis: {
      type: "category",
      data: sorted.map((d) => d.month_year),
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: string) => formatMonth(v),
        interval: Math.max(0, Math.floor(sorted.length / 12) - 1),
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
      {
        type: "slider",
        start: 0,
        end: 100,
        height: 20,
        bottom: 4,
        borderColor: "#3f3f46",
        fillerColor: "rgba(59,130,246,0.15)",
        handleStyle: { color: "#3b82f6" },
        textStyle: { color: "#71717a", fontSize: 10 },
        dataBackground: {
          lineStyle: { color: "#3f3f46" },
          areaStyle: { color: "#27272a" },
        },
      },
    ],
    series: [
      {
        type: "line",
        data: sorted.map((d) => d.downloads),
        smooth: 0.3,
        symbol: "none",
        lineStyle: { color: "#3b82f6", width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59,130,246,0.25)" },
              { offset: 1, color: "rgba(59,130,246,0.02)" },
            ],
          },
        },
        emphasis: {
          lineStyle: { width: 2.5 },
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "340px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
