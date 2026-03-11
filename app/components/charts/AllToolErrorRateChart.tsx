"use client";

import ThemedEChart from "../ThemedEChart";
import { formatMonth, tooltipStyle, axisStyle, TOOL_COLORS } from "../../lib/chartTheme";

interface Row {
  month_year: string;
  CDE: number | null;
  EUI: number | null;
  "FTU Explorer": number | null;
  "KG Explorer": number | null;
  RUI: number | null;
}

const TOOLS = ["EUI", "KG Explorer", "CDE", "RUI"] as const;

export default function AllToolErrorRateChart({ data }: { data: Row[] }) {
  // Only show months where at least one tool has errors (Oct 2025+)
  const active = data.filter((d) => d.month_year >= "2025-10");
  const months = active.map((d) => formatMonth(d.month_year));

  const series = TOOLS.map((tool) => ({
    name: tool,
    type: "line",
    color: TOOL_COLORS[tool],
    smooth: 0.3,
    symbol: "circle",
    symbolSize: 6,
    lineStyle: { color: TOOL_COLORS[tool], width: 2.5 },
    itemStyle: { color: TOOL_COLORS[tool] },
    connectNulls: false,
    label: {
      show: false,
    },
    data: active.map((d) => {
      const v = d[tool as keyof Row] as number | null;
      return v == null ? null : v;
    }),
  }));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      formatter: (params: Array<{ seriesName: string; value: number | null; color: string; dataIndex: number }>) => {
        const idx = params[0]?.dataIndex ?? 0;
        const row = active[idx];
        const header = `<div style="font-weight:700;color:#fafafa;margin-bottom:6px">${formatMonth(row?.month_year ?? "")}</div>`;
        const lines = params
          .filter((p) => p.value !== null && p.value !== undefined)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .map(
            (p) =>
              `<div style="color:#a1a1aa;margin:2px 0"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px;"></span>${p.seriesName}: <strong style="color:#fafafa">${p.value?.toFixed(1)}</strong></div>`
          )
          .join("");
        return `<div style="padding:2px 0">${header}${lines}<div style="color:#71717a;font-size:10px;margin-top:4px">errors per 100 visits</div></div>`;
      },
    },
    legend: {
      bottom: 0,
      left: "center",
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 16, left: 8, right: 24, bottom: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: months,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      name: "Errors / 100 visits",
      nameTextStyle: { color: "#71717a", fontSize: 10 },
      min: 0,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 10 },
    },
    series,
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "300px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
