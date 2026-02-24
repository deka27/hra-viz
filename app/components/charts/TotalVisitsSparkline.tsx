"use client";

import dynamic from "next/dynamic";
import { formatMonth, tooltipStyle, axisStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface MonthData {
  month_year: string;
  CDE: number;
  EUI: number;
  "FTU Explorer": number;
  "KG Explorer": number;
  RUI: number;
}

export default function TotalVisitsSparkline({ data }: { data: MonthData[] }) {
  const months = data.map((d) => formatMonth(d.month_year));
  const totals = data.map((d) => d.CDE + d.EUI + d["FTU Explorer"] + d["KG Explorer"] + d.RUI);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      formatter: (params: { axisValue: string; value: number }[]) => {
        const p = params[0];
        return `<div style="padding:2px 0"><div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.axisValue}</div><div style="color:#a1a1aa">${Number(p.value).toLocaleString()} total visits</div></div>`;
      },
    },
    grid: { top: 8, left: 8, right: 8, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: months,
      boundaryGap: false,
      ...axisStyle,
      axisLabel: { color: "#52525b", fontSize: 10, interval: 3 },
    },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#52525b",
        fontSize: 10,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
    },
    series: [
      {
        type: "line",
        data: totals,
        smooth: 0.4,
        symbol: "none",
        lineStyle: { width: 2, color: "#3b82f6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59,130,246,0.25)" },
              { offset: 1, color: "rgba(59,130,246,0.02)" },
            ],
          },
        },
        markPoint: {
          symbol: "pin",
          symbolSize: 28,
          data: [
            {
              coord: ["Mar '24", Math.max(...totals)],
              label: { show: true, formatter: "Workshop", color: "#f87171", fontSize: 9 },
              itemStyle: { color: "#f87171" },
            },
          ],
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "160px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
