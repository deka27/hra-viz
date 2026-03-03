"use client";

import { useState } from "react";
import ThemedEChart from "../ThemedEChart";
import { escapeHtml, toFriendlyError } from "../../lib/errorSemantics";

interface PathRow {
  path: string;
  count: number;
}

interface Props {
  data: Record<string, PathRow[]>;
  eventTotals?: Record<string, number>;
}

const EVENT_TABS = [
  { key: "click",     label: "Clicks",    color: "#3b82f6" },
  { key: "hover",     label: "Hovers",    color: "#8b5cf6" },
  { key: "pageView",  label: "Page Views", color: "#10b981" },
  { key: "keyboard",  label: "Keyboard",  color: "#f59e0b" },
  { key: "error",     label: "Errors",    color: "#991b1b" },
];

const TOOL_COLORS: Record<string, string> = {
  "eui":           "#3b82f6",
  "rui":           "#8b5cf6",
  "cde":           "#f59e0b",
  "ftu":           "#10b981",
  "kg-explorer":   "#f43f5e",
  "humanatlas":    "#71717a",
  "hra":           "#06b6d4",
};

function pathColor(path: string, eventType: string): string {
  if (eventType === "pageView") {
    if (path.includes("kg-explorer"))  return TOOL_COLORS["kg-explorer"];
    if (path.includes("ftu-explorer")) return TOOL_COLORS["ftu"];
    if (path.includes("eui") || path.includes("ccf-eui")) return TOOL_COLORS["eui"];
    if (path.includes("rui") || path.includes("ccf-rui")) return TOOL_COLORS["rui"];
    if (path.includes("cde"))          return TOOL_COLORS["cde"];
    return TOOL_COLORS["humanatlas"];
  }
  if (eventType === "error") {
    // Error bars represent message frequency, not reliable tool attribution.
    return "#991b1b";
  }
  const prefix = path.split(".")[0].toLowerCase();
  return TOOL_COLORS[prefix] ?? "#52525b";
}

const PAGE_LABELS: Record<string, string> = {
  "/":                        "Homepage",
  "/kg-explorer/":            "KG Explorer",
  "/eui/":                    "EUI",
  "/rui/":                    "RUI",
  "/cde/":                    "CDE",
  "/ftu-explorer/":           "FTU Explorer",
  "/3d-reference-library":    "3D Reference Library",
  "/2d-ftu-illustrations":    "2D FTU Illustrations",
  "/api":                     "API docs",
  "/us6":                     "US6 page",
};

function shortPath(path: string, eventType: string): string {
  if (eventType === "pageView") return PAGE_LABELS[path] ?? path;
  if (eventType === "error") {
    const label = toFriendlyError(path).label;
    return label.length > 55 ? `${label.slice(0, 55)}…` : label;
  }
  const parts = path.split(".");
  if (parts.length <= 2) return path;
  return parts.slice(-3).join(" › ");
}

export default function TopPathsByEventChart({ data, eventTotals }: Props) {
  const [active, setActive] = useState("click");

  const rows = (data[active] ?? []).slice(0, 15).reverse();
  const shownCount = rows.reduce((sum, row) => sum + row.count, 0);
  const totalCount = eventTotals?.[active] ?? (data[active] ?? []).reduce((sum, row) => sum + row.count, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      formatter: (params: Array<{ dataIndex: number; value: number }>) => {
        const row = rows[params[0]?.dataIndex ?? 0];
        if (!row) return "";
        if (active === "error") {
          const friendly = toFriendlyError(row.path);
          return `<div>
            <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${row.count.toLocaleString()} error events</div>
            <div style="color:#e4e4e7;font-size:11px;max-width:300px">${escapeHtml(friendly.label)}</div>
            <div style="color:#a1a1aa;font-size:11px;max-width:300px;margin-top:4px">${escapeHtml(friendly.summary)}</div>
            <div style="color:#71717a;font-size:10px;max-width:300px;margin-top:6px;word-break:break-word">Raw: ${escapeHtml(friendly.technical)}</div>
          </div>`;
        }
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${row.count.toLocaleString()} ${active === "pageView" ? "page views" : `${active}s`}</div>
          <div style="color:#a1a1aa;font-size:11px;word-break:break-all;max-width:280px">${escapeHtml(row.path)}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`,
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => shortPath(r.path, active)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10.5 },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: rows.map((r) => ({
          value: r.count,
          itemStyle: {
            color: pathColor(r.path, active),
            borderRadius: [0, 4, 4, 0],
            opacity: 0.85,
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 10,
          formatter: ({ value }: { value: number }) =>
            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`,
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Event type tabs */}
      <div className="flex gap-2 flex-wrap">
        {EVENT_TABS.map((tab) => {
          const isActive = tab.key === active;
          const count = eventTotals?.[tab.key] ?? (data[tab.key]?.reduce((s, r) => s + r.count, 0) ?? 0);
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? "border-transparent text-zinc-900"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
              }`}
              style={isActive ? { backgroundColor: tab.color } : {}}
            >
              {tab.label}
              <span className={`ml-1.5 ${isActive ? "opacity-70" : "opacity-50"}`}>
                {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ThemedEChart
        key={active}
        option={option}
        style={{ height: "420px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />

      <p className="text-xs text-zinc-500">
        Showing top {rows.length} paths/messages covering {shownCount.toLocaleString()} of {totalCount.toLocaleString()} {active} events.
      </p>

      {/* Color legend */}
      {active === "error" ? (
        <p className="text-xs text-zinc-500">
          Error bars are grouped by message frequency and shown in a single color. Tool/source attribution is shown in the
          &ldquo;Where Do the Errors Come From?&rdquo; chart.
        </p>
      ) : (
        <div className="flex gap-4 flex-wrap text-xs text-zinc-500">
          {Object.entries(TOOL_COLORS).map(([prefix, c]) => (
            <span key={prefix} className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              {prefix === "humanatlas" ? "Portal" : prefix === "hra" ? "HRA Pop" : prefix.toUpperCase().replace("-EXPLORER", " Explorer")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
