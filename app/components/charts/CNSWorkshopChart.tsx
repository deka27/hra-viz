"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface WorkshopItem {
  page: string;
  visits: number;
}

function shortLabel(page: string): string {
  const cleaned = page.replace(/^\/workshops\/event\//, "").replace(/\.html$/, "");
  if (cleaned === "/workshops" || page === "/workshops.html") return "workshops (index)";
  if (page === "/events_calendar.html") return "events_calendar";
  return cleaned.length > 35 ? cleaned.slice(0, 32) + "..." : cleaned;
}

export default function CNSWorkshopChart({ data }: { data: WorkshopItem[] }) {
  const top15 = [...data]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 15)
    .reverse();

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        const item = top15[p.dataIndex];
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px;word-wrap:break-word">${item.page}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} visits</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
      },
    },
    yAxis: {
      type: "category",
      data: top15.map((d) => shortLabel(d.page)),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: top15.map((d) => ({
          value: d.visits,
          itemStyle: {
            color: "#10b981",
            borderRadius: [0, 5, 5, 0],
            opacity: 0.85,
          },
        })),
        barMaxWidth: 22,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "420px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
