"use client";

import { useTheme } from "next-themes";

export const TOOL_COLORS: Record<string, string> = {
  "KG Explorer": "#f43f5e",
  "EUI": "#3b82f6",
  "RUI": "#8b5cf6",
  "CDE": "#f59e0b",
  "FTU Explorer": "#10b981",
};

export const TOOLS = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"] as const;
export type Tool = (typeof TOOLS)[number];

// ── Static dark-only objects (legacy, kept for back-compat) ───────────────
export const tooltipStyle = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 13 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;",
};

export const axisStyle = {
  axisLine: { lineStyle: { color: "#3f3f46" } },
  axisLabel: { color: "#71717a", fontSize: 11 },
  splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
  axisTick: { show: false },
};

// ── Theme-aware palettes ───────────────────────────────────────────────────
export interface ChartTheme {
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    textStyle: { color: string; fontSize: number };
    extraCssText: string;
  };
  axis: {
    axisLine: { lineStyle: { color: string } };
    axisLabel: { color: string; fontSize: number };
    splitLine: { lineStyle: { color: string; type: "dashed" } };
    axisTick: { show: boolean };
  };
  labelColor: string;
  mutedColor: string;
  strongColor: string;
  isDark: boolean;
}

const darkTheme: ChartTheme = {
  tooltip: {
    backgroundColor: "#18181b",
    borderColor: "#3f3f46",
    borderWidth: 1,
    textStyle: { color: "#fafafa", fontSize: 13 },
    extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;",
  },
  axis: {
    axisLine: { lineStyle: { color: "#3f3f46" } },
    axisLabel: { color: "#71717a", fontSize: 11 },
    splitLine: { lineStyle: { color: "#27272a", type: "dashed" } },
    axisTick: { show: false },
  },
  labelColor: "#d4d4d8",
  mutedColor: "#71717a",
  strongColor: "#fafafa",
  isDark: true,
};

const lightTheme: ChartTheme = {
  tooltip: {
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderWidth: 1,
    textStyle: { color: "#18181b", fontSize: 13 },
    extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.12);border-radius:8px;",
  },
  axis: {
    axisLine: { lineStyle: { color: "#d4d4d8" } },
    axisLabel: { color: "#71717a", fontSize: 11 },
    splitLine: { lineStyle: { color: "#e4e4e7", type: "dashed" } },
    axisTick: { show: false },
  },
  labelColor: "#3f3f46",
  mutedColor: "#71717a",
  strongColor: "#18181b",
  isDark: false,
};

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? darkTheme : lightTheme;
}

// ── Tooltip HTML helpers ───────────────────────────────────────────────────
export function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
}

export function multiTooltip(
  params: { color: string; seriesName: string; value: number; axisValue?: string }[],
  textColor = "#fafafa",
  mutedColor = "#a1a1aa",
) {
  const month = params[0]?.axisValue ?? "";
  const rows = [...params]
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(
      (p) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
          <span style="display:flex;align-items:center;gap:7px;color:${mutedColor}">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
            ${p.seriesName}
          </span>
          <span style="font-weight:600;color:${textColor}">${Number(p.value).toLocaleString()}</span>
        </div>`
    )
    .join("");
  return `<div style="padding:4px 2px"><div style="font-weight:600;color:${textColor};margin-bottom:8px;font-size:13px">${month}</div>${rows}</div>`;
}
