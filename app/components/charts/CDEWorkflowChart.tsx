"use client";

import dynamic from "next/dynamic";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface WorkflowItem {
  path: string;
  count: number;
}

const STEP_MAP: { label: string; key: string; color: string; stage: string }[] = [
  { label: "Landing: Create Visualization CTA", key: "landing-page.create-and-explore.visual-cards.create-a-visualization", color: "#10b981", stage: "Entry" },
  { label: "Landing: Explore 2D Intestine Demo", key: "landing-page.create-and-explore.visual-cards.explore-2d-intestine-data", color: "#10b981", stage: "Entry" },
  { label: "Upload Data File", key: "create-visualization-page.upload-data.file-upload.upload", color: "#3b82f6", stage: "Upload" },
  { label: "Select Cell Type", key: "create-visualization-page.organize-data.cell-type-selector", color: "#8b5cf6", stage: "Configure" },
  { label: "Set X-Axis Column", key: "create-visualization-page.organize-data.x-axis-selector", color: "#8b5cf6", stage: "Configure" },
  { label: "Set Y-Axis Column", key: "create-visualization-page.organize-data.y-axis-selector", color: "#8b5cf6", stage: "Configure" },
  { label: "Set Z-Axis Column", key: "create-visualization-page.organize-data.z-axis-selector", color: "#8b5cf6", stage: "Configure" },
  { label: "Select Cell Ontology", key: "create-visualization-page.organize-data.cell-ontology-selector", color: "#a78bfa", stage: "Configure" },
  { label: "Anchor Cell Type", key: "create-visualization-page.configure-parameters.anchor-cell-type-selector", color: "#a78bfa", stage: "Configure" },
  { label: "Submit Visualization", key: "create-visualization-page.visualize-data.submit", color: "#f59e0b", stage: "Complete" },
];

export default function CDEWorkflowChart({ data }: { data: WorkflowItem[] }) {
  const rows = STEP_MAP.map((step) => {
    const item = data.find((d) => d.path.includes(step.key));
    return { ...step, count: item?.count ?? 0 };
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        const step = rows.find((r) => r.label === p.name);
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} interactions</div>
          <div style="color:#71717a;font-size:12px">Stage: ${step?.stage ?? ""}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => r.label),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: rows.map((r) => ({
          value: r.count,
          itemStyle: {
            color: r.color,
            borderRadius: [0, 5, 5, 0],
            opacity: r.stage === "Complete" ? 1 : 0.85,
          },
        })),
        barMaxWidth: 26,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => (value > 0 ? value.toLocaleString() : "—"),
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "380px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
