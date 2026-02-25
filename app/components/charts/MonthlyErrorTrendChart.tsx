"use client";

import dynamic from "next/dynamic";
import { TOOL_COLORS } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLS = ["KG Explorer", "EUI", "FTU Explorer", "CDE", "RUI"] as const;

interface ByTool {
  month_year: string;
  tool: string;
  errors: number;
}
interface ByMonth {
  month_year: string;
  total_errors: number;
}

function fmtMonth(ym: string): string {
  const [y, mo] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} '${y.slice(2)}`;
}

export default function MonthlyErrorTrendChart({
  data,
}: {
  data: { by_tool: ByTool[]; by_month: ByMonth[] };
}) {
  const months = data.by_month.map((d) => d.month_year);
  const monthLabels = months.map(fmtMonth);

  // Build map: month → tool → errors
  const map: Record<string, Record<string, number>> = {};
  for (const row of data.by_tool) {
    if (!map[row.month_year]) map[row.month_year] = {};
    if (row.tool !== "Unknown") {
      map[row.month_year][row.tool] = (map[row.month_year][row.tool] ?? 0) + row.errors;
    }
  }
  // "Unknown/Portal" = total - known tools
  for (const m of months) {
    const total = data.by_month.find((d) => d.month_year === m)?.total_errors ?? 0;
    const known = TOOLS.reduce((s, t) => s + (map[m]?.[t] ?? 0), 0);
    map[m]["Portal/Other"] = total - known;
  }

  const toolSeries = TOOLS.map((tool) => ({
    name: tool,
    type: "bar",
    stack: "errors",
    barMaxWidth: 52,
    itemStyle: { color: TOOL_COLORS[tool], opacity: 0.85 },
    data: months.map((m) => map[m]?.[tool] ?? 0),
    emphasis: { focus: "series" as const },
  }));

  const portalSeries = {
    name: "Portal/Other",
    type: "bar",
    stack: "errors",
    barMaxWidth: 52,
    itemStyle: { color: "#52525b", opacity: 0.6 },
    data: months.map((m) => Math.max(0, map[m]?.["Portal/Other"] ?? 0)),
    emphasis: { focus: "series" as const },
  };

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
        const mo = data.by_month[params[0].dataIndex];
        const rows = [...params]
          .filter((p) => p.value > 0)
          .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
          .map(
            (p: { seriesName: string; value: number; color: string }) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
                <span style="display:flex;align-items:center;gap:6px;color:#a1a1aa">
                  <span style="width:7px;height:7px;border-radius:50%;background:${p.color};display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${(p.value as number).toLocaleString()}</span>
              </div>`
          )
          .join("");
        return `<div style="font-weight:700;margin-bottom:6px">${fmtMonth(mo.month_year)} · ${mo.total_errors.toLocaleString()} errors total</div>${rows}`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      data: [...TOOLS, "Portal/Other"],
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 28, left: 8, right: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: monthLabels,
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`,
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [...toolSeries, portalSeries],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
