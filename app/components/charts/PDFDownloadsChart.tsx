"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface PDFItem {
  pdf: string;
  category: string;
  downloads: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Publications: "#8b5cf6",
  Presentations: "#3b82f6",
  News: "#f59e0b",
  Workshops: "#10b981",
  Team: "#ec4899",
  "Other PDFs": "#71717a",
};

function extractFilename(path: string): string {
  const cleaned = path.replace(/^\/+/, "");
  const parts = cleaned.split("/");
  const filename = parts[parts.length - 1] ?? path;
  return decodeURIComponent(filename).replace(/\.pdf$/i, "");
}

export default function PDFDownloadsChart({ data }: { data: PDFItem[] }) {
  const top15 = [...data]
    .sort((a, b) => b.downloads - a.downloads)
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
        return `<div style="padding:2px 0;max-width:400px">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px;word-wrap:break-word">${extractFilename(item.pdf)}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} downloads</div>
          <div style="color:#71717a;font-size:12px">Category: ${item.category}</div>
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
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
      },
    },
    yAxis: {
      type: "category",
      data: top15.map((d) => {
        const name = extractFilename(d.pdf);
        return name.length > 40 ? name.slice(0, 37) + "..." : name;
      }),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: top15.map((d) => ({
          value: d.downloads,
          itemStyle: {
            color: CATEGORY_COLORS[d.category] ?? "#71717a",
            borderRadius: [0, 5, 5, 0],
          },
        })),
        barMaxWidth: 24,
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
      style={{ height: "480px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
