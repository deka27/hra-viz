"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

// ── INSIGHT 1 ─────────────────────────────────────────────────────────────────
// March 2024 spike: EUI +4075%, FTU +5673%, RUI +1564%
export function SpikeComparisonChart() {
  const data = [
    { name: "RUI",           pct: 1564, color: TOOL_COLORS["RUI"] },
    { name: "EUI",           pct: 4075, color: TOOL_COLORS["EUI"] },
    { name: "FTU Explorer",  pct: 5673, color: TOOL_COLORS["FTU Explorer"] },
  ];
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 90, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p[0].name}</span><br/><strong>+${p[0].value.toLocaleString()}%</strong> MoM spike`,
    },
    xAxis: { type: "value", show: false, max: 7200 },
    yAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: "bold" as const },
    },
    series: [
      {
        type: "bar",
        barWidth: 24,
        data: data.map((d) => ({
          value: d.pct,
          itemStyle: { color: d.color, borderRadius: [0, 4, 4, 0], opacity: 0.9 },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => `+${p.value.toLocaleString()}%`,
          color: "#fafafa",
          fontSize: 12,
          fontWeight: "bold" as const,
        },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "130px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

// ── INSIGHT 2 ─────────────────────────────────────────────────────────────────
// Oct 2024 triple-tool: CDE=1218, EUI=1254, RUI=1253
export function TripleToolSpikeChart() {
  const data = [
    { name: "CDE", value: 1218, color: TOOL_COLORS["CDE"] },
    { name: "EUI", value: 1254, color: TOOL_COLORS["EUI"] },
    { name: "RUI", value: 1253, color: TOOL_COLORS["RUI"] },
  ];
  const option = {
    backgroundColor: "transparent",
    grid: { top: 28, left: 8, right: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "item",
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p.name}</span><br/><strong>${p.value.toLocaleString()} visits</strong>`,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 12, fontWeight: "bold" as const },
    },
    yAxis: {
      type: "value",
      min: 1150,
      max: 1310,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
      axisLabel: { color: "#71717a", fontSize: 10 },
    },
    series: [
      {
        type: "bar",
        barWidth: 44,
        data: data.map((d) => ({
          value: d.value,
          itemStyle: { color: d.color, borderRadius: [4, 4, 0, 0], opacity: 0.9 },
        })),
        label: {
          show: true,
          position: "top",
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
    <ReactECharts option={option} style={{ height: "165px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

// ── INSIGHT 3 ─────────────────────────────────────────────────────────────────
// April 2025 co-spike: CDE 176→451, FTU 104→594, EUI 228→240
export function AprilCoSpikeChart() {
  const tools = ["CDE", "FTU Explorer", "EUI"];
  const before = [176, 104, 228];
  const after  = [451, 594, 240];
  const option = {
    backgroundColor: "transparent",
    grid: { top: 28, left: 8, right: 8, bottom: 8, containLabel: true },
    legend: {
      top: 0,
      left: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#71717a", fontSize: 10 },
      data: [
        { name: "Mar 2025 (before)", icon: "circle" },
        { name: "Apr 2025 (after)",  icon: "circle" },
      ],
    },
    tooltip: {
      trigger: "axis",
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const rows = params.map((p: any) => `<span style="color:#a1a1aa">${p.seriesName}:</span> <strong>${p.value.toLocaleString()}</strong>`).join("<br/>");
        return `<span style="color:#a1a1aa">${params[0].axisValue}</span><br/>${rows}`;
      },
    },
    xAxis: {
      type: "category",
      data: tools,
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10, fontWeight: "bold" as const },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
      axisLabel: { color: "#71717a", fontSize: 10 },
    },
    series: [
      {
        name: "Mar 2025 (before)",
        type: "bar",
        barGap: "20%",
        data: before.map((v, i) => ({ value: v, itemStyle: { color: TOOL_COLORS[tools[i] as keyof typeof TOOL_COLORS], opacity: 0.35, borderRadius: [3, 3, 0, 0] } })),
      },
      {
        name: "Apr 2025 (after)",
        type: "bar",
        data: after.map((v, i) => ({
          value: v,
          itemStyle: { color: TOOL_COLORS[tools[i] as keyof typeof TOOL_COLORS], opacity: 0.9, borderRadius: [3, 3, 0, 0] },
        })),
        label: {
          show: true,
          position: "top",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => p.value.toLocaleString(),
          color: "#fafafa",
          fontSize: 10,
          fontWeight: "bold" as const,
        },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "175px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

// ── INSIGHT 4 ─────────────────────────────────────────────────────────────────
// Seasonal pattern: monthly averages across all years (all tools combined)
const MONTHLY_AVGS = [
  { month: "Jan", avg: 1017 },
  { month: "Feb", avg: 410 },
  { month: "Mar", avg: 5085 }, // includes 2024 spike
  { month: "Apr", avg: 1022 },
  { month: "May", avg: 410 },
  { month: "Jun", avg: 633 },
  { month: "Jul", avg: 620 },
  { month: "Aug", avg: 1384 },
  { month: "Sep", avg: 2201 },
  { month: "Oct", avg: 4321 }, // consistently highest
  { month: "Nov", avg: 2021 },
  { month: "Dec", avg: 1388 },
];

export function SeasonalPatternChart() {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 12, left: 8, right: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const note = p[0].name === "Oct" ? " ← yearly peak" : p[0].name === "Mar" ? " (incl. 2024 spike)" : "";
        return `<span style="color:#a1a1aa">${p[0].name}</span><br/><strong>${p[0].value.toLocaleString()} avg visits${note}</strong>`;
      },
    },
    xAxis: {
      type: "category",
      data: MONTHLY_AVGS.map((d) => d.month),
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#71717a", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
      axisLabel: { color: "#71717a", fontSize: 10, formatter: (v: number) => v >= 1000 ? `${v / 1000}k` : `${v}` },
    },
    series: [
      {
        type: "bar",
        barWidth: "65%",
        data: MONTHLY_AVGS.map((d) => ({
          value: d.avg,
          itemStyle: {
            color: d.month === "Oct" ? "#f59e0b"
              : d.month === "Mar" ? "#ef4444"
              : "#3b82f6",
            opacity: d.month === "Oct" || d.month === "Mar" ? 0.9 : 0.45,
            borderRadius: [2, 2, 0, 0],
          },
        })),
      },
    ],
  };
  return (
    <div>
      <ReactECharts option={option} style={{ height: "160px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <div className="flex items-center gap-4 mt-1 px-1 text-xs text-zinc-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> Oct — yearly peak</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Mar — incl. 2024 event spike</span>
      </div>
    </div>
  );
}

// ── INSIGHT 5 ─────────────────────────────────────────────────────────────────
// KG Explorer trajectory Aug '25 → Jan '26
const KG_MONTHS = [
  { month: "Aug '25", value: 1354 },
  { month: "Sep '25", value: 2569 },
  { month: "Oct '25", value: 3891 },
  { month: "Nov '25", value: 3043 },
  { month: "Dec '25", value: 2977 },
  { month: "Jan '26", value: 2141 },
];

export function KGTrajectoryChart() {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 24, left: 8, right: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p[0].axisValue}</span><br/><strong>${p[0].value.toLocaleString()} visits</strong>`,
    },
    xAxis: {
      type: "category",
      data: KG_MONTHS.map((d) => d.month),
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#71717a", fontSize: 10 },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
      axisLabel: { color: "#71717a", fontSize: 10, formatter: (v: number) => v >= 1000 ? `${v / 1000}k` : `${v}` },
    },
    series: [
      {
        type: "line",
        smooth: 0.3,
        data: KG_MONTHS.map((d, i) => ({
          value: d.value,
          itemStyle: { color: i === 2 ? "#f43f5e" : "#f43f5e" }, // peak highlighted
        })),
        lineStyle: { color: "#f43f5e", width: 2.5 },
        itemStyle: { color: "#f43f5e" },
        symbolSize: (val: number, params: { dataIndex: number }) => params.dataIndex === 2 ? 8 : 5,
        symbol: "circle",
        showSymbol: true,
        areaStyle: {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: "#f43f5e30" }, { offset: 1, color: "#f43f5e00" }] },
        },
        markPoint: {
          data: [{ type: "max", name: "Peak", label: { formatter: "Peak\n{c}", fontSize: 10, color: "#fafafa" }, itemStyle: { color: "#f43f5e" } }],
          symbol: "pin",
          symbolSize: 36,
        },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "165px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}

// ── INSIGHT 6 ─────────────────────────────────────────────────────────────────
// EUI permanent baseline lift: 132 → 209 visits/month
export function EUIBaselineLiftChart() {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 28, left: 8, right: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "item",
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => `<span style="color:#a1a1aa">${p.name}</span><br/><strong>${p.value} visits/month</strong>`,
    },
    xAxis: {
      type: "category",
      data: ["Pre-event avg\n(Jan–Feb '24)", "Post-event avg\n(Apr–Aug '24)"],
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10, lineHeight: 14 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 280,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
      axisLabel: { color: "#71717a", fontSize: 10 },
    },
    series: [
      {
        type: "bar",
        barWidth: 52,
        data: [
          { value: 132, itemStyle: { color: "#3b82f6", opacity: 0.45, borderRadius: [4, 4, 0, 0] } },
          { value: 209, itemStyle: { color: "#3b82f6", opacity: 0.9, borderRadius: [4, 4, 0, 0] } },
        ],
        label: {
          show: true,
          position: "top",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => `${p.value}/mo`,
          color: "#fafafa",
          fontSize: 11,
          fontWeight: "bold" as const,
        },
        markLine: {
          silent: true,
          symbol: ["none", "arrow"],
          data: [[
            { coord: [0, 132], lineStyle: { color: "#22c55e", type: "dashed", width: 1.5 } },
            { coord: [1, 132] },
          ]],
          label: { show: true, formatter: "pre-event\nbaseline", color: "#71717a", fontSize: 9, position: "middle" },
        },
      },
    ],
    graphic: [
      {
        type: "text",
        left: "50%",
        top: 32,
        style: { text: "+58%", fill: "#22c55e", fontSize: 16, fontWeight: "bold", textAlign: "center" },
      },
    ],
  };
  return (
    <ReactECharts option={option} style={{ height: "175px", width: "100%" }} opts={{ renderer: "canvas" }} />
  );
}
