"use client";

import ThemedEChart from "../ThemedEChart";
import { axisStyle, tooltipStyle } from "../../lib/chartTheme";


export interface ChurnBucket {
  probability_bucket: string;
  sessions: number;
  observed_return_rate: number;
}

function cleanBucketLabel(raw: string): string {
  const m = raw.match(/[\(\[]-?[\d.]+,\s*([\d.]+)\]/);
  if (!m) return raw;
  const upper = parseFloat(m[1]);
  const lower = Math.round(Math.max(0, upper - 0.1) * 100);
  return `${lower}–${Math.round(upper * 100)}%`;
}

export default function MLChurnBucketsChart({ data }: { data: ChurnBucket[] }) {
  const labels = data.map((d) => cleanBucketLabel(d.probability_bucket));
  const sessionValues = data.map((d) => d.sessions);
  const returnValues = data.map((d) => Number((d.observed_return_rate * 100).toFixed(1)));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ seriesName: string; value: number; axisValue: string }>) => {
        const rows = params
          .map((p) => `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0"><span style="color:#a1a1aa">${p.seriesName}</span><span style="color:#fafafa;font-weight:600">${p.value.toLocaleString()}${p.seriesName.includes("Rate") ? "%" : ""}</span></div>`)
          .join("");
        return `<div><div style="color:#fafafa;font-weight:600;margin-bottom:4px">Predicted return probability: ${params[0]?.axisValue ?? ""}</div>${rows}</div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
    },
    grid: { top: 34, left: 8, right: 8, bottom: 56, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 10, rotate: 25 },
    },
    yAxis: [
      {
        type: "value",
        ...axisStyle,
        axisLabel: { color: "#71717a", fontSize: 11, formatter: (v: number) => `${v}` },
      },
      {
        type: "value",
        ...axisStyle,
        axisLabel: { color: "#71717a", fontSize: 11, formatter: (v: number) => `${v}%` },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Sessions",
        type: "bar",
        data: sessionValues,
        barMaxWidth: 24,
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0], opacity: 0.85 },
      },
      {
        name: "Observed Return Rate",
        type: "line",
        yAxisIndex: 1,
        data: returnValues,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { color: "#f59e0b", width: 2.5 },
        itemStyle: { color: "#f59e0b" },
      },
    ],
  };

  return <ThemedEChart option={option} style={{ height: "320px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}

function pms(value: string): string {
  return value.replace(" - ", " to ");
}
