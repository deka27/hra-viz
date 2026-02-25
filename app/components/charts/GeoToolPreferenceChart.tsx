"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", HK: "Hong Kong", SG: "Singapore", JP: "Japan",
  CN: "China", IE: "Ireland", KR: "South Korea", DE: "Germany",
  EC: "Ecuador", GB: "United Kingdom", NL: "Netherlands", IN: "India",
  CA: "Canada", IR: "Iran", FR: "France", AT: "Austria", BR: "Brazil",
  BG: "Bulgaria", FI: "Finland", CH: "Switzerland", AU: "Australia",
  HU: "Hungary", ES: "Spain", SE: "Sweden", RU: "Russia", SC: "Seychelles",
  MX: "Mexico", VN: "Vietnam", PL: "Poland", IT: "Italy",
};

const TOOLS = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"] as const;

interface Row {
  c_country: string;
  EUI: number;
  RUI: number;
  CDE: number;
  "FTU Explorer": number;
  "KG Explorer": number;
  total: number;
}

export default function GeoToolPreferenceChart({ data }: { data: Row[] }) {
  // Sort ascending by total so highest is at top of horizontal bar
  const sorted = [...data].sort((a, b) => a.total - b.total);
  const countryLabels = sorted.map((d) => COUNTRY_NAMES[d.c_country] ?? d.c_country);

  // Build one series per tool with percentage values
  const series = TOOLS.map((tool) => ({
    name: tool,
    type: "bar",
    stack: "total",
    barMaxWidth: 28,
    emphasis: { focus: "series" },
    itemStyle: { color: TOOL_COLORS[tool], opacity: 0.88 },
    label: {
      show: true,
      formatter: (p: { value: number }) =>
        p.value >= 12 ? `${Math.round(p.value)}%` : "",
      color: "#fff",
      fontSize: 9,
      fontWeight: "bold" as const,
    },
    data: sorted.map((d) => {
      const pct = (d[tool as keyof Row] as number) / d.total * 100;
      return {
        value: parseFloat(pct.toFixed(1)),
        // keep raw count for tooltip
        raw: d[tool as keyof Row] as number,
      };
    }),
  }));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const idx = params[0].dataIndex;
        const d = sorted[idx];
        const name = COUNTRY_NAMES[d.c_country] ?? d.c_country;
        const rows = TOOLS
          .map((tool) => {
            const visits = d[tool as keyof Row] as number;
            const pct = ((visits / d.total) * 100).toFixed(1);
            return { tool, visits, pct };
          })
          .filter((r) => r.visits > 0)
          .sort((a, b) => b.visits - a.visits)
          .map(
            (r) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
                <span style="display:flex;align-items:center;gap:6px;color:#a1a1aa">
                  <span style="width:7px;height:7px;border-radius:50%;background:${TOOL_COLORS[r.tool]};display:inline-block"></span>
                  ${r.tool}
                </span>
                <span style="font-weight:600;color:#fafafa">${r.visits.toLocaleString()} <span style="color:#71717a;font-weight:400">(${r.pct}%)</span></span>
              </div>`
          )
          .join("");
        return `<div style="font-weight:700;margin-bottom:6px">${name} · ${d.total.toLocaleString()} visits</div>${rows}`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      data: TOOLS as unknown as string[],
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 28, left: 8, right: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      max: 100,
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: countryLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10.5 },
    },
    series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "600px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
