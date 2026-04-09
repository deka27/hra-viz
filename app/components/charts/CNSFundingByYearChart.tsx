"use client";

import { useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

interface FundingEntry {
  slug: string;
  name: string;
  title: string;
  funder: string;
  amount: number;
  received_amount: number;
  investigators: string[];
  date_start: string;
  date_end: string;
  type: string;
}

interface Props {
  data: FundingEntry[];
}

const FUNDER_COLORS: Record<string, string> = {
  NIH: "#10b981",
  NSF: "#3b82f6",
  Other: "#a78bfa",
};

function funderCategory(funder: string): string {
  const f = funder.toLowerCase().trim();
  if (f.includes("national institutes of health") || f.includes("nih")) return "NIH";
  if (f.includes("national science foundation") || f.includes("nsf")) return "NSF";
  return "Other";
}

function fmtDollars(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export default function CNSFundingByYearChart({ data }: Props) {
  const option = useMemo(() => {
    // Only consider grants with amount > 0
    const grants = data.filter((d) => d.amount > 0);

    // Find year range — cap at current year
    const currentYear = new Date().getFullYear();
    const startYears = grants.map((d) => parseInt(d.date_start.slice(0, 4)));
    const endYears = grants.map((d) => Math.min(parseInt(d.date_end.slice(0, 4)), currentYear));
    const minYear = Math.min(...startYears);
    const maxYear = Math.min(Math.max(...endYears), currentYear);

    const years: string[] = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y.toString());

    // For each year, sum active grant amounts by funder category
    const categories = ["NIH", "NSF", "Other"];
    const seriesByFunder: Record<string, number[]> = {};
    for (const cat of categories) {
      seriesByFunder[cat] = years.map(() => 0);
    }

    for (const grant of grants) {
      const sy = parseInt(grant.date_start.slice(0, 4));
      const ey = Math.min(parseInt(grant.date_end.slice(0, 4)), currentYear);
      const cat = funderCategory(grant.funder);
      // Distribute amount evenly across active years
      const activeYears = ey - sy + 1;
      const annualAmount = grant.amount / Math.max(activeYears, 1);

      for (let y = sy; y <= ey; y++) {
        const idx = y - minYear;
        if (idx >= 0 && idx < years.length) {
          seriesByFunder[cat][idx] += annualAmount;
        }
      }
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis" as const,
        ...tooltipStyle,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any[]) => {
          const year = params[0]?.axisValue ?? "";
          let total = 0;
          const rows = params
            .filter((p: { value: number }) => p.value > 0)
            .map((p: { color: string; seriesName: string; value: number }) => {
              total += p.value;
              return `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
                <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
                  <span style="width:8px;height:8px;border-radius:2px;background:${p.color};flex-shrink:0;display:inline-block"></span>
                  ${p.seriesName}
                </span>
                <span style="font-weight:600;color:#fafafa">${fmtDollars(p.value)}</span>
              </div>`;
            })
            .join("");
          return `<div style="padding:4px 2px">
            <div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${year}</div>
            ${rows}
            <div style="border-top:1px solid #3f3f46;margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;gap:20px">
              <span style="color:#a1a1aa;font-weight:600">Total</span>
              <span style="font-weight:700;color:#fafafa">${fmtDollars(total)}</span>
            </div>
          </div>`;
        },
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 16,
        itemHeight: 4,
        textStyle: { color: "#a1a1aa", fontSize: 12 },
      },
      grid: { top: 36, left: 8, right: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "category" as const,
        data: years,
        ...axisStyle,
        axisLabel: { color: "#71717a", fontSize: 10, interval: 2, rotate: 30 },
      },
      yAxis: {
        type: "value" as const,
        ...axisStyle,
        splitNumber: 4,
        axisLabel: {
          color: "#71717a",
          fontSize: 11,
          formatter: (v: number) => {
            if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1000) return `$${Math.round(v / 1000)}K`;
            return `$${v}`;
          },
        },
      },
      series: categories.map((cat, i) => ({
        name: cat,
        type: "bar" as const,
        stack: "funding",
        data: seriesByFunder[cat],
        itemStyle: { color: FUNDER_COLORS[cat], borderRadius: i === categories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0] },
        emphasis: { focus: "series" as const },
      })),
    };
  }, [data]);

  return (
    <ThemedEChart
      option={option}
      style={{ height: "480px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
