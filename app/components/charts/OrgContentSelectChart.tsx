"use client";

import ThemedEChart from "../ThemedEChart";

interface SelectionRow {
  selection: string;
  count: number;
}

// Human-readable labels + tool attribution for known selection keys
const LABELS: Record<string, { label: string; color: string }> = {
  "all-organs":                             { label: "All Organs (overview)",        color: "#f43f5e" },
  "3d-organs":                              { label: "3D Organs",                    color: "#f43f5e" },
  "3d":                                     { label: "3D Reference Objects",         color: "#f43f5e" },
  "asctb-tables":                           { label: "ASCT+B Tables",                color: "#06b6d4" },
  "functional-tissue-unit-illustrations":   { label: "FTU Illustrations",            color: "#10b981" },
  "register":                               { label: "Register (RUI launch)",        color: "#8b5cf6" },
  "anterior":                               { label: "Anterior view",                color: "#f43f5e" },
  "right":                                  { label: "Right side",                   color: "#f43f5e" },
  "kidney":                                 { label: "Kidney",                       color: "#f43f5e" },
  "3d-reference-objects":                   { label: "3D Reference Library",         color: "#f43f5e" },
  "tier2_annotation":                       { label: "Tier 2 Annotation",            color: "#a78bfa" },
};

export default function OrgContentSelectChart({ data }: { data: SelectionRow[] }) {
  // Take top 10 known entries, sorted ascending for horizontal bar
  const rows = data
    .filter((d) => LABELS[d.selection])
    .slice(0, 10)
    .sort((a, b) => a.count - b.count);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0];
        return `<div style="font-weight:500">${p.name}</div><div style="color:#a1a1aa">${p.value.toLocaleString()} selections</div>`;
      },
    },
    grid: { top: 8, left: 8, right: 64, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: "#71717a", fontSize: 10, formatter: (v: number) => v >= 1000 ? `${v / 1000}k` : `${v}` },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: rows.map((d) => LABELS[d.selection]?.label ?? d.selection),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10.5 },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: rows.map((d) => ({
          value: d.count,
          itemStyle: {
            color: LABELS[d.selection]?.color ?? "#52525b",
            opacity: 0.85,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 10,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
