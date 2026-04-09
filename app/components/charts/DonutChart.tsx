"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle } from "../../lib/chartTheme";


export interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutItem[];
  unit?: string;
  height?: number;
}

export default function DonutChart({ data, unit = "visits", height = 280 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const many = data.length > 6;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      ...tooltipStyle,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${p.value.toLocaleString()} ${unit}</div>
          <div style="color:#71717a">${p.percent.toFixed(1)}%</div>
        </div>`,
    },
    legend: many ? {
      orient: "horizontal",
      bottom: 0,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name);
        const pct = item ? ((item.value / total) * 100).toFixed(1) : "0";
        return `${name} ${pct}%`;
      },
    } : {
      orient: "vertical",
      right: 0,
      top: "middle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name);
        const pct = item ? ((item.value / total) * 100).toFixed(1) : "0";
        return `${name}  ${pct}%`;
      },
    },
    series: [
      {
        type: "pie",
        radius: many ? ["40%", "65%"] : ["52%", "75%"],
        center: many ? ["50%", "40%"] : ["38%", "50%"],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false }, scaleSize: 5 },
        data: data.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color, borderWidth: 0 },
        })),
      },
    ],
  };

  const effectiveHeight = many ? Math.max(height, 380) : height;

  return (
    <ThemedEChart
      option={option}
      style={{ height: `${effectiveHeight}px`, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
