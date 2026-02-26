"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS, TOOLS, axisStyle, tooltipStyle } from "../../lib/chartTheme";


interface YearData {
  year: number;
  CDE: number;
  EUI: number;
  "FTU Explorer": number;
  "KG Explorer": number;
  RUI: number;
}

export default function YearlyGroupedBar({ data }: { data: YearData[] }) {
  const years = data.map((d) => String(d.year));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const year = params[0]?.axisValue;
        const rows = params
          .filter((p) => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
                <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                  <span style="width:8px;height:8px;border-radius:2px;background:${p.color};display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()}</span>
              </div>`
          )
          .join("");
        return `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px">${year}</div>${rows}</div>`;
      },
    },
    legend: {
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      borderRadius: 2,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
    },
    grid: { top: 12, left: 8, right: 8, bottom: 52, containLabel: true },
    xAxis: {
      type: "category",
      data: years,
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 12, fontWeight: 500 },
    },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
    },
    series: TOOLS.map((tool) => ({
      name: tool,
      type: "bar",
      data: data.map((d) => d[tool as keyof YearData] as number),
      itemStyle: {
        color: TOOL_COLORS[tool],
        borderRadius: [3, 3, 0, 0],
      },
      emphasis: { itemStyle: { opacity: 0.85 } },
      barMaxWidth: 20,
    })),
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "320px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
