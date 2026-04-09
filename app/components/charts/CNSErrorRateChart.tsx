"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface ErrorRateRow {
  month_year: string;
  total: number;
  errors: number;
  error_rate: number;
}

export default function CNSErrorRateChart({ data }: { data: ErrorRateRow[] }) {
  const months = data.map((d) => formatMonth(d.month_year));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "cross" as const },
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const month = params[0]?.axisValue ?? "";
        const rows = params
          .map((p) => {
            const isRate = p.seriesName === "Error Rate";
            const val = isRate ? `${p.value}%` : Number(p.value).toLocaleString();
            return `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
              <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
                ${p.seriesName}
              </span>
              <span style="font-weight:600;color:#fafafa">${val}</span>
            </div>`;
          })
          .join("");
        return `<div style="padding:4px 2px">
          <div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>
          ${rows}
        </div>`;
      },
    },
    legend: {
      top: 0,
      left: "center",
      itemWidth: 16,
      itemHeight: 4,
      itemGap: 24,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 56, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: months,
      boundaryGap: true,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 10, interval: 5, rotate: 30 },
    },
    yAxis: [
      {
        type: "value" as const,
        name: "Requests",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        ...axisStyle,
        axisLabel: {
          color: "#71717a",
          fontSize: 11,
          formatter: (v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
        },
      },
      {
        type: "value" as const,
        name: "Error Rate %",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        ...axisStyle,
        splitLine: { show: false },
        axisLabel: {
          color: "#71717a",
          fontSize: 11,
          formatter: (v: number) => `${v}%`,
        },
        min: 0,
        max: 60,
      },
    ],
    dataZoom: [
      {
        type: "slider" as const,
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
      { type: "inside" as const },
    ],
    series: [
      {
        name: "Total Requests",
        type: "bar",
        yAxisIndex: 0,
        barWidth: "60%",
        itemStyle: { color: "#3b82f6", opacity: 0.35, borderRadius: [2, 2, 0, 0] },
        data: data.map((d) => d.total),
      },
      {
        name: "Errors",
        type: "bar",
        yAxisIndex: 0,
        barWidth: "60%",
        itemStyle: { color: "#f43f5e", opacity: 0.5, borderRadius: [2, 2, 0, 0] },
        data: data.map((d) => d.errors),
      },
      {
        name: "Error Rate",
        type: "line",
        yAxisIndex: 1,
        smooth: 0.3,
        lineStyle: { width: 2, color: "#f43f5e" },
        itemStyle: { color: "#f43f5e" },
        symbol: "none",
        data: data.map((d) => d.error_rate),
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "350px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
