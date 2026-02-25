"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS, axisStyle, tooltipStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export interface ForecastRow {
  month: string;
  tool: string;
  predicted: number;
  lower: number;
  upper: number;
  method: string;
}

const TOOL_ORDER = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"];

function formatForecastMonth(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = Number.parseInt(m, 10) - 1;
  return `${months[idx]} '${year.slice(2)}`;
}

export default function MLForecastChart({ data }: { data: ForecastRow[] }) {
  const months = Array.from(new Set(data.map((d) => d.month))).sort();
  const tools = TOOL_ORDER.filter((t) => data.some((d) => d.tool === t));
  const map = new Map(data.map((d) => [`${d.tool}|${d.month}`, d] as const));

  const series = tools.map((tool) => ({
    name: tool,
    type: "line",
    smooth: 0.35,
    symbol: "circle",
    symbolSize: 7,
    lineStyle: { width: 2.5, color: TOOL_COLORS[tool] ?? "#3b82f6" },
    itemStyle: { color: TOOL_COLORS[tool] ?? "#3b82f6" },
    data: months.map((month) => {
      const row = map.get(`${tool}|${month}`);
      return row ? row.predicted : 0;
    }),
  }));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "line" },
      formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string }>) => {
        const month = params[0]?.axisValue ?? "";
        const rows = params
          .sort((a, b) => Number(b.value) - Number(a.value))
          .map((p) => {
            const record = map.get(`${p.seriesName}|${month}`);
            const lo = record?.lower ?? 0;
            const hi = record?.upper ?? 0;
            return `<div style="display:flex;justify-content:space-between;gap:16px;margin:3px 0">
              <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                <span style="width:8px;height:8px;border-radius:50%;display:inline-block;background:${p.color}"></span>${p.seriesName}
              </span>
              <span style="color:#fafafa;font-weight:600">${Number(p.value).toLocaleString()}</span>
              <span style="color:#71717a;font-size:11px">[${lo.toLocaleString()} - ${hi.toLocaleString()}]</span>
            </div>`;
          })
          .join("");
        return `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px">${formatForecastMonth(month)}</div>${rows}</div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 16,
      itemHeight: 4,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
    },
    grid: { top: 36, left: 8, right: 8, bottom: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: months,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: string) => formatForecastMonth(v),
      },
    },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`),
      },
    },
    series,
  };

  return <ReactECharts option={option} style={{ height: "360px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}
