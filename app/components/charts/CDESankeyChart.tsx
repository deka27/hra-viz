"use client";

import ThemedEChart from "../ThemedEChart";

// Derived from cde_workflow.json
// 163 uploads, 132 visualized, 93 came via landing page "Create a Visualization" button
// 70 came direct (skipped landing) = 163 - 93
const NODES = [
  { name: "Via Landing Page", itemStyle: { color: "#f59e0b" } },
  { name: "Direct / Navigation", itemStyle: { color: "#d97706" } },
  { name: "Upload File", itemStyle: { color: "#3b82f6" } },
  { name: "Configure & Organize", itemStyle: { color: "#8b5cf6" } },
  { name: "Visualized", itemStyle: { color: "#10b981" } },
  { name: "Dropped Off", itemStyle: { color: "#3f3f46" } },
];

const LINKS = [
  { source: "Via Landing Page",    target: "Upload File",            value: 93 },
  { source: "Direct / Navigation", target: "Upload File",            value: 70 },
  { source: "Upload File",         target: "Configure & Organize",   value: 163 },
  { source: "Configure & Organize",target: "Visualized",             value: 132 },
  { source: "Configure & Organize",target: "Dropped Off",            value: 31 },
];

const TOTAL_UPLOADS = LINKS.find(
  (l) => l.source === "Upload File" && l.target === "Configure & Organize"
)?.value ?? 0;

export default function CDESankeyChart() {
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
          return `<div style="font-weight:600;color:#fafafa">${p.name}</div>`;
        }
        const pct = TOTAL_UPLOADS > 0 ? ((p.data.value / TOTAL_UPLOADS) * 100).toFixed(0) : "0";
        return `<div>
          <div style="color:#a1a1aa;margin-bottom:4px">${p.data.source} → ${p.data.target}</div>
          <div style="font-weight:700;color:#fafafa;font-size:16px">${p.data.value} users</div>
          <div style="color:#71717a;font-size:11px">${pct}% of all uploaders</div>
        </div>`;
      },
    },
    series: [
      {
        type: "sankey",
        layout: "none",
        orient: "horizontal",
        data: NODES,
        links: LINKS,
        emphasis: { focus: "adjacency" },
        nodeWidth: 16,
        nodeGap: 24,
        left: "4%",
        right: "4%",
        top: "12%",
        bottom: "8%",
        lineStyle: {
          color: "gradient",
          opacity: 0.35,
          curveness: 0.45,
        },
        label: {
          color: "#d4d4d8",
          fontSize: 12,
          fontWeight: "bold" as const,
          formatter: (p: { name: string }) => {
            const count = LINKS.find((l) => l.target === p.name)?.value
              ?? LINKS.filter((l) => l.source === p.name).reduce((s, l) => s + l.value, 0);
            if (p.name === "Via Landing Page") return `${p.name}\n93 users`;
            if (p.name === "Direct / Navigation") return `${p.name}\n70 users`;
            if (p.name === "Upload File") return `Upload File\n163 users`;
            if (p.name === "Configure & Organize") return `Configure\n163 users`;
            if (p.name === "Visualized") return `Visualized\n132 (81%)`;
            if (p.name === "Dropped Off") return `Dropped Off\n31 (19%)`;
            return `${p.name}\n${count}`;
          },
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      <ThemedEChart
        option={option}
        style={{ height: "340px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-zinc-400">Entry via landing page (57%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-zinc-400">81% completion rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-zinc-600" />
          <span className="text-zinc-400">Download step is not tracked in current logs</span>
        </div>
      </div>
    </div>
  );
}
