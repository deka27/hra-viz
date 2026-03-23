"use client";

import { useState, useCallback, useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS, TOOLS, axisStyle, tooltipStyle, formatMonth } from "../../lib/chartTheme";

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthData {
  month_year: string;
  CDE: number;
  EUI: number;
  "FTU Explorer": number;
  "KG Explorer": number;
  RUI: number;
}

interface ExternalEvent {
  date: string;
  type: "release" | "workshop" | "publication" | "social";
  title: string;
}

interface Publication {
  pmid: string;
  title: string;
  pub_date: string;
  doi: string;
  journal: string;
  authors: string[];
}

interface PubRef {
  title: string;
  url: string;
}

interface PubMonth {
  count: number;
  pubs: PubRef[];
}

interface Props {
  data: MonthData[];
  events?: ExternalEvent[];
  publications?: Publication[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const EVENT_STYLE: Record<string, { color: string; borderColor: string; bgColor: string }> = {
  release:     { color: "#22d3ee", borderColor: "rgba(34,211,238,0.4)", bgColor: "rgba(34,211,238,0.06)" },
  workshop:    { color: "#f87171", borderColor: "rgba(248,113,113,0.25)", bgColor: "rgba(248,113,113,0.06)" },
  publication: { color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)", bgColor: "rgba(167,139,250,0.06)" },
  social:      { color: "#34d399", borderColor: "rgba(52,211,153,0.3)", bgColor: "rgba(52,211,153,0.06)" },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function MonthlyTrendsChart({ data, events = [], publications = [] }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const months = useMemo(() => data.map((d) => formatMonth(d.month_year)), [data]);

  // Aggregate publications by month
  const { pubsByMonth, pubBarData, maxPubs, totalPubs } = useMemo(() => {
    const map = new Map<string, PubMonth>();
    for (const pub of publications) {
      if (pub.pub_date.length < 7) continue;
      const label = formatMonth(pub.pub_date.slice(0, 7));
      const entry = map.get(label) ?? { count: 0, pubs: [] };
      entry.count++;
      entry.pubs.push({
        title: pub.title.length > 60 ? pub.title.slice(0, 57) + "…" : pub.title,
        url: pub.doi ? `https://doi.org/${pub.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`,
      });
      map.set(label, entry);
    }
    const barData = months.map((m) => map.get(m)?.count ?? 0);
    return {
      pubsByMonth: map,
      pubBarData: barData,
      maxPubs: Math.max(...barData, 1),
      totalPubs: [...map.values()].reduce((s, e) => s + e.count, 0),
    };
  }, [publications, months]);

  const hasPubs = pubsByMonth.size > 0;

  // Map events by month
  const eventsByMonth = useMemo(() => {
    const map = new Map<string, ExternalEvent[]>();
    for (const ev of events) {
      const label = formatMonth(ev.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(ev);
    }
    return map;
  }, [events]);

  // Exclude "publication" from event legend — already shown via purple bars
  const eventTypesPresent = useMemo(() => [...new Set(events.map((e) => e.type))].filter((t) => t !== "publication"), [events]);

  // Build chart option
  const option = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series: any[] = TOOLS.map((tool) => {
      const color = TOOL_COLORS[tool];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s: Record<string, any> = {
        name: tool,
        type: "line",
        smooth: 0.4,
        data: data.map((d) => d[tool as keyof MonthData] as number),
        lineStyle: { width: 2.5, color },
        itemStyle: { color },
        symbolSize: 5,
        symbol: "circle",
        showSymbol: false,
        emphasis: { focus: "series", showSymbol: true },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + "28" },
              { offset: 1, color: color + "00" },
            ],
          },
        },
      };

      if (tool === "KG Explorer") {
        s.markLine = {
          silent: true, symbol: ["none", "none"],
          data: [{
            xAxis: "Aug '25",
            lineStyle: { color: "#f43f5e", type: "dashed", width: 1.5 },
            label: { show: true, formatter: "KG Launch", color: "#f43f5e", fontSize: 10, position: "insideEndTop" },
          }],
        };
      }

      if (tool === "EUI" && events.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workshopAreas: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const releaseLines: any[] = [];

        // Short labels for workshops
        const shortWorkshopLabel = (title: string) => {
          if (title.includes("Training") || title.includes("Demo Day")) return "Training";
          if (title.includes("Powers of Ten")) return "Powers of Ten";
          if (title.includes("Jr. Investigator") || title.includes("Annual")) return "HuBMAP Mtgs";
          if (title.includes("Hackathon")) return "Hackathon";
          if (title.includes("IEEE")) return "IEEE VIS";
          if (title.includes("Workshop") && title.includes("NLM")) return "HRA Workshop";
          return title.split("(")[0].replace(/^HuBMAP /, "").trim();
        };

        // Stagger release labels to avoid overlap
        let releaseIdx = 0;
        for (const [monthLabel, evs] of eventsByMonth) {
          for (const ev of evs) {
            const style = EVENT_STYLE[ev.type] || EVENT_STYLE.social;
            if (ev.type === "workshop") {
              const idx = months.indexOf(monthLabel);
              const nextMonth = idx >= 0 && idx < months.length - 1 ? months[idx + 1] : monthLabel;
              workshopAreas.push([
                {
                  xAxis: monthLabel,
                  itemStyle: { color: style.bgColor, borderColor: style.borderColor, borderWidth: 1 },
                  label: { show: true, position: "insideRight", formatter: shortWorkshopLabel(ev.title), color: style.color, fontSize: 9, rotate: 90, offset: [0, -10] },
                },
                { xAxis: nextMonth },
              ]);
            } else if (ev.type === "release") {
              releaseLines.push({
                xAxis: monthLabel,
                lineStyle: { color: style.color, type: "dashed" as const, width: 1 },
                label: { show: true, formatter: ev.title.split(" — ")[0], color: style.color, fontSize: 9, position: "insideEndTop", rotate: 90 },
              });
            }
          }
        }

        if (workshopAreas.length > 0) s.markArea = { silent: true, data: workshopAreas };
        if (releaseLines.length > 0) s.markLine = { silent: true, symbol: ["none", "none"], data: releaseLines };
      }

      return s;
    });

