"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS } from "../../lib/chartTheme";


const TOOLS = ["EUI", "FTU Explorer", "RUI", "CDE", "KG Explorer"] as const;
const DAYS_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Row {
  dow_num: number;
  day_name: string;
  tool: string;
  visits: number;
}

export default function TrafficByDowChart({ data }: { data: Row[] }) {
  // Build a map: day_name → { tool → visits }
  const map: Record<string, Record<string, number>> = {};
  for (const row of data) {
    if (!map[row.day_name]) map[row.day_name] = {};
    map[row.day_name][row.tool] = row.visits;
  }

  const series = TOOLS.map((tool) => ({
    name: tool,
    type: "bar",
    stack: "total",
    barMaxWidth: 44,
    itemStyle: { color: TOOL_COLORS[tool], opacity: 0.88 },
    label: { show: false },
    data: DAYS_ORDER.map((day) => map[day]?.[tool] ?? 0),
    emphasis: { focus: "series" as const },
  }));

  const dayTotals = DAYS_ORDER.map((day) =>
    TOOLS.reduce((s, t) => s + (map[day]?.[t] ?? 0), 0)
  );

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const day = params[0].axisValueLabel;
        const rows = params
          .filter((p) => p.value > 0)
          .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
          .map(
            (p: { seriesName: string; value: number; color: string }) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
                <span style="display:flex;align-items:center;gap:6px;color:#a1a1aa">
                  <span style="width:7px;height:7px;border-radius:50%;background:${p.color};display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${(p.value as number).toLocaleString()}</span>
              </div>`
          )
          .join("");
        const total = params.reduce((s: number, p: { value: number }) => s + p.value, 0);
        return `<div style="font-weight:700;margin-bottom:6px">${day} · ${total.toLocaleString()} visits</div>${rows}`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      data: TOOLS as unknown as string[],
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 28, left: 8, right: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: DAYS_SHORT,
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`,
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      ...series,
      // Invisible bar for total label on top
      {
        name: "total_label",
        type: "bar",
        stack: "total",
        barMaxWidth: 44,
        itemStyle: { color: "transparent" },
        label: {
          show: true,
          position: "top" as const,
          color: "#71717a",
          fontSize: 9,
          formatter: (params: { dataIndex: number }) => {
            const total = dayTotals[params.dataIndex] ?? 0;
            return total >= 1000 ? `${(total / 1000).toFixed(1)}K` : `${total}`;
          },
        },
        data: dayTotals.map(() => 0),
        tooltip: { show: false },
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
