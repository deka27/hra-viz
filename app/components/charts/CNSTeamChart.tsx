"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface TeamItem {
  member: string;
  visits: number;
}


function formatMember(raw: string): string {
  // Handle paths like "/current_team/bio/katy_borner.html"
  if (raw.startsWith("/")) {
    const parts = raw.split("/");
    const last = parts[parts.length - 1] ?? raw;
    return last.replace(/\.html$/, "").replace(/_/g, " ");
  }
  // Handle slugs like "michael-ginda", "KatyBorner_weblrg"
  return raw
    .replace(/_weblrg$/i, "")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CNSTeamChart({ data }: { data: TeamItem[] }) {
  const top20 = [...data]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 20)
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
        const item = top20[p.dataIndex];
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${formatMember(item.member)}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} views</div>
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
      data: top20.map((d) => {
        const name = formatMember(d.member);
        return name.length > 30 ? name.slice(0, 27) + "..." : name;
      }),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: top20.map((d) => ({
          value: d.visits,
          itemStyle: {
            color: "#ec4899",
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
      style={{ height: "520px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
