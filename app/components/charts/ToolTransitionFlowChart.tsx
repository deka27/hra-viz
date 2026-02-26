"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS } from "../../lib/chartTheme";
import transitionData from "../../../public/data/transition_matrix.json";
import totalToolVisits from "../../../public/data/total_tool_visits.json";


const totalVisitsByTool = Object.fromEntries(totalToolVisits.map((d) => [d.tool, d.visits] as const));
const allTools = Array.from(
  new Set([
    ...Object.keys(totalVisitsByTool),
    ...transitionData.transitions.flatMap((t) => [t.from_tool, t.to_tool]),
  ])
);

const visitValues = allTools.map((tool) => totalVisitsByTool[tool] ?? 0);
const MIN_V = Math.min(...visitValues);
const MAX_V = Math.max(...visitValues);
const scaleNode = (v: number) => {
  if (MAX_V === MIN_V) return 46;
  return 28 + ((v - MIN_V) / (MAX_V - MIN_V)) * 36;
};

const NODES = allTools.map((name) => {
  const visits = totalVisitsByTool[name] ?? 0;
  const color = TOOL_COLORS[name] ?? "#a1a1aa";
  return {
    name,
    symbolSize: scaleNode(visits),
    itemStyle: {
      color,
      shadowBlur: 12,
      shadowColor: `${color}44`,
    },
    label: { show: true, color: "#fafafa", fontSize: 11, fontWeight: 700 as const, position: "bottom" as const },
  };
});

export default function ToolTransitionFlowChart() {
  const maxCount = Math.max(...transitionData.transitions.map((t) => t.count));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        if (p.dataType === "node") {
          const v = totalVisitsByTool[p.name as string] ?? 0;
          const color = TOOL_COLORS[p.name as string] ?? "#a1a1aa";
          return `<div>
            <div style="font-weight:700;color:${color};font-size:13px;margin-bottom:4px">${p.name}</div>
            <div style="color:#a1a1aa">${v.toLocaleString()} total visits</div>
          </div>`;
        }
        if (p.dataType === "edge") {
          const t = transitionData.transitions.find(
            (x) => x.from_tool === p.data.source && x.to_tool === p.data.target
          );
          if (!t) return "";
          return `<div>
            <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${t.from_tool} → ${t.to_tool}</div>
            <div style="color:#a1a1aa">Sessions: <strong style="color:#fafafa">${t.count}</strong></div>
            <div style="color:#a1a1aa">Probability: <strong style="color:#22c55e">${(t.probability * 100).toFixed(1)}%</strong> of exits from ${t.from_tool}</div>
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
          repulsion: 340,
          edgeLength: [110, 250],
          gravity: 0.1,
          friction: 0.6,
        },
        nodes: NODES,
        edges: transitionData.transitions.map((t) => ({
          source: t.from_tool,
          target: t.to_tool,
          symbol: ["none", "arrow"],
          symbolSize: [0, 8],
          lineStyle: {
            width: 1 + (t.count / maxCount) * 5,
            color: TOOL_COLORS[t.from_tool] ?? "#52525b",
            opacity: 0.2 + (t.count / maxCount) * 0.55,
            curveness: 0.25,
          },
          label: {
            show: t.count >= 6,
            formatter: `${(t.probability * 100).toFixed(0)}%`,
            fontSize: 9,
            color: "#71717a",
          },
          emphasis: {
            lineStyle: { opacity: 1 },
          },
        })),
        emphasis: { focus: "adjacency" },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <ThemedEChart
        option={option}
        style={{ height: "420px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 px-2 text-xs text-zinc-500">
        <span>Arrow direction = navigation flow</span>
        <span>Edge width = transition count</span>
        <span>% label = probability from source tool</span>
        <span className="italic text-zinc-600">Drag nodes · scroll to zoom</span>
      </div>
    </div>
  );
}
