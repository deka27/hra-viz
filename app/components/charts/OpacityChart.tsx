"use client";

import dynamic from "next/dynamic";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface PathItem {
  path: string;
  count: number;
}

function getLabel(path: string): string {
  if (path.includes("all-anatomical-structures")) return "All Structures (global toggle)";
  if (path.includes("bisection-line")) return "Bisection Line";
  if (path.includes("opacity-settings.toggle")) return "Opacity Panel Open";
  const match = path.match(/AS-visibility\.(.+?)\.opacity-toggle/);
  if (match) {
    return match[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  const match2 = path.match(/landmarks-visibility\.(.+?)\.opacity-toggle/);
  if (match2) return match2[1].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return path;
}

function getColor(path: string, idx: number): string {
  if (path.includes("all-anatomical-structures")) return "#f43f5e";
  if (path.includes("bisection-line")) return "#f59e0b";
  if (path.includes("opacity-settings.toggle")) return "#10b981";
  const palette = ["#8b5cf6","#6366f1","#3b82f6","#06b6d4","#10b981","#84cc16","#f59e0b","#f43f5e","#ec4899"];
  return palette[idx % palette.length];
}

export default function OpacityChart({ data }: { data: PathItem[] }) {
  // Take top 15
  const top = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .sort((a, b) => a.count - b.count);

  const option = {
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
          <div style="color:#a1a1aa">${p.value} opacity toggle${p.value !== 1 ? "s" : ""}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 40, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
      splitLine: { lineStyle: { color: "#27272a" } },
    },
    yAxis: {
      type: "category",
      data: top.map((d) => getLabel(d.path)),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: top.map((d, i) => ({
          value: d.count,
          itemStyle: {
            color: getColor(d.path, i),
            borderRadius: [0, 5, 5, 0],
            opacity: 0.9,
          },
        })),
        barMaxWidth: 22,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => `${value}`,
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "360px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
