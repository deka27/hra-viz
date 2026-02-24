"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// Pearson correlations over full dataset period (Jan 2024 – Jan 2026)
// KG Explorer launched Aug 2025, so its full-period correlations are dampened by 21 months of zeros
const CORRELATIONS: { source: string; target: string; r: number }[] = [
  { source: "EUI", target: "FTU Explorer", r: 0.89 },
  { source: "EUI", target: "RUI", r: 0.70 },
  { source: "CDE", target: "RUI", r: 0.67 },
  { source: "FTU Explorer", target: "RUI", r: 0.55 },
  { source: "CDE", target: "FTU Explorer", r: 0.28 },
  { source: "KG Explorer", target: "EUI", r: 0.12 },
  { source: "KG Explorer", target: "RUI", r: 0.15 },
  { source: "KG Explorer", target: "CDE", r: 0.05 },
  { source: "KG Explorer", target: "FTU Explorer", r: 0.08 },
];

const TOTAL_VISITS: Record<string, number> = {
  "EUI": 13366,
  "RUI": 5161,
  "CDE": 4781,
  "FTU Explorer": 4221,
  "KG Explorer": 15975,
};

const MIN_V = Math.min(...Object.values(TOTAL_VISITS));
const MAX_V = Math.max(...Object.values(TOTAL_VISITS));
const scaleNode = (v: number) => 30 + ((v - MIN_V) / (MAX_V - MIN_V)) * 38;

const NODES = Object.entries(TOTAL_VISITS).map(([name, visits]) => ({
  name,
  visits,
  symbolSize: scaleNode(visits),
  itemStyle: { color: TOOL_COLORS[name], shadowBlur: 16, shadowColor: TOOL_COLORS[name] + "55" },
  label: { show: true, color: "#fafafa", fontSize: 11, fontWeight: 700 as const },
}));

export default function ToolCorrelationGraph() {
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
        if (p.dataType === "node") {
          const v = TOTAL_VISITS[p.name];
          return `<div>
            <div style="font-weight:700;color:${TOOL_COLORS[p.name]};font-size:14px;margin-bottom:4px">${p.name}</div>
            <div style="color:#a1a1aa">${v.toLocaleString()} total visits</div>
          </div>`;
        }
        if (p.dataType === "edge") {
          const r = p.data.r;
          const strength = r >= 0.7 ? "Strong" : r >= 0.5 ? "Moderate" : r >= 0.25 ? "Weak" : "Very weak";
          return `<div>
            <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.data.source} ↔ ${p.data.target}</div>
            <div style="color:#a1a1aa">Pearson r = <span style="color:#fafafa;font-weight:600">${r.toFixed(2)}</span></div>
            <div style="color:#71717a;font-size:11px;margin-top:2px">${strength} monthly correlation</div>
          </div>`;
        }
        return "";
      },
    },
    series: [
      {
        type: "graph",
        layout: "force",
        animation: true,
        roam: true,
        draggable: true,
        force: {
          repulsion: 280,
          edgeLength: [90, 220],
          gravity: 0.12,
          friction: 0.6,
        },
        nodes: NODES,
        edges: CORRELATIONS.map((c) => ({
          source: c.source,
          target: c.target,
          r: c.r,
          lineStyle: {
            width: c.r >= 0.5 ? 1 + c.r * 4 : 1,
            color: c.r >= 0.5 ? "#a1a1aa" : "#3f3f46",
            type: c.r < 0.2 ? ("dashed" as const) : ("solid" as const),
            opacity: 0.25 + c.r * 0.65,
            curveness: 0.1,
          },
          label: {
            show: c.r >= 0.4,
            formatter: `r=${c.r.toFixed(2)}`,
            fontSize: 10,
            color: "#71717a",
          },
          emphasis: {
            lineStyle: { width: c.r >= 0.5 ? 1 + c.r * 5 : 2, opacity: 1 },
          },
        })),
        emphasis: {
          focus: "adjacency",
          scale: 1.15,
        },
        label: {
          position: "bottom",
          fontSize: 11,
          fontWeight: "bold" as const,
          color: "#fafafa",
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <ReactECharts
        option={option}
        style={{ height: "420px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 px-2 text-xs text-zinc-500">
        <span>Edge weight = Pearson r (monthly correlation)</span>
        <span>Node size = total visits</span>
        <span className="text-zinc-600 italic">Drag nodes · scroll to zoom</span>
      </div>
    </div>
  );
}
