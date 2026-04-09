"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle } from "../../lib/chartTheme";
import { useMemo } from "react";

interface CategoryRow {
  category: string;
  count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Scanner/Attack Probes (404)": "#f43f5e",
  "Scanner-Triggered Server Errors (500)": "#e11d48",
  "Homepage Server Errors (500)": "#dc2626",
  "Other Server Errors (500)": "#b91c1c",
  "Missing PDFs (404)": "#f59e0b",
  "Moved Workshop/Event Pages (404)": "#d97706",
  "Missing Images (404)": "#eab308",
  "Missing Documents (404)": "#ca8a04",
  "Other Broken Links (404)": "#a16207",
  "Access Denied (403)": "#8b5cf6",
  "Other HTTP Errors": "#71717a",
};

function getColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#71717a";
}

export default function CNSErrorCategoryChart({ data }: { data: CategoryRow[] }) {
  // Aggregate by category (multiple status rows may share a category)
  const aggregated = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      map.set(d.category, (map.get(d.category) ?? 0) + d.count);
    });
    return [...map.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.count - b.count);
  }, [data]);

  const total = aggregated.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...aggregated.map((d) => d.count));

  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 80, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "none" as const },
      ...tooltipStyle,
      textStyle: { color: "#fafafa", fontSize: 12 },
      extraCssText:
        "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const d = aggregated.find((s) => s.category === p[0].name);
        if (!d) return "";
        const pct = ((d.count / total) * 100).toFixed(1);
        return `<span style="color:#a1a1aa">${d.category}</span><br/>
          <strong>${d.count.toLocaleString()} errors (${pct}%)</strong>`;
      },
    },
    xAxis: { type: "value" as const, show: false, max: maxCount * 1.18 },
    yAxis: {
      type: "category" as const,
      data: aggregated.map((d) => d.category),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 10,
        width: 220,
        overflow: "truncate" as const,
      },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: aggregated.map((d) => ({
          value: d.count,
          itemStyle: {
            color: getColor(d.category),
            opacity: 0.85,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right" as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => {
            const pct = ((p.value / total) * 100).toFixed(0);
            return `${Number(p.value).toLocaleString()} (${pct}%)`;
          },
          color: "#71717a",
          fontSize: 10,
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "400px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
