"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

// By source app: errors and error rate (from parquet analysis)
const BY_SOURCE = [
  { app: "RUI",               errors: 16,   rate: 0.2,   color: "#8b5cf6" },
  { app: "CDE",               errors: 29,   rate: 0.7,   color: "#f59e0b" },
  { app: "FTU Explorer",      errors: 182,  rate: 12.0,  color: "#10b981" },
  { app: "Portal",            errors: 2267, rate: 14.3,  color: "#71717a" },
  { app: "EUI",               errors: 2846, rate: 28.2,  color: "#3b82f6" },
  { app: "KG Explorer",       errors: 7034, rate: 35.0,  color: "#f43f5e" },
];

// By root cause (from error message analysis)
const BY_CAUSE = [
  { cause: "Unhandled rejection / other", count: 1055,  color: "#52525b" },
  { cause: "Organ Info widget 404s",      count: 371,   color: "#d97706" },
  { cause: "Portal social icon failures", count: 1423,  color: "#71717a" },
  { cause: "EUI null ref in 3D picker",   count: 2251,  color: "#3b82f6" },
  { cause: "API endpoint failure",        count: 6438,  color: "#a78bfa" },
  { cause: "KG Explorer missing icons",   count: 6712,  color: "#f43f5e" },
];

export function ErrorSourceChart() {
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
          <strong>${d.errors.toLocaleString()} errors</strong><br/>
          <span style="color:#ef4444">${d.rate}% error rate</span>`;
      },
    },
    xAxis: { type: "value", show: false, max: 9000 },
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => {
            const d = BY_SOURCE.find((s) => s.errors === p.value)!;
            return `${d.rate}%`;
          },
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
    xAxis: { type: "value", show: false, max: 9000 },
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
