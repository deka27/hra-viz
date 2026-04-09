"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface YearRow {
  year: string;
  human: number;
  bot: number;
  ai_bot: number;
  total: number;
}

export default function CNSYearlyChart({ data }: { data: YearRow[] }) {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (params: { name: string; value: number; color: string; seriesName: string }[]) => {
        const year = params[0]?.name ?? "";
        const rows = params
          .filter((p) => p.value > 0)
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
                <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                  <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()}</span>
              </div>`
          )
          .join("");
        return `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${year}</div>${rows}</div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      borderRadius: 2,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => d.year),
      ...axisStyle,
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
      },
    },
    series: [
      {
        name: "Human",
        type: "bar",
        stack: "traffic",
        data: data.map((d) => d.human),
        itemStyle: { color: "#3b82f6", borderRadius: [0, 0, 0, 0] },
        barMaxWidth: 40,
      },
      {
        name: "Bot",
        type: "bar",
        stack: "traffic",
        data: data.map((d) => d.bot),
        itemStyle: { color: "#f43f5e" },
        barMaxWidth: 40,
      },
      {
        name: "AI Bot",
        type: "bar",
        stack: "traffic",
        data: data.map((d) => d.ai_bot),
        itemStyle: { color: "#f59e0b", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "340px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
