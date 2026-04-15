"use client";

import { useCallback } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface PDFItem {
  pdf: string;
  category: string;
  downloads: number;
  title?: string;
  doi?: string;
  authors?: string[];
  pub_date?: string;
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

function displayLabel(item: PDFItem): string {
  return item.title ?? extractFilename(item.pdf);
}

function getUrl(item: PDFItem): string {
  if (item.doi) {
    return item.doi.startsWith("http") ? item.doi : `https://doi.org/${item.doi}`;
  }
  // Fallback: open the PDF directly on cns.iu.edu
  return `https://cns.iu.edu${item.pdf}`;
}

export default function PDFDownloadsChart({ data }: { data: PDFItem[] }) {
  const top15 = [...data]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 15)
    .reverse();

  const handleClick = useCallback((params: { dataIndex?: number }) => {
    if (params.dataIndex == null) return;
    const item = top15[params.dataIndex];
    const url = getUrl(item);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [top15]);

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
        const label = displayLabel(item);
        const filename = extractFilename(item.pdf);
        const authorLine = item.authors && item.authors.length > 0
          ? `<div style="color:#71717a;font-size:11px;margin-top:2px">${item.authors.join(", ")}${item.pub_date ? ` — ${item.pub_date.slice(0,4)}` : ""}</div>`
          : "";
        const filenameLine = item.title
          ? `<div style="color:#52525b;font-size:10px;font-family:monospace;margin-top:4px">${filename}</div>`
          : "";
        const openHint = item.doi
          ? `<div style="color:#a78bfa;font-size:10px;margin-top:6px;font-weight:500">→ Click to open via DOI</div>`
          : `<div style="color:#71717a;font-size:10px;margin-top:6px">→ Click to view PDF on cns.iu.edu</div>`;
        return `<div style="padding:2px 0;max-width:440px">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px;word-wrap:break-word;white-space:normal">${label}</div>
          ${authorLine}
          <div style="color:#a1a1aa;margin-top:4px">${Number(p.value).toLocaleString()} downloads</div>
          <div style="color:#71717a;font-size:12px">Category: ${item.category}</div>
          ${filenameLine}
          ${openHint}
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
        const name = displayLabel(d);
        return name.length > 50 ? name.slice(0, 47) + "..." : name;
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
      style={{ height: "480px", width: "100%", cursor: "pointer" }}
      opts={{ renderer: "canvas" }}
      onEvents={{ click: handleClick }}
    />
  );
}
