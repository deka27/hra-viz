"use client";

import { useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface BotRow {
  month_year: string;
  human: number;
  bot: number;
  ai_bot: number;
}

const SERIES_CONFIG = [
  { key: "human" as const, name: "Human", color: "#3b82f6" },
  { key: "bot" as const, name: "Bot", color: "#f43f5e" },
  { key: "ai_bot" as const, name: "AI Bot", color: "#f59e0b" },
];

export default function BotTrendChart({ data }: { data: BotRow[] }) {
  const months = useMemo(() => data.map((d) => formatMonth(d.month_year)), [data]);

  const option = useMemo(() => {
    const tooltipFormatter = (params: { color: string; seriesName: string; value: number; axisValue?: string }[]) => {
      const month = params[0]?.axisValue ?? "";
      const total = params.reduce((s, p) => s + (p.value ?? 0), 0);
      const rows = params
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map(
          (p) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
            return `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
              <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
                ${p.seriesName}
              </span>
              <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()} <span style="color:#71717a;font-weight:400">(${pct}%)</span></span>
            </div>`;
          }
        )
        .join("");
      return `<div style="padding:4px 2px">
        <div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>
        ${rows}
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
        axisLabel: { color: "#71717a", fontSize: 10, interval: 4, rotate: 30 },
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
        lineStyle: { width: 1.5, color: cfg.color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: cfg.color + "60" },
              { offset: 1, color: cfg.color + "08" },
            ],
          },
        },
        emphasis: { focus: "series" as const },
        data: data.map((d) => d[cfg.key]),
      })),
    };
  }, [data, months]);

  return (
    <ThemedEChart
      option={option}
      style={{ height: "380px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
