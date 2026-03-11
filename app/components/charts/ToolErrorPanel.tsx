"use client";

import { useState, useCallback, useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, TOOL_COLORS } from "../../lib/chartTheme";

// ── Types ──────────────────────────────────────────────────────────────────
interface ErrRow { tool: string; month_year: string; visits: number; errors: number; rate: number }
interface ErrorEntry { message: string; count: number; bucket: string }
interface ToolErrors { tool: string; all_time: ErrorEntry[]; by_month: Record<string, ErrorEntry[]> }

interface Props {
  rateData: ErrRow[];
  errorData: ToolErrors[];
  tool: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function toQuarterLabel(month_year: string): string {
  const [y, m] = month_year.split("-");
  return `Q${Math.ceil(parseInt(m) / 3)} '${y.slice(2)}`;
}

function daysInMonth(month_year: string): number {
  const [y, m] = month_year.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

interface Quarter {
  label: string;
  visits: number;
  errors: number;
  rate: number;
  days: number;
  months: string[];
}

function buildQuarters(rows: ErrRow[]): Quarter[] {
  const map = new Map<string, Quarter>();
  for (const d of rows) {
    const label = toQuarterLabel(d.month_year);
    const existing = map.get(label);
    if (existing) {
      existing.visits += d.visits;
      existing.errors += d.errors;
      existing.days += daysInMonth(d.month_year);
      existing.months.push(d.month_year);
    } else {
      map.set(label, { label, visits: d.visits, errors: d.errors, rate: 0, days: daysInMonth(d.month_year), months: [d.month_year] });
    }
  }
  return Array.from(map.values()).map((q) => ({
    ...q,
    rate: q.visits > 0 ? Math.round((q.errors / q.visits) * 1000) / 10 : 0,
  }));
}

function mergeErrors(entries: ErrorEntry[][]): ErrorEntry[] {
  const map = new Map<string, ErrorEntry>();
  for (const list of entries) {
    for (const e of list) {
      const existing = map.get(e.message);
      if (existing) existing.count += e.count;
      else map.set(e.message, { ...e });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
}

// ── Bucket colours ─────────────────────────────────────────────────────────
const BUCKET_COLORS: Record<string, string> = {
  "CDN icon failure":           "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "CDN / HTTP failure":         "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "API failure":                "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "CORS: technology list API":  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "Null-ref error":             "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "Angular DI error":           "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "Runtime type error":         "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Content fetch failure":      "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  "Dev noise":                  "bg-zinc-600/10 text-zinc-500 border-zinc-600/20",
  "Other":                      "bg-zinc-600/10 text-zinc-500 border-zinc-600/20",
};

const lineColor = "#fb923c";

export default function ToolErrorPanel({ rateData, errorData, tool }: Props) {
  const toolRateData = rateData.filter((d) => d.tool === tool && d.visits > 0);
  const barColor = TOOL_COLORS[tool] ?? "#52525b";

  // Use quarterly if more than 10 months of data
  const useQuarterly = toolRateData.length > 10;
  const quarters = useMemo(() => buildQuarters(toolRateData), [toolRateData]);
  const displayData = useQuarterly ? quarters : toolRateData.map((d) => ({
    label: `${d.month_year.slice(0, 4).slice(2)}M${d.month_year.slice(5)}`,
    visits: d.visits, errors: d.errors, rate: d.rate,
    days: daysInMonth(d.month_year),
    months: [d.month_year],
  }));
  // Friendly x-axis labels
  const xLabels = useQuarterly
    ? quarters.map((q) => q.label)
    : toolRateData.map((d) => {
        const [y, m] = d.month_year.split("-");
        const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return `${names[parseInt(m)-1]} '${y.slice(2)}`;
      });

  const [selectedIdx, setSelectedIdx] = useState<number>(displayData.length - 1);
  const [pinned, setPinned] = useState(false);

  const handleHover = useCallback((params: { dataIndex: number }) => {
    if (!pinned) setSelectedIdx(params.dataIndex);
  }, [pinned]);

  const handleClick = useCallback((params: { dataIndex: number }) => {
    if (pinned && selectedIdx === params.dataIndex) setPinned(false);
    else { setSelectedIdx(params.dataIndex); setPinned(true); }
  }, [pinned, selectedIdx]);

  const handleMouseOut = useCallback(() => {
    if (!pinned) setSelectedIdx(displayData.length - 1);
  }, [pinned, displayData.length]);

  // Resolve errors for selected period
  const toolErrors = errorData.find((d) => d.tool === tool) as ToolErrors | undefined;
  const selectedPeriod = displayData[selectedIdx];
  const quarterErrors = useMemo(() => {
    if (!selectedPeriod || !toolErrors) return [];
    const monthLists = selectedPeriod.months
      .map((m) => toolErrors.by_month[m])
      .filter(Boolean) as ErrorEntry[][];
    return monthLists.length > 0 ? mergeErrors(monthLists) : toolErrors.all_time;
  }, [selectedPeriod, toolErrors]);
  const isAllTime = !selectedPeriod?.months.some((m) => toolErrors?.by_month[m]?.length);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const d = displayData[params[0].dataIndex];
        const label = xLabels[params[0].dataIndex];
        const errPerDay = d.days > 0 ? (d.errors / d.days).toFixed(1) : "—";
        return `<div style="padding:2px 0">
          <div style="font-weight:700;color:#fafafa;margin-bottom:6px">${label}</div>
          <div style="color:#a1a1aa;margin:2px 0">Visits: <strong style="color:#fafafa">${d.visits.toLocaleString()}</strong></div>
          <div style="color:#a1a1aa;margin:2px 0">Errors: <strong style="color:#f87171">${d.errors.toLocaleString()}</strong></div>
          <div style="color:#a1a1aa;margin:2px 0">Errors/day: <strong style="color:#f87171">${errPerDay}</strong></div>
          <div style="color:#a1a1aa;margin:2px 0">Rate: <strong style="color:${lineColor};font-size:13px">${d.rate} / 100 visits</strong></div>
        </div>`;
      },
    },
    legend: {
      bottom: 0,
      left: "center",
      data: [
        { name: "Visits", icon: "roundRect" },
        { name: "Errors / 100 visits", icon: "circle" },
      ],
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 16, left: 8, right: 64, bottom: 32, containLabel: true },
    xAxis: {
      type: "category",
      data: xLabels,
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11 },
    },
    yAxis: [
      {
        type: "value",
        name: "Visits",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        ...axisStyle,
        axisLabel: {
          color: "#71717a", fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${v / 1000}k` : `${v}`,
        },
      },
      {
        type: "value",
        name: "Errors / 100",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        min: 0,
        axisLabel: { color: "#71717a", fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Visits",
        type: "bar",
        color: barColor,
        yAxisIndex: 0,
        barMaxWidth: 40,
        data: displayData.map((d, i) => ({
          value: d.visits,
          itemStyle: { color: barColor, opacity: i === selectedIdx ? 1 : 0.45, borderRadius: [3, 3, 0, 0] },
        })),
        emphasis: { disabled: true },
      },
      {
        name: "Errors / 100 visits",
        type: "line",
        color: lineColor,
        yAxisIndex: 1,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: (_val: unknown, params: { dataIndex: number }) => params.dataIndex === selectedIdx ? 10 : 7,
        lineStyle: { color: lineColor, width: 2.5 },
        itemStyle: { color: lineColor },
        label: {
          show: true, position: "top", color: lineColor, fontSize: 10, fontWeight: "bold" as const,
          formatter: (p: { value: number }) => p.value === 0 ? "" : `${p.value}`,
        },
        data: displayData.map((d) => d.rate),
      },
    ],
  };

  const totalErrors = quarterErrors.reduce((s, e) => s + e.count, 0);
  const maxCount = quarterErrors[0]?.count ?? 1;
  const periodLabel = isAllTime ? "All-time" : xLabels[selectedIdx];

  return (
    <div>
      <ThemedEChart
        option={option}
        style={{ height: "280px", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={{ mouseover: handleHover, click: handleClick, mouseout: handleMouseOut }}
      />

      {quarterErrors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              {periodLabel} — top error sources
              <span className="ml-2 text-zinc-600 normal-case">({totalErrors.toLocaleString()} errors)</span>
            </p>
            {pinned ? (
              <button
                onClick={() => setPinned(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-1.5 py-0.5 transition-colors"
              >
                unpin
              </button>
            ) : (
              <span className="text-[10px] text-zinc-600 italic">hover to explore · click to pin</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {quarterErrors.map((e, i) => {
              const pct = Math.round((e.count / maxCount) * 100);
              const badgeCls = BUCKET_COLORS[e.bucket] ?? BUCKET_COLORS["Other"];
              return (
                <div key={i} className="group flex items-center gap-3">
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 rounded bg-zinc-700/40 transition-all duration-300" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="text-xs text-zinc-300 truncate leading-tight" title={e.message}>{e.message}</span>
                      <span className="text-xs text-zinc-400 font-mono shrink-0">{e.count.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 hidden sm:inline-block ${badgeCls}`}>
                    {e.bucket}
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
