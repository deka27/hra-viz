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
  Other: "#71717a",
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

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

export default function CNSFundingChart({ data }: Props) {
  const { option } = useMemo(() => {
    // Filter grants with amount > 0, sort by amount descending, take top 20
    const top = [...data]
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)
      .reverse(); // reverse so largest is at top in horizontal bar

    const categories = top.map((d) => truncate(d.name, 28));

    // For a Gantt-like chart, use custom renderItem or use bar with start/end.
    // ECharts doesn't have native Gantt, so we use a workaround:
    // each bar from date_start to date_end on a time axis.

    // Find min/max dates
    const allStarts = top.map((d) => new Date(d.date_start).getTime());
    const allEnds = top.map((d) => new Date(d.date_end).getTime());
    const minTime = Math.min(...allStarts);
    const maxTime = Math.max(...allEnds);

    const seriesData = top.map((d, i) => ({
      name: d.name,
      value: [
        i,
        new Date(d.date_start).getTime(),
        new Date(d.date_end).getTime(),
        d.amount,
        d.funder,
        d.title,
      ],
      itemStyle: { color: FUNDER_COLORS[funderCategory(d.funder)] ?? "#71717a" },
    }));

    return {
      option: {
        backgroundColor: "transparent",
        tooltip: {
          ...tooltipStyle,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const v = params.value;
            const startDate = new Date(v[1]).toLocaleDateString("en-US", { year: "numeric", month: "short" });
            const endDate = new Date(v[2]).toLocaleDateString("en-US", { year: "numeric", month: "short" });
            const grant = top[v[0]] ?? null;
            return `<div style="padding:4px 2px;max-width:340px">
              <div style="font-weight:600;color:#fafafa;margin-bottom:4px;font-size:12px">${grant?.name ?? params.name}</div>
              <div style="color:#a1a1aa;font-size:11px;margin-bottom:6px;line-height:1.4">${grant?.title ?? ""}</div>
              <div style="display:flex;justify-content:space-between;gap:16px;margin:3px 0">
                <span style="color:#a1a1aa">Funder</span>
                <span style="font-weight:600;color:#fafafa">${grant?.funder ?? ""}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;margin:3px 0">
                <span style="color:#a1a1aa">Amount</span>
                <span style="font-weight:600;color:#10b981">${fmtDollars(v[3])}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;margin:3px 0">
                <span style="color:#a1a1aa">Period</span>
                <span style="font-weight:600;color:#fafafa">${startDate} – ${endDate}</span>
              </div>
            </div>`;
          },
        },
        grid: { top: 10, left: 8, right: 20, bottom: 40, containLabel: true },
        xAxis: {
          type: "time" as const,
          min: minTime,
          max: maxTime,
          ...axisStyle,
          axisLabel: {
            color: "#71717a",
            fontSize: 10,
            formatter: (v: number) => new Date(v).getFullYear().toString(),
          },
        },
        yAxis: {
          type: "category" as const,
          data: categories,
          ...axisStyle,
          axisLabel: { color: "#71717a", fontSize: 10, width: 120, overflow: "truncate" as const },
          inverse: false,
        },
        series: [
          {
            type: "custom",
            renderItem: (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              params: any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              api: any,
            ) => {
              const categoryIndex = api.value(0);
              const startTime = api.coord([api.value(1), categoryIndex]);
              const endTime = api.coord([api.value(2), categoryIndex]);
              const barHeight = api.size([0, 1])[1] * 0.6;
              const color = FUNDER_COLORS[funderCategory(api.value(4) as string)] ?? "#71717a";

              return {
                type: "rect",
                shape: {
                  x: startTime[0],
                  y: startTime[1] - barHeight / 2,
                  width: Math.max(endTime[0] - startTime[0], 4),
                  height: barHeight,
                  r: [3, 3, 3, 3],
                },
                style: { fill: color, opacity: 0.75 },
                emphasis: {
                  style: { opacity: 1 },
                },
              };
            },
            data: seriesData,
            encode: {
              x: [1, 2],
              y: 0,
            },
          },
        ],
      },
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-2">
      <ThemedEChart
        option={option}
        style={{ height: "500px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#10b981" }} />
          <span className="text-[11px] text-zinc-500">NIH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#3b82f6" }} />
          <span className="text-[11px] text-zinc-500">NSF</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#71717a" }} />
          <span className="text-[11px] text-zinc-500">Other</span>
        </div>
      </div>
    </div>
  );
}
