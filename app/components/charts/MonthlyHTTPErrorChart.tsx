"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface ErrorRow {
  month_year: string;
  s404: number;
  s500: number;
  s403: number;
  total_errors: number;
}

const SERIES_CONFIG = [
  { key: "s404" as const, name: "404 Not Found", color: "#f59e0b" },
  { key: "s500" as const, name: "500 Server Error", color: "#f43f5e" },
  { key: "s403" as const, name: "403 Forbidden", color: "#8b5cf6" },
];

export default function MonthlyHTTPErrorChart({ data }: { data: ErrorRow[] }) {
  const months = data.map((d) => formatMonth(d.month_year));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
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
        const total = params.reduce((s, p) => s + (p.value ?? 0), 0);
        return `<div style="padding:4px 2px">
          <div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>
          ${rows}
          <div style="border-top:1px solid #3f3f46;margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;color:#71717a;font-size:12px">
            <span>Total</span>
            <span style="font-weight:600;color:#fafafa">${total.toLocaleString()}</span>
          </div>
        </div>`;
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
      stack: "errors",
      areaStyle: { opacity: 0.4 },
      smooth: 0.3,
      lineStyle: { width: 1.5, color: cfg.color },
      itemStyle: { color: cfg.color },
      symbol: "none",
      emphasis: { focus: "series" },
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
