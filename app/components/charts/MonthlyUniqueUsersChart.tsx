"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface Row {
  month_year: string;
  unique_sessions: number;
}

export default function MonthlyUniqueUsersChart({ data }: { data: Row[] }) {
  const months = data.map((d) => d.month_year);
  const values = data.map((d) => d.unique_sessions);

  const option = {
    backgroundColor: "transparent",
    grid: { top: 40, left: 8, right: 16, bottom: 60, containLabel: true },
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="padding:4px 2px">
          <div style="font-weight:600;color:#fafafa;margin-bottom:6px;font-size:13px">${formatMonth(p.axisValue)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;display:inline-block"></span>
            <span style="color:#a1a1aa">Unique Sessions</span>
            <span style="font-weight:600;color:#fafafa;margin-left:auto">${Number(p.value).toLocaleString()}</span>
          </div>
        </div>`;
      },
    },
    xAxis: {
      type: "category",
      data: months,
      ...axisStyle,
      axisLabel: {
        ...axisStyle.axisLabel,
        formatter: (v: string) => formatMonth(v),
      },
    },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        ...axisStyle.axisLabel,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()),
      },
    },
    dataZoom: [
      {
        type: "slider",
        height: 20,
        bottom: 4,
        borderColor: "#3f3f46",
        backgroundColor: "#18181b",
        fillerColor: "rgba(59,130,246,0.15)",
        handleStyle: { color: "#3b82f6" },
        textStyle: { color: "#71717a" },
      },
    ],
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#3b82f6", width: 2 },
        itemStyle: { color: "#3b82f6" },
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
