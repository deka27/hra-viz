"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS, TOOLS, axisStyle, tooltipStyle, formatMonth, multiTooltip } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface MonthData {
  month_year: string;
  CDE: number;
  EUI: number;
  "FTU Explorer": number;
  "KG Explorer": number;
  RUI: number;
}

export default function MonthlyTrendsChart({ data }: { data: MonthData[] }) {
  const months = data.map((d) => formatMonth(d.month_year));

  const series = TOOLS.map((tool) => {
    const color = TOOL_COLORS[tool];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s: Record<string, any> = {
      name: tool,
      type: "line",
      smooth: 0.4,
      data: data.map((d) => d[tool as keyof MonthData] as number),
      lineStyle: { width: 2.5, color },
      itemStyle: { color },
      symbolSize: 5,
      symbol: "circle",
      showSymbol: false,
      emphasis: { focus: "series", showSymbol: true },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + "28" },
            { offset: 1, color: color + "00" },
          ],
        },
      },
    };

    if (tool === "EUI") {
      s.markArea = {
        silent: true,
        data: [
          [
            {
              xAxis: "Mar '24",
              itemStyle: { color: "rgba(248,113,113,0.06)", borderColor: "rgba(248,113,113,0.25)", borderWidth: 1 },
              label: { show: true, position: "insideTopRight", formatter: "Probably\nHuBMAP training", color: "#f87171", fontSize: 10, lineHeight: 14 },
            },
            { xAxis: "Apr '24" },
          ],
          [
            {
              xAxis: "Oct '24",
              itemStyle: { color: "rgba(251,191,36,0.05)", borderColor: "rgba(251,191,36,0.2)", borderWidth: 1 },
              label: { show: true, position: "insideTopRight", formatter: "Powers\nof Ten", color: "#fbbf24", fontSize: 10, lineHeight: 14 },
            },
            { xAxis: "Nov '24" },
          ],
          [
            {
              xAxis: "Apr '25",
              itemStyle: { color: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)", borderWidth: 1 },
              label: { show: true, position: "insideTopRight", formatter: "Probably\nHuBMAP WG", color: "#34d399", fontSize: 10, lineHeight: 14 },
            },
            { xAxis: "May '25" },
          ],
        ],
      };
    }

    if (tool === "KG Explorer") {
      s.markLine = {
        silent: true,
        symbol: ["none", "none"],
        data: [
          {
            xAxis: "Aug '25",
            lineStyle: { color: "#f43f5e", type: "dashed", width: 1.5 },
            label: {
              show: true,
              formatter: "KG Launch",
              color: "#f43f5e",
              fontSize: 10,
              position: "insideEndTop",
            },
          },
        ],
      };
    }

    return s;
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      formatter: multiTooltip,
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 16,
      itemHeight: 4,
      borderRadius: 2,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 56, containLabel: true },
    xAxis: {
      type: "category",
      data: months,
      boundaryGap: false,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 10, interval: 2, rotate: 30 },
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
    dataZoom: [
      {
        type: "slider",
        bottom: 0,
        height: 20,
        borderColor: "#3f3f46",
        backgroundColor: "#18181b",
        fillerColor: "rgba(59,130,246,0.12)",
        handleStyle: { color: "#3b82f6", borderColor: "#3b82f6" },
        moveHandleStyle: { color: "#3b82f6" },
        textStyle: { color: "#71717a", fontSize: 9 },
        brushSelect: false,
      },
      { type: "inside" },
    ],
    series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "420px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
