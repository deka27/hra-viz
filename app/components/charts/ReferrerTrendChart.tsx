"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface TrendRow {
  month_year: string;
  google: number;
  scholar: number;
  bing: number;
  direct: number;
  other: number;
}

const SERIES_CONFIG = [
  { key: "google" as const, name: "Google", color: "#4285f4" },
  { key: "scholar" as const, name: "Google Scholar", color: "#0f9d58" },
  { key: "bing" as const, name: "Bing", color: "#00809d" },
  { key: "direct" as const, name: "Direct", color: "#71717a" },
  { key: "other" as const, name: "Other", color: "#a1a1aa" },
];

export default function ReferrerTrendChart({ data }: { data: TrendRow[] }) {
  const months = data.map((d) => formatMonth(d.month_year));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      formatter: (params: { color: string; seriesName: string; value: number; axisValue: string }[]) => {
        const month = params[0]?.axisValue ?? "";
        const rows = [...params]
          .filter((p) => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
                <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                  <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()}</span>
              </div>`
          )
          .join("");
        return `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>${rows}</div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 16,
      itemHeight: 4,
      borderRadius: 2,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 56, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: months,
      boundaryGap: false,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 10, interval: 5, rotate: 30 },
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) =>
          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
      },
    },
    dataZoom: [
      {
        type: "slider",
        bottom: 0,
        height: 20,
        borderColor: "#3f3f46",
        backgroundColor: "#18181b",
        fillerColor: "rgba(59,130,246,0.12)",
        handleStyle: { color: "#3b82f6", borderColor: "#3b82f6" },
        moveHandleStyle: { color: "#3b82f6" },
        textStyle: { color: "#71717a", fontSize: 9 },
        brushSelect: false,
      },
      { type: "inside" },
    ],
    series: SERIES_CONFIG.map((cfg) => ({
      name: cfg.name,
      type: "line",
      smooth: 0.3,
      lineStyle: { width: 2, color: cfg.color },
      itemStyle: { color: cfg.color },
      symbol: "circle",
      symbolSize: 4,
      showSymbol: false,
      emphasis: { focus: "series", showSymbol: true },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: cfg.color + "28" },
            { offset: 1, color: cfg.color + "00" },
          ],
        },
      },
      data: data.map((d) => d[cfg.key]),
    })),
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "400px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
