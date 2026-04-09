"use client";

import { useState, useCallback, useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

// ── Types ──────────────────────────────────────────────────────────────────
interface ErrorEntry {
  path: string;
  status: number;
  count: number;
  category: string;
}

interface Props {
  monthlyErrors: { month_year: string; total_errors: number }[];
  topErrorsByMonth: {
    all_time: ErrorEntry[];
    by_month: Record<string, ErrorEntry[]>;
  };
}

// ── Status badge colours ──────────────────────────────────────────────────
const STATUS_BADGE: Record<number, string> = {
  404: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  500: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  403: "bg-violet-500/15 text-violet-400 border-violet-500/20",
};

const CATEGORY_BADGE: Record<string, string> = {
  "Scanner Probe": "bg-red-500/10 text-red-400 border-red-500/20",
  "Missing PDF": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Moved Page": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Missing Image": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Missing Doc": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Broken Link": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "Homepage Error": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Server Error": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Access Denied": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Other": "bg-zinc-600/10 text-zinc-500 border-zinc-600/20",
};

function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} '${y.slice(2)}`;
}

export default function CNSErrorDrilldownPanel({ monthlyErrors, topErrorsByMonth }: Props) {
  const months = monthlyErrors.map((d) => d.month_year);
  const totals = monthlyErrors.map((d) => d.total_errors);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  const handleHover = useCallback(
    (params: { dataIndex: number }) => {
      if (!pinned) setSelectedIdx(params.dataIndex);
    },
    [pinned],
  );

  const handleClick = useCallback(
    (params: { dataIndex: number }) => {
      if (pinned && selectedIdx === params.dataIndex) {
        setPinned(false);
        setSelectedIdx(null);
      } else {
        setSelectedIdx(params.dataIndex);
        setPinned(true);
      }
    },
    [pinned, selectedIdx],
  );

  const handleMouseOut = useCallback(() => {
    if (!pinned) setSelectedIdx(null);
  }, [pinned]);

  // Resolve errors for selected period
  const errors: ErrorEntry[] = useMemo(() => {
    if (selectedIdx === null) return topErrorsByMonth.all_time;
    const mo = months[selectedIdx];
    const monthData = topErrorsByMonth.by_month[mo];
    return monthData && monthData.length > 0 ? monthData : topErrorsByMonth.all_time;
  }, [selectedIdx, months, topErrorsByMonth]);

  const isAllTime = selectedIdx === null || !topErrorsByMonth.by_month[months[selectedIdx]]?.length;
  const periodLabel = isAllTime ? "All-time" : formatMonth(months[selectedIdx!]);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const d = params[0];
        return `<div style="padding:2px 0">
          <div style="font-weight:700;color:#fafafa;margin-bottom:4px">${formatMonth(months[d.dataIndex])}</div>
          <div style="color:#a1a1aa">Total errors: <strong style="color:#f87171">${Number(d.value).toLocaleString()}</strong></div>
        </div>`;
      },
    },
    grid: { top: 16, left: 8, right: 16, bottom: 32, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: months.map(formatMonth),
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        rotate: 45,
        interval: Math.max(0, Math.floor(months.length / 20) - 1),
      },
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
      },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 12,
        data: totals.map((v, i) => ({
          value: v,
          itemStyle: {
            color: "#f43f5e",
            opacity: selectedIdx === null ? 0.7 : i === selectedIdx ? 1 : 0.3,
            borderRadius: [2, 2, 0, 0],
          },
        })),
        emphasis: { disabled: true },
      },
    ],
  };

  const totalErrors = errors.reduce((s, e) => s + e.count, 0);
  const maxCount = errors[0]?.count ?? 1;

  return (
    <div>
      <ThemedEChart
        option={option}
        style={{ height: "300px", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={{ mouseover: handleHover, click: handleClick, mouseout: handleMouseOut }}
      />

      {errors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              {periodLabel} — top error paths
              <span className="ml-2 text-zinc-600 dark:text-zinc-500 normal-case">
                ({totalErrors.toLocaleString()} errors)
              </span>
            </p>
            {pinned ? (
              <button
                onClick={() => { setPinned(false); setSelectedIdx(null); }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 transition-colors"
              >
                unpin
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-600 italic">
                hover to explore · click to pin
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {errors.map((e, i) => {
              const pct = Math.round((e.count / maxCount) * 100);
              const statusCls = STATUS_BADGE[e.status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
              const catCls = CATEGORY_BADGE[e.category] ?? CATEGORY_BADGE["Other"];
              return (
                <div key={i} className="group flex items-center gap-3">
                  {/* Status badge */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${statusCls}`}>
                    {e.status}
                  </span>
                  {/* Bar + path + count */}
                  <div className="relative flex-1 min-w-0">
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-zinc-200/60 dark:bg-zinc-700/40 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-2 px-2 py-1.5">
                      <span
                        className="text-xs text-zinc-700 dark:text-zinc-300 truncate leading-tight font-mono"
                        title={e.path}
                      >
                        {e.path}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
                        {e.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {/* Category badge */}
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 hidden sm:inline-block ${catCls}`}>
                    {e.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
