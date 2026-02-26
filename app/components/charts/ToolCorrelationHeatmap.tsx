"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS } from "../../lib/chartTheme";


const TOOLS = ["EUI", "FTU Explorer", "RUI", "CDE", "KG Explorer"];

// Full symmetric Pearson correlation matrix (monthly visits, Jan 2024–Jan 2026)
// KG Explorer correlations are dampened: 21 months of zeros before Aug 2025 launch
const MATRIX: number[][] = [
//  EUI    FTU    RUI    CDE    KG
  [ 1.00,  0.89,  0.70,  0.00,  0.12 ], // EUI
  [ 0.89,  1.00,  0.55,  0.28,  0.08 ], // FTU
  [ 0.70,  0.55,  1.00,  0.67,  0.15 ], // RUI
  [ 0.00,  0.28,  0.67,  1.00,  0.05 ], // CDE
  [ 0.12,  0.08,  0.15,  0.05,  1.00 ], // KG
];

// Flatten to [x, y, value] for ECharts heatmap
const heatData: [number, number, number][] = [];
for (let i = 0; i < TOOLS.length; i++) {
  for (let j = 0; j < TOOLS.length; j++) {
    heatData.push([j, i, MATRIX[i][j]]);
  }
}

const TOOL_LABELS = ["EUI", "FTU", "RUI", "CDE", "KG"];

export default function ToolCorrelationHeatmap() {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 13 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const r = p.data[2] as number;
        const toolA = TOOLS[p.data[1] as number];
        const toolB = TOOLS[p.data[0] as number];
        if (toolA === toolB) {
          return `<div style="color:#a1a1aa">${toolA} — self-correlation (1.00)</div>`;
        }
        const strength = Math.abs(r) >= 0.7 ? "Strong" : Math.abs(r) >= 0.5 ? "Moderate" : Math.abs(r) >= 0.25 ? "Weak" : "Very weak";
        const dir = r >= 0 ? "positive" : "negative";
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${toolA} ↔ ${toolB}</div>
          <div>r = <span style="font-weight:700;color:${r >= 0.5 ? "#22c55e" : r >= 0.25 ? "#a1a1aa" : "#71717a"}">${r.toFixed(2)}</span></div>
          <div style="color:#71717a;font-size:11px;margin-top:2px">${strength} ${dir} correlation</div>
        </div>`;
      },
    },
    grid: { top: 40, left: 80, right: 20, bottom: 60, containLabel: false },
    xAxis: {
      type: "category",
      data: TOOL_LABELS,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 12,
        fontWeight: "bold" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rich: Object.fromEntries(TOOLS.map((t, i) => [TOOL_LABELS[i], { color: TOOL_COLORS[t], fontWeight: "bold" }])),
      },
      splitArea: { show: true, areaStyle: { color: ["#18181b", "#1c1c1f"] } },
    },
    yAxis: {
      type: "category",
      data: TOOL_LABELS,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 12,
        fontWeight: "bold" as const,
      },
      splitArea: { show: true, areaStyle: { color: ["#18181b", "#1c1c1f"] } },
    },
    visualMap: {
      min: -0.1,
      max: 1.0,
      show: false,
      inRange: {
        color: ["#18181b", "#14291a", "#166534", "#16a34a", "#22c55e"],
      },
    },
    series: [
      {
        type: "heatmap",
        data: heatData,
        label: {
          show: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => {
            const r = p.data[2] as number;
            const toolA = TOOLS[p.data[1] as number];
            const toolB = TOOLS[p.data[0] as number];
            if (toolA === toolB) return "—";
            return r.toFixed(2);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (p: any) => {
            const r = p.data[2] as number;
            return r >= 0.5 ? "#fafafa" : "#71717a";
          },
          fontSize: 12,
          fontWeight: "bold" as const,
        },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: "rgba(34,197,94,0.4)" },
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      <ThemedEChart
        option={option}
        style={{ height: "320px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      {/* Legend */}
      <div className="flex items-center gap-3 px-2">
        <span className="text-xs text-zinc-500">Correlation:</span>
        {[
          { label: "Strong (≥0.70)", color: "bg-green-400" },
          { label: "Moderate (0.50–0.69)", color: "bg-green-700" },
          { label: "Weak (0.25–0.49)", color: "bg-zinc-700" },
          { label: "None (<0.25)", color: "bg-zinc-800" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-xs text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