    if (hasPubs) {
      series.push({
        name: "Publications",
        type: "bar",
        yAxisIndex: 1,
        data: pubBarData,
        barWidth: 6,
        barGap: "-100%",
        itemStyle: { color: "rgba(167,139,250,0.35)", borderRadius: [2, 2, 0, 0] },
        emphasis: { itemStyle: { color: "rgba(167,139,250,0.6)" } },
        z: 0,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tooltipFormatter = (params: any[]) => {
      const pubParam = params.find((p: { seriesName: string }) => p.seriesName === "Publications");
      const toolParams = params.filter((p: { seriesName: string }) => p.seriesName !== "Publications");
      const month = params[0]?.axisValue ?? "";
      const sorted = [...toolParams].filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
      const rows = sorted.map(
        (p: { color: string; seriesName: string; value: number }) =>
          `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
            <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
              <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
              ${p.seriesName}
            </span>
            <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()}</span>
          </div>`
      ).join("");
      const pubRow = pubParam && pubParam.value > 0
        ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0;padding-top:5px;border-top:1px solid #3f3f46">
            <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
              <span style="width:8px;height:8px;border-radius:2px;background:#a78bfa;flex-shrink:0;display:inline-block"></span>
              Publications
            </span>
            <span style="font-weight:600;color:#a78bfa">${pubParam.value}</span>
          </div>`
        : "";
      // Show events (releases, workshops) for this month
      const monthEvents = eventsByMonth.get(month) ?? [];
      const eventRows = monthEvents
        .filter((ev) => ev.type !== "publication")
        .map((ev) => {
          const color = EVENT_STYLE[ev.type]?.color ?? "#71717a";
          const icon = ev.type === "release" ? "◆" : "●";
          return `<div style="margin:2px 0;padding:3px 0;font-size:11px;color:${color}">${icon} ${ev.title}</div>`;
        }).join("");
      const eventBlock = eventRows ? `<div style="padding-top:5px;margin-top:3px;border-top:1px solid #3f3f46">${eventRows}</div>` : "";
      return `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>${rows}${pubRow}${eventBlock}</div>`;
    };

    return {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", ...tooltipStyle, formatter: tooltipFormatter },
      legend: {
        top: 0, right: 0, itemWidth: 16, itemHeight: 4, borderRadius: 2,
        textStyle: { color: "#a1a1aa", fontSize: 12 },
        // Hide "Publications" from legend since it's shown in the panel legend below
        data: TOOLS.map((t) => t),
      },
      grid: { top: 36, left: 8, right: hasPubs ? 32 : 8, bottom: 56, containLabel: true },
      xAxis: {
        type: "category", data: months, boundaryGap: false,
        ...axisStyle,
        axisLabel: { color: "#71717a", fontSize: 10, interval: 2, rotate: 30 },
      },
      yAxis: [
        {
          type: "value", ...axisStyle,
          axisLabel: { color: "#71717a", fontSize: 11, formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`) },
        },
        ...(hasPubs ? [{
          type: "value", position: "right", min: 0, max: maxPubs + 1,
          splitLine: { show: false },
          axisLine: { lineStyle: { color: "#a78bfa40" } },
          axisLabel: { color: "#a78bfa", fontSize: 10, formatter: (v: number) => v === 0 ? "" : `${v}` },
          axisTick: { show: false },
        }] : []),
      ],
      dataZoom: [
        {
          type: "slider", bottom: 0, height: 20,
          borderColor: "#3f3f46", backgroundColor: "#18181b",
          fillerColor: "rgba(59,130,246,0.12)",
          handleStyle: { color: "#3b82f6", borderColor: "#3b82f6" },
          moveHandleStyle: { color: "#3b82f6" },
          textStyle: { color: "#71717a", fontSize: 9 },
          brushSelect: false,
        },
        { type: "inside" },
      ],
      series,
    };
  }, [data, months, events, eventsByMonth, hasPubs, pubBarData, maxPubs]);

  // Click to select a month — click again to deselect
  const handleClick = useCallback((params: { dataIndex?: number }) => {
    if (params.dataIndex == null) return;
    setSelectedIdx((prev) => prev === params.dataIndex ? null : params.dataIndex!);
  }, []);

  const chartEvents = useMemo(
    () => hasPubs ? { click: handleClick } : undefined,
    [hasPubs, handleClick],
  );

  // Resolved publication data for the selected month
  const activeMonth = selectedIdx != null ? months[selectedIdx] : null;
  const activePubs = activeMonth ? pubsByMonth.get(activeMonth) ?? null : null;

  return (
    <div className="flex flex-col gap-2">
      <ThemedEChart
        option={option}
        style={{ height: "420px", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={chartEvents}
      />

      {/* Event type + publication legend */}
      {(eventTypesPresent.length > 0 || hasPubs) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-1">
          {eventTypesPresent.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_STYLE[t]?.color ?? "#71717a" }} />
              <span className="text-[11px] text-zinc-500 capitalize">{t === "workshop" ? "Workshop / Events" : t}</span>
            </div>
          ))}
          {hasPubs && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#a78bfa" }} />
              <span className="text-[11px] text-zinc-500">Publications (right axis)</span>
            </div>
          )}
          {eventTypesPresent.length > 0 && (
            <span className="text-[11px] text-zinc-600 ml-auto">Dashed lines = releases · Shaded areas = workshops / events</span>
          )}
        </div>
      )}

      {/* Click-to-show publication panel */}
      {hasPubs && (
        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {activePubs ? (
            <div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/5 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full bg-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">{activeMonth}</span>
                  <span className="text-xs text-zinc-500">{activePubs.count} paper{activePubs.count > 1 ? "s" : ""}</span>
                </div>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  clear
                </button>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {activePubs.pubs.map((pub, i) => (
                  <a
                    key={i}
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-violet-500/5 transition-colors group"
                  >
                    <span className="flex-1 text-xs text-zinc-400 group-hover:text-violet-300 transition-colors leading-snug">{pub.title}</span>
                    <span className="text-[10px] text-zinc-600 group-hover:text-violet-400 shrink-0 transition-colors">Open</span>
                  </a>
                ))}
              </div>
            </div>
          ) : activeMonth ? (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-zinc-500">No publications in {activeMonth}</span>
              <button
                onClick={() => setSelectedIdx(null)}
                className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-3 text-zinc-600">
              <div className="w-1 h-4 rounded-full bg-violet-400/20" />
              <span className="text-xs">Click on the chart to see {totalPubs} HRA-related publications for that month</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
