"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface NewsItem {
  date: string;
  title: string;
}

export default function CNSNewsByYearChart({ data }: { data: NewsItem[] }) {
  // Aggregate by year
  const yearCounts: Record<string, number> = {};
  for (const d of data) {
    const year = d.date.slice(0, 4);
    yearCounts[year] = (yearCounts[year] ?? 0) + 1;
  }
  const years = Object.keys(yearCounts).sort();
  const counts = years.map((y) => yearCounts[y]);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} article${p.value === 1 ? "" : "s"}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: years,
      ...axisStyle,
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      minInterval: 1,
    },
    series: [
      {
        type: "bar",
        data: counts.map((v) => ({
          value: v,
          itemStyle: {
            color: "#06b6d4",
            borderRadius: [4, 4, 0, 0],
            opacity: 0.85,
          },
        })),
        barMaxWidth: 32,
        label: {
          show: true,
          position: "top",
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => (value > 0 ? `${value}` : ""),
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
