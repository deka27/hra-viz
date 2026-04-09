"use client";

import ThemedEChart from "../ThemedEChart";
import { tooltipStyle } from "../../lib/chartTheme";

interface SourceBucketRow {
  source: string;
  bucket: string;
  errors: number;
}

interface SourceRow {
  source: string;
  errors: number;
}

interface BucketRow {
  bucket: string;
  errors: number;
}

interface BreakdownData {
  by_source_bucket: SourceBucketRow[];
  by_source: SourceRow[];
  by_bucket: BucketRow[];
}

const BUCKET_COLORS: Record<string, string> = {
  "Net/CORS: technology list API": "#7f1d1d",
  "Icon retrieval failures": "#be123c",
  "Null selection read": "#2563eb",
  "Unreadable structured error object": "#7c3aed",
  "Content file fetch failures": "#d97706",
  "Local development request noise": "#0f766e",
  "Other": "#52525b",
};

const TOOLTIP = {
  ...tooltipStyle,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

function fmt(n: number): string {
  return n.toLocaleString();
}

function buildMatrix(data: BreakdownData) {
  const sources = [...data.by_source].sort((a, b) => b.errors - a.errors).map((d) => d.source);
  const buckets = [...data.by_bucket].sort((a, b) => b.errors - a.errors).map((d) => d.bucket);

  const matrix: Record<string, Record<string, number>> = {};
  for (const source of sources) matrix[source] = {};
  for (const row of data.by_source_bucket) {
    if (!matrix[row.source]) matrix[row.source] = {};
    matrix[row.source][row.bucket] = row.errors;
  }

  return { sources, buckets, matrix };
}

export function ErrorBucketBySourceChart({ data }: { data: BreakdownData }) {
  const { sources, buckets, matrix } = buildMatrix(data);
  const totalsBySource = Object.fromEntries(data.by_source.map((d) => [d.source, d.errors]));
  const maxErrors = Math.max(...data.by_source.map((d) => d.errors), 0);

  const series = buckets.map((bucket) => ({
    name: bucket,
    type: "bar",
    stack: "errors",
    barWidth: 20,
    itemStyle: { color: BUCKET_COLORS[bucket] ?? "#52525b", opacity: 0.9 },
    data: sources.map((source) => matrix[source]?.[bucket] ?? 0),
  }));

  const option = {
    backgroundColor: "transparent",
    legend: {
      type: "scroll",
      top: 0,
      textStyle: { color: "#a1a1aa", fontSize: 10 },
      itemWidth: 10,
      itemHeight: 8,
    },
    grid: { top: 48, left: 4, right: 14, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const source = params[0]?.axisValue as string;
        const total = totalsBySource[source] ?? 0;
        const rows = params
          .map((p) => ({
            seriesName: p.seriesName as string,
            errors: matrix[source]?.[p.seriesName] ?? 0,
          }))
          .filter((p) => p.errors > 0)
          .sort((a, b) => b.errors - a.errors)
          .map(
            (p) =>
              `<div style="display:flex;justify-content:space-between;gap:14px;margin:2px 0">
                <span style="color:#a1a1aa">${p.seriesName}</span>
                <span style="color:#fafafa;font-weight:600">${fmt(p.errors)}</span>
              </div>`
          )
          .join("");
        return `<div style="font-weight:700;margin-bottom:6px">${source} · ${fmt(total)} total</div>${rows}`;
      },
    },
    xAxis: {
      type: "value",
      max: maxErrors * 1.1,
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: sources,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 11,
        formatter: (value: string) => `${value} (${fmt(totalsBySource[value] ?? 0)})`,
      },
    },
    series,
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "420px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}

export function PortalErrorBucketChart({ data }: { data: BreakdownData }) {
  const { buckets, matrix } = buildMatrix(data);
  const source = "Portal/Other";
  const rows = buckets
    .map((bucket) => ({ bucket, errors: matrix[source]?.[bucket] ?? 0 }))
    .filter((d) => d.errors > 0)
    .sort((a, b) => b.errors - a.errors);

  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 58, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const v = Number(p[0]?.value ?? 0);
        return `<span style="color:#a1a1aa">${p[0]?.name ?? ""}</span><br/><strong>${fmt(v)} errors</strong>`;
      },
    },
    xAxis: {
      type: "value",
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: rows.map((d) => d.bucket),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 10,
        width: 180,
        overflow: "truncate" as const,
      },
    },
    series: [
      {
        type: "bar",
        barWidth: 18,
        data: rows.map((d) => ({
          value: d.errors,
          itemStyle: {
            color: BUCKET_COLORS[d.bucket] ?? "#52525b",
            opacity: 0.9,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          formatter: ({ value }: { value: number }) => fmt(value),
          color: "#71717a",
          fontSize: 10,
        },
      },
    ],
  };

  return (
    <ThemedEChart
      option={option}
      style={{ height: "340px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
