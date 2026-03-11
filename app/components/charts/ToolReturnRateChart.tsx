"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS, TOOLS, formatMonth, tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface Row {
  month_year: string;
  tool: string;
  users: number;
  returning: number;
  return_pct: number;
}

export default function ToolReturnRateChart({ data }: { data: Row[] }) {
  // Only show H2 2025 onward for meaningful trend
  const filtered = data.filter((d) => d.month_year >= "2025-07");
  const months = [...new Set(filtered.map((d) => d.month_year))].sort();
  const monthLabels = months.map(formatMonth);

  const series = TOOLS.map((tool) => {
    const color = TOOL_COLORS[tool];
    const byMonth = Object.fromEntries(
      filtered.filter((d) => d.tool === tool).map((d) => [d.month_year, d.return_pct])
    );
    return {
      name: tool,
      type: "line",
      smooth: 0.3,
      symbol: "circle",
      symbolSize: 5,
      showSymbol: true,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      emphasis: { focus: "series" },
      connectNulls: false,
      data: months.map((m) => byMonth[m] ?? null),
    };
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      formatter: (params: Array<{ color: string; seriesName: string; value: number | null; axisValue: string }>) => {
        const month = params[0]?.axisValue ?? "";
        const rows = params
          .filter((p) => p.value != null && p.value > 0)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
                <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                  <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${p.value?.toFixed(1)}%</span>
              </div>`
          )
          .join("");
        return `<div style="padding:4px 2px">
          <div style="font-weight:600;color:#fafafa;margin-bottom:8px">${month}</div>
          ${rows}
        </div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 16,
      itemHeight: 4,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: monthLabels,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      min: 0,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => `${v}%`,
      },
    },
    series,
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
