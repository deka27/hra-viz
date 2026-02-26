"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";


interface PathItem {
  path: string;
  count: number;
}

// Aggregate organ selections from spatial search data
function extractOrgans(data: PathItem[]): { name: string; count: number }[] {
  const organMap: Record<string, number> = {};
  const organPrefixes = [
    "organ-sex-selection.organ.",
    "organ.sex-selection.organ.",
  ];

  data.forEach((item) => {
    for (const prefix of organPrefixes) {
      const idx = item.path.indexOf(prefix);
      if (idx !== -1) {
        let organ = item.path.slice(idx + prefix.length);
        // Remove -l / -r suffixes for grouping
        organ = organ.replace(/-[lr]$/, "").replace(/-left$|-right$/, "");
        // Skip "search" pseudo-entry
        if (organ === "search") continue;
        // Format nicely
        const niceName = organ
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        organMap[niceName] = (organMap[niceName] ?? 0) + item.count;
        break;
      }
    }
  });

  return Object.entries(organMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.count - b.count);
}

// Key funnel steps
const FUNNEL_STEPS = [
  { label: "Click Search Button", key: "spatial-search-button", color: "#3b82f6" },
  { label: "Navigate Scene (3D)", key: "spatial-search.scene", color: "#6366f1" },
  { label: "Select Organ", key: "organ-sex-selection.organ.search", color: "#8b5cf6" },
  { label: "Continue to Search", key: "spatial-search-config.continue", color: "#a78bfa" },
  { label: "View Tissue Blocks", key: "spatial-search.results.tissue-blocks", color: "#10b981" },
  { label: "View Anatomical Structs", key: "spatial-search.results.anatomical-structures", color: "#34d399" },
  { label: "View Cell Types", key: "spatial-search.results.cell-types", color: "#6ee7b7" },
];

export default function SpatialSearchChart({ data }: { data: PathItem[] }) {
  const funnel = FUNNEL_STEPS.map((step) => {
    const total = data
      .filter((d) => d.path.includes(step.key))
      .reduce((s, d) => s + d.count, 0);
    return { ...step, count: total };
  });

  const organs = extractOrgans(data);

  const funnelOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} interactions</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 52, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: {
      type: "category",
      data: funnel.map((f) => f.label),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: funnel.map((f) => ({
          value: f.count,
          itemStyle: { color: f.color, borderRadius: [0, 5, 5, 0] },
        })),
        barMaxWidth: 26,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  const organOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      ...tooltipStyle,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<div style="padding:2px 0"><div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div><div style="color:#a1a1aa">${p.value} searches</div><div style="color:#71717a">${p.percent.toFixed(1)}%</div></div>`,
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "50%"],
        label: {
          color: "#a1a1aa",
          fontSize: 11,
          formatter: "{b}\n{c}",
        },
        labelLine: { lineStyle: { color: "#3f3f46" } },
        data: organs.slice(-8).map((o, i) => ({
          name: o.name,
          value: o.count,
          itemStyle: {
            color: ["#f43f5e","#3b82f6","#8b5cf6","#f59e0b","#10b981","#06b6d4","#ec4899","#84cc16"][i % 8],
          },
        })),
        emphasis: { scaleSize: 5 },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Search Workflow Steps</p>
        <ThemedEChart
          option={funnelOption}
          style={{ height: "260px", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Organs Searched</p>
        <ThemedEChart
          option={organOption}
          style={{ height: "240px", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
}
