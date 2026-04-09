"use client";

import { useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface MonthRow {
  month_year: string;
  human: number;
  bot: number;
  ai_bot: number;
  total: number;
}

const SERIES_CONFIG = [
  { key: "human" as const, name: "Human", color: "#3b82f6" },
  { key: "bot" as const, name: "Bot", color: "#f43f5e" },
  { key: "ai_bot" as const, name: "AI Bot", color: "#f59e0b" },
];

export default function CNSMonthlyTrendChart({ data }: { data: MonthRow[] }) {
  const months = useMemo(() => data.map((d) => formatMonth(d.month_year)), [data]);

  // Default zoom: last 36 months (~3 years)
  const defaultStart = useMemo(() => {
    if (data.length <= 36) return 0;
    return Math.round(((data.length - 36) / data.length) * 100);
  }, [data]);

  const option = useMemo(() => {
    const tooltipFormatter = (params: { color: string; seriesName: string; value: number; axisValue?: string }[]) => {
      const month = params[0]?.axisValue ?? "";
      const total = params.reduce((s, p) => s + (p.value ?? 0), 0);
      const rows = params
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map(
          (p) =>
            `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
              <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
                ${p.seriesName}
              </span>
              <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()}</span>
            </div>`
        )
        .join("");
      return `<div style="padding:4px 2px">
        <div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>
        ${rows}
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid #3f3f46;display:flex;justify-content:space-between;gap:20px">
          <span style="color:#71717a">Total</span>
          <span style="font-weight:600;color:#fafafa">${total.toLocaleString()}</span>
        </div>
      </div>`;
    };

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        ...tooltipStyle,
        formatter: tooltipFormatter,
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 16,
        itemHeight: 4,
        borderRadius: 2,
        textStyle: { color: "#a1a1aa", fontSize: 12 },
      },
      grid: { top: 36, left: 8, right: 8, bottom: 56, containLabel: true },
      xAxis: {
        type: "category" as const,
        data: months,
        boundaryGap: false,
        ...axisStyle,
        axisLabel: { color: "#71717a", fontSize: 10, interval: 3, rotate: 30 },
      },
      yAxis: {
        type: "value" as const,
        ...axisStyle,
        axisLabel: {
          color: "#71717a",
          fontSize: 11,
          formatter: (v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
        },
      },
      dataZoom: [
        {
          type: "slider",
          bottom: 0,
          height: 20,
          start: defaultStart,
          end: 100,
          borderColor: "#3f3f46",
          backgroundColor: "#18181b",
          fillerColor: "rgba(59,130,246,0.12)",
          handleStyle: { color: "#3b82f6", borderColor: "#3b82f6" },
          moveHandleStyle: { color: "#3b82f6" },
          textStyle: { color: "#71717a", fontSize: 9 },
          brushSelect: false,
        },
        { type: "inside" },
      ],
      series: SERIES_CONFIG.map((cfg) => ({
        name: cfg.name,
        type: "line",
        stack: "traffic",
        smooth: 0.3,
        symbol: "none",
        lineStyle: { width: 0 },
        areaStyle: { color: cfg.color, opacity: 0.75 },
        emphasis: { focus: "series" as const },
        data: data.map((d) => d[cfg.key]),
      })),
    };
  }, [data, months, defaultStart]);

  return (
    <ThemedEChart
      option={option}
      style={{ height: "380px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
