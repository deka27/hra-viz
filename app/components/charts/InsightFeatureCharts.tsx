"use client";

import dynamic from "next/dynamic";
import referrersData from "../../../public/data/referrers.json";
import navClicksData from "../../../public/data/nav_clicks.json";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

// ── INSIGHT 10 ───────────────────────────────────────────────────────────────
// RUI keyboard asymmetry: A=974, E=645, Q=631, W=528, D=473
export function KeyboardAsymmetryChart() {
  const data = [
    { key: "D (right)", value: 473, color: "#8b5cf6", opacity: 0.45 },
    { key: "W (forward)", value: 528, color: "#8b5cf6", opacity: 0.55 },
    { key: "Q (down)", value: 631, color: "#8b5cf6", opacity: 0.65 },
    { key: "E (up)", value: 645, color: "#8b5cf6", opacity: 0.70 },
    { key: "A (left)", value: 974, color: "#8b5cf6", opacity: 1.0 },
  ];
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 72, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p[0].name}</span><br/><strong>${p[0].value.toLocaleString()} interactions</strong>`,
    },
    xAxis: { type: "value", show: false, max: 1100 },
    yAxis: {
      type: "category",
      data: data.map((d) => d.key),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: data.map((d) => ({
          value: d.value,
          itemStyle: { color: d.color, opacity: d.opacity, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => p.value.toLocaleString(),
          color: "#fafafa",
          fontSize: 11,
          fontWeight: "bold" as const,
        },
      },
    ],
  };
  return (
    <div>
      <ReactECharts option={option} style={{ height: "140px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <p className="text-xs text-zinc-600 mt-1 px-1">A (left) used <span className="text-violet-400 font-semibold">2.06× more</span> than D (right)</p>
    </div>
  );
}

// ── INSIGHT 12 ───────────────────────────────────────────────────────────────
// CDE entry split: Via CTA 93 (57%) vs Direct 70 (43%)
export function CDEEntrySplitChart() {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p.name}</span><br/><strong>${p.value} users (${p.percent}%)</strong>`,
    },
    legend: {
      orient: "vertical",
      right: 12,
      top: "center",
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["42%", "70%"],
        center: ["35%", "50%"],
        data: [
          { name: "Via Landing CTA", value: 93,
            itemStyle: { color: "#f59e0b" }, label: { show: false } },
          { name: "Direct / Navigation", value: 70,
            itemStyle: { color: "#52525b" }, label: { show: false } },
        ],
        emphasis: { scale: true, scaleSize: 4 },
        labelLine: { show: false },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "140px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

// ── INSIGHT 18 ───────────────────────────────────────────────────────────────
// External referrers by API request volume (from cs_referer analysis)
export function ReferrerEcosystemChart() {
  const COLORS: Record<string, string> = {
    "GTEx Portal": "#2dd4bf",
    "HubMAP":      "#3b82f6",
    "SenNet":      "#f59e0b",
    "EBI":         "#a78bfa",
    "Google":      "#71717a",
    "Vitessce":    "#10b981",
  };
  // Sort ascending so largest bar is on top in horizontal chart
  const sorted = [...referrersData].sort((a, b) => a.value - b.value);
  const data = sorted.map((d, i) => ({
    name: d.name,
    value: d.value,
    color: COLORS[d.name] ?? "#52525b",
    opacity: 0.5 + (i / (sorted.length - 1)) * 0.5,
  }));
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 64, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const val = p[0].value as number;
        const fmt = val >= 1_000_000 ? `${(val / 1_000_000).toFixed(2)}M` : `${(val / 1_000).toFixed(0)}K`;
        return `<span style="color:#a1a1aa">${p[0].name}</span><br/><strong>${fmt} requests</strong>`;
      },
    },
    xAxis: { type: "value", show: false, max: 2_000_000 },
    yAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: data.map((d) => ({
          value: d.value,
          itemStyle: { color: d.color, opacity: d.opacity, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => {
            const val = p.value as number;
            return val >= 1_000_000 ? `${(val / 1_000_000).toFixed(2)}M` : `${(val / 1_000).toFixed(0)}K`;
          },
          color: "#a1a1aa",
          fontSize: 10,
        },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "180px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

// ── INSIGHT 19 ───────────────────────────────────────────────────────────────
// Portal navigation clicks (e.label) — top nav items on humanatlas.io
export function NavClicksChart() {
  // Top 5, sorted ascending for horizontal bar
  const top5 = [...navClicksData]
    .sort((a, b) => a.count - b.count)
    .slice(-5);
  const maxVal = top5[top5.length - 1].count;
  const data = top5.map((d, i) => ({
    label: d.label,
    value: d.count,
    opacity: 0.45 + (i / (top5.length - 1)) * 0.55,
  }));
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 56, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p[0].name}</span><br/><strong>${p[0].value.toLocaleString()} clicks</strong>`,
    },
    xAxis: { type: "value", show: false, max: Math.ceil(maxVal * 1.15) },
    yAxis: {
      type: "category",
      data: data.map((d) => d.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: data.map((d) => ({
          value: d.value,
          itemStyle: { color: "#38bdf8", opacity: d.opacity, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => p.value.toLocaleString(),
          color: "#a1a1aa",
          fontSize: 10,
        },
      },
    ],
  };
  return (
    <div>
      <ReactECharts option={option} style={{ height: "140px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <p className="text-xs text-zinc-600 mt-1 px-1">
        <span className="text-sky-400 font-semibold">Data</span> pages outpace{" "}
        <span className="text-sky-300/70 font-semibold">Apps</span> by 52% — users follow the data, not the tools
      </p>
    </div>
  );
}

// ── INSIGHT 17 ───────────────────────────────────────────────────────────────
// Error rate: 21,350 errors out of 92,064 total interactions
export function ErrorRateChart() {
  const data = [
    { event: "Model Change",  count: 2910,  color: "#3b82f6", opacity: 0.5 },
    { event: "Keyboard",      count: 5497,  color: "#3b82f6", opacity: 0.55 },
    { event: "Page View",     count: 9501,  color: "#3b82f6", opacity: 0.6 },
    { event: "Hover",         count: 19406, color: "#3b82f6", opacity: 0.65 },
    { event: "Error",         count: 21350, color: "#ef4444", opacity: 0.9 },
    { event: "Click",         count: 33400, color: "#3b82f6", opacity: 0.9 },
  ];
  const total = data.reduce((s, d) => s + d.count, 0);
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 90, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const pct = ((p[0].value / total) * 100).toFixed(1);
        const isError = p[0].name === "Error";
        return `<span style="color:#a1a1aa">${p[0].name}</span><br/><strong style="color:${isError ? "#ef4444" : "#fafafa"}">${p[0].value.toLocaleString()}</strong> <span style="color:#71717a">(${pct}%)</span>`;
      },
    },
    xAxis: { type: "value", show: false, max: 38000 },
    yAxis: {
      type: "category",
      data: data.map((d) => d.event),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: data.map((d) => ({
          value: d.count,
          itemStyle: { color: d.color, opacity: d.opacity, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => `${((p.value / total) * 100).toFixed(1)}%`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (p: any) => p.name === "Error" ? "#ef4444" : "#a1a1aa",
          fontSize: 11,
          fontWeight: "bold" as const,
        },
      },
    ],
  };
  return (
    <div>
      <ReactECharts option={option} style={{ height: "160px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <p className="text-xs text-zinc-600 mt-1 px-1"><span className="text-red-400 font-semibold">Error</span> is the 2nd-largest event type — 1 error for every 1.57 clicks</p>
    </div>
  );
}
