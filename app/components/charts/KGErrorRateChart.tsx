"use client";

import ThemedEChart from "../ThemedEChart";
import { formatMonth, tooltipStyle, axisStyle, TOOL_COLORS } from "../../lib/chartTheme";

interface Row {
  month_year: string;
  visits: number;
  errors: number;
  rate: number;
}

export default function KGErrorRateChart({ data }: { data: Row[] }) {
  const active = data.filter((d) => d.visits > 0);
  const months = active.map((d) => formatMonth(d.month_year));
  const kgColor = TOOL_COLORS["KG Explorer"];
  const lineColor = "#fb923c";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const i = params[0].dataIndex;
        const d = active[i];
        return `<div style="padding:2px 0">
          <div style="font-weight:700;color:#fafafa;margin-bottom:6px">${formatMonth(d.month_year)}</div>
          <div style="color:#a1a1aa;margin:2px 0">Visits: <strong style="color:#fafafa">${d.visits.toLocaleString()}</strong></div>
          <div style="color:#a1a1aa;margin:2px 0">Errors: <strong style="color:#f87171">${d.errors.toLocaleString()}</strong></div>
          <div style="color:#a1a1aa;margin:2px 0">Error rate: <strong style="color:${lineColor};font-size:14px">${d.rate} / 100 visits</strong></div>
        </div>`;
      },
    },
    legend: {
      bottom: 0,
      left: "center",
      data: [
        { name: "Visits", icon: "roundRect" },
        { name: "Errors / 100 visits", icon: "circle" },
      ],
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 16, left: 8, right: 64, bottom: 32, containLabel: true },
    xAxis: {
      type: "category",
      data: months,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: [
      {
        type: "value",
        name: "Visits",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        ...axisStyle,
        axisLabel: {
          color: "#71717a",
          fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${v / 1000}k` : `${v}`,
        },
      },
      {
        type: "value",
        name: "Errors / 100",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        min: 0,
        axisLabel: { color: "#71717a", fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Visits",
        type: "bar",
        color: kgColor,
        yAxisIndex: 0,
        barMaxWidth: 36,
        data: active.map((d) => ({
          value: d.visits,
          itemStyle: { color: kgColor, opacity: 0.65, borderRadius: [3, 3, 0, 0] },
        })),
        emphasis: { itemStyle: { opacity: 0.9 } },
      },
      {
        name: "Errors / 100 visits",
        type: "line",
        color: lineColor,
        yAxisIndex: 1,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { color: lineColor, width: 2.5 },
        itemStyle: { color: lineColor },
        label: {
          show: true,
          position: "top",
          color: lineColor,
          fontSize: 10,
          fontWeight: "bold" as const,
          formatter: (p: { value: number }) => p.value === 0 ? "" : `${p.value}`,
        },
        data: active.map((d) => d.rate),
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "300px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
