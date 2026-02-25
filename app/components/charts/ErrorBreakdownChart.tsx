"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS } from "../../lib/chartTheme";
import errorBreakdown from "../../../public/data/error_breakdown.json";
import errorClusters from "../../../public/data/error_clusters.json";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

const SOURCE_COLORS: Record<string, string> = {
  ...TOOL_COLORS,
};

// Sorted ascending for horizontal bar (lowest → highest)
const BY_SOURCE = [...errorBreakdown.by_source]
  .sort((a, b) => a.errors - b.errors)
  .map((d) => ({
    app: d.tool,
    errors: d.errors,
    color: SOURCE_COLORS[d.tool] ?? "#52525b",
  }));

// Clusters sorted ascending for horizontal bar
const BY_CAUSE = [...errorClusters.clusters]
  .sort((a, b) => a.count - b.count)
  .map((d) => ({
    cause: d.label,
    count: d.count,
    color: d.label.startsWith("KG Explorer") ? TOOL_COLORS["KG Explorer"]
         : d.label.startsWith("HTTP") ? "#a78bfa"
         : d.label.startsWith("HRA Pop") ? "#06b6d4"
         : d.label.startsWith("Malformed") ? "#d97706"
         : d.label.startsWith("Dev") ? "#52525b"
         : "#52525b",
  }));

export function ErrorSourceChart() {
  const maxErrors = Math.max(...BY_SOURCE.map((d) => d.errors));
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 64, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const d = BY_SOURCE.find((s) => s.app === p[0].name)!;
        return `<span style="color:#a1a1aa">${d.app}</span><br/>
          <strong>${d.errors.toLocaleString()} errors</strong>`;
      },
    },
    xAxis: { type: "value", show: false, max: maxErrors * 1.15 },
    yAxis: {
      type: "category",
      data: BY_SOURCE.map((d) => d.app),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: BY_SOURCE.map((d) => ({
          value: d.errors,
          itemStyle: { color: d.color, opacity: 0.85, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
          color: "#71717a",
          fontSize: 10,
        },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "170px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

export function ErrorCauseChart() {
  const total = BY_CAUSE.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...BY_CAUSE.map((d) => d.count));
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 60, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const pct = ((p[0].value / total) * 100).toFixed(1);
        return `<span style="color:#a1a1aa">${p[0].name}</span><br/>
          <strong>${p[0].value.toLocaleString()} errors (${pct}%)</strong>`;
      },
    },
    xAxis: { type: "value", show: false, max: maxCount * 1.15 },
    yAxis: {
      type: "category",
      data: BY_CAUSE.map((d) => d.cause),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10, width: 160, overflow: "truncate" as const },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: BY_CAUSE.map((d) => ({
          value: d.count,
          itemStyle: { color: d.color, opacity: 0.85, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => `${((p.value / total) * 100).toFixed(0)}%`,
          color: "#71717a",
          fontSize: 10,
        },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "170px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}
