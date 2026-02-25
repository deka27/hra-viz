"use client";

import dynamic from "next/dynamic";
import { axisStyle, tooltipStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export interface ErrorClusterRow {
  cluster_id: number;
  label: string;
  count: number;
  pct: number;
  top_terms: string[];
  sample_error: string;
}

export default function MLErrorClustersChart({ data }: { data: ErrorClusterRow[] }) {
  const top = [...data].sort((a, b) => b.count - a.count);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const idx = params[0]?.dataIndex ?? 0;
        const row = top[idx];
        if (!row) return "";
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${row.label} · ${row.pct.toFixed(1)}%</div>
          <div style="color:#a1a1aa;margin-bottom:6px">${row.count.toLocaleString()} error events</div>
          <div style="color:#71717a;font-size:11px;margin-top:4px;max-width:300px">${row.sample_error !== "nan" ? row.sample_error : "No sample message captured"}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11, formatter: (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`) },
    },
    yAxis: {
      type: "category",
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
      data: top.map((d) => d.label ?? `Cluster ${d.cluster_id}`),
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 22,
        data: top.map((d, idx) => ({
          value: d.count,
          itemStyle: {
            color: idx === 0 ? "#ef4444" : idx < 3 ? "#f97316" : "#52525b",
            borderRadius: [0, 4, 4, 0],
            opacity: 0.9,
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 10,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "320px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}
