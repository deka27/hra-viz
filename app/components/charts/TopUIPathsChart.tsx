"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS, axisStyle, tooltipStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface UIPath {
  path: string;
  count: number;
}

function getToolFromPath(path: string): string {
  if (path.startsWith("eui.")) return "EUI";
  if (path.startsWith("rui.")) return "RUI";
  if (path.startsWith("kg-explorer.")) return "KG Explorer";
  if (path.startsWith("cde")) return "CDE";
  if (path.startsWith("hra-pop-visualizer")) return "FTU Explorer";
  return "Portal";
}

const PORTAL_COLOR = "#52525b";

function getColor(path: string): string {
  const tool = getToolFromPath(path);
  return TOOL_COLORS[tool] ?? PORTAL_COLOR;
}

function friendlyName(path: string): string {
  const map: Record<string, string> = {
    "eui.body-ui.scene": "EUI · 3D Body Scene",
    "hra-pop-visualizer.bar-graph": "FTU · Population Bar Graph",
    "humanatlas.header.navigation.data": "Portal · Nav → Data",
    "humanatlas.header.navigation.applications": "Portal · Nav → Apps",
    "rui.stage-content.3d": "RUI · 3D Registration Stage",
    "kg-explorer.main-page.digital-objects.table.table-icon": "KG · Table Row Icon",
    "rui.stage-content.directional-controls.keyboard.a": "RUI · Keyboard ← (A)",
    "humanatlas.header.navigation.training": "Portal · Nav → Training",
    "humanatlas.navigation-category-expansion": "Portal · Category Expand",
    "kg-explorer.main-page.digital-objects.table.link-cell": "KG · Table Link",
    "rui.stage-content.directional-controls.keyboard.e": "RUI · Keyboard ↑ (E)",
    "rui.stage-content.directional-controls.keyboard.q": "RUI · Keyboard ↓ (Q)",
    "kg-explorer.header.header.navigation.data": "KG · Nav → Data",
    "kg-explorer.header.header.navigation.applications": "KG · Nav → Apps",
    "humanatlas.header.navigation.about": "Portal · Nav → About",
    "humanatlas.data-viewer.data-selectors.organ": "Portal · Organ Selector",
    "humanatlas.table.link-cell": "Portal · Table Link",
    "eui.right-panel.statistics": "EUI · Statistics Panel",
    "rui.stage-content.directional-controls.keyboard.w": "RUI · Keyboard → (W)",
    "rui.stage-content.directional-controls.keyboard.d": "RUI · Keyboard → (D)",
  };
  return map[path] ?? path;
}

export default function TopUIPathsChart({ data }: { data: UIPath[] }) {
  const sorted = [...data].sort((a, b) => a.count - b.count);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        const tool = getToolFromPath(data.find((d) => friendlyName(d.path) === p.name)?.path ?? "");
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} interactions</div>
          <div style="color:#71717a;font-size:12px">Tool: ${tool}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
    },
    yAxis: {
      type: "category",
      data: sorted.map((d) => friendlyName(d.path)),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11.5, fontWeight: 400 },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.count,
          itemStyle: {
            color: getColor(d.path),
            borderRadius: [0, 4, 4, 0],
            opacity: 0.9,
          },
        })),
        barMaxWidth: 22,
        label: {
          show: true,
          position: "right",
          color: "#52525b",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "480px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
