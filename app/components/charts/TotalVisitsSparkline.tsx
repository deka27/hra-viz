"use client";

import { useState, useCallback, useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { formatMonth, tooltipStyle, axisStyle } from "../../lib/chartTheme";

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

interface PubRef { title: string; url: string }
interface PubMonth { count: number; pubs: PubRef[] }

interface Props {
  data: MonthData[];
  events?: ExternalEvent[];
  publications?: Publication[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  release: "#22d3ee",
  workshop: "#f87171",
  publication: "#a78bfa",
  social: "#34d399",
};

const LINK_ICON = (
  <svg className="w-3 h-3 flex-shrink-0 mt-0.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ── Component ────────────────────────────────────────────────────────────────

export default function TotalVisitsSparkline({ data, events = [], publications = [] }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const months = useMemo(() => data.map((d) => formatMonth(d.month_year)), [data]);
  const totals = useMemo(() => data.map((d) => d.CDE + d.EUI + d["FTU Explorer"] + d["KG Explorer"] + d.RUI), [data]);

  // Aggregate publications by month with titles + links
  const { pubsByMonth, pubBarData, maxPubs, totalPubs, hasPubs } = useMemo(() => {
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
      hasPubs: map.size > 0,
    };
  }, [publications, months]);

  // Event markLines / markAreas
  const { releaseLines, workshopAreas } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lines: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const areas: any[] = [];
    for (const ev of events) {
      const label = formatMonth(ev.date);
      const color = EVENT_COLORS[ev.type] ?? "#71717a";
      if (ev.type === "workshop") {
        const idx = months.indexOf(label);
        const next = idx >= 0 && idx < months.length - 1 ? months[idx + 1] : label;
        areas.push([
          {
            xAxis: label,
            itemStyle: { color: "rgba(248,113,113,0.06)", borderColor: color + "40", borderWidth: 1 },
            label: { show: false },
          },
          { xAxis: next },
        ]);
      } else if (ev.type === "release") {
        // Only releases get labeled markLines — publications shown via bars + panel
        lines.push({
          xAxis: label,
          lineStyle: { color, type: "dashed" as const, width: 1 },
          label: { show: true, formatter: ev.title.split(" — ")[0], color, fontSize: 10, position: "insideEndTop" },
        });
      }
    }
    return { releaseLines: lines, workshopAreas: areas };
  }, [events, months]);

  const eventTypesPresent = useMemo(() => [...new Set(events.map((e) => e.type))], [events]);

  // Build chart option
  const option = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tooltipFormatter = (params: any[]) => {
      const visitParam = params.find((p: { seriesName: string }) => p.seriesName !== "Publications");
      const pubParam = params.find((p: { seriesName: string }) => p.seriesName === "Publications");
      const month = params[0]?.axisValue ?? "";
      let html = `<div style="padding:2px 0"><div style="font-weight:600;color:#fafafa;margin-bottom:4px">${month}</div>`;
      if (visitParam) {
        html += `<div style="color:#a1a1aa">${Number(visitParam.value).toLocaleString()} total visits</div>`;
      }
      if (pubParam && pubParam.value > 0) {
        html += `<div style="display:flex;align-items:center;gap:7px;color:#a78bfa;margin-top:4px;padding-top:4px;border-top:1px solid #3f3f46">
          <span style="width:8px;height:8px;border-radius:2px;background:#a78bfa;flex-shrink:0;display:inline-block"></span>
          ${pubParam.value} publication${pubParam.value > 1 ? "s" : ""}
        </div>`;
      }
      html += "</div>";
      return html;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mainSeries: Record<string, any> = {
      name: "Visits",
      type: "line",
      data: totals,
      smooth: 0.4,
      symbol: "none",
      lineStyle: { width: 2, color: "#3b82f6" },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(59,130,246,0.25)" },
            { offset: 1, color: "rgba(59,130,246,0.02)" },
          ],
        },
      },
    };

    if (releaseLines.length > 0) mainSeries.markLine = { silent: true, symbol: ["none", "none"], data: releaseLines };
    if (workshopAreas.length > 0) mainSeries.markArea = { silent: true, data: workshopAreas };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series: any[] = [mainSeries];

    if (hasPubs) {
      series.push({
        name: "Publications",
        type: "bar",
        yAxisIndex: 1,
        data: pubBarData,
        barWidth: 5,
        barGap: "-100%",
        itemStyle: { color: "rgba(167,139,250,0.35)", borderRadius: [2, 2, 0, 0] },
        emphasis: { itemStyle: { color: "rgba(167,139,250,0.6)" } },
        z: 0,
      });
    }

    return {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", ...tooltipStyle, formatter: tooltipFormatter },
      grid: { top: 48, left: 8, right: hasPubs ? 28 : 8, bottom: 24, containLabel: true },
      xAxis: {
        type: "category", data: months, boundaryGap: false,
        ...axisStyle,
        axisLabel: { color: "#52525b", fontSize: 10, interval: 3 },
      },
      yAxis: [
        {
          type: "value", ...axisStyle,
          axisLabel: { color: "#52525b", fontSize: 10, formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`) },
        },
        ...(hasPubs ? [{
          type: "value", position: "right", min: 0, max: maxPubs + 1,
          splitLine: { show: false },
          axisLine: { lineStyle: { color: "#a78bfa40" } },
          axisLabel: { color: "#a78bfa", fontSize: 9, formatter: (v: number) => v === 0 ? "" : `${v}` },
          axisTick: { show: false },
        }] : []),
      ],
      series,
    };
  }, [months, totals, releaseLines, workshopAreas, hasPubs, pubBarData, maxPubs]);

  // Click to select a month, click again to deselect
  const handleClick = useCallback((params: { dataIndex?: number }) => {
    if (params.dataIndex == null) return;
    setSelectedIdx((prev) => prev === params.dataIndex ? null : params.dataIndex!);
  }, []);

  const chartEvents = useMemo(
    () => hasPubs ? { click: handleClick } : undefined,
    [hasPubs, handleClick],
  );

  const activeMonth = selectedIdx != null ? months[selectedIdx] : null;
  const activePubs = activeMonth ? pubsByMonth.get(activeMonth) ?? null : null;

  return (
    <div className="flex flex-col gap-1">
      <ThemedEChart
        option={option}
        style={{ height: "360px", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={chartEvents}
      />
      {(eventTypesPresent.length > 0 || hasPubs) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          {eventTypesPresent.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_COLORS[t] ?? "#71717a" }} />
              <span className="text-[10px] text-zinc-500 capitalize">{t}</span>
            </div>
          ))}
          {hasPubs && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: "#a78bfa" }} />
              <span className="text-[10px] text-zinc-500">Publications</span>
            </div>
          )}
        </div>
      )}

      {/* Click-to-show publication panel */}
      {hasPubs && (
        <div className="mt-1 border border-zinc-800 rounded-lg px-3 py-2 bg-zinc-900/30 min-h-[44px]">
          {activePubs ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-violet-400" />
                  <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">{activeMonth}</span>
                  <span className="text-[10px] text-zinc-600">{activePubs.count} paper{activePubs.count > 1 ? "s" : ""}</span>
                </div>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-1.5 py-0.5 transition-colors"
                >
                  clear
                </button>
              </div>
              <div className="space-y-1">
                {activePubs.pubs.map((pub, i) => (
                  <a
                    key={i}
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-[11px] text-zinc-400 hover:text-violet-300 transition-colors leading-snug pl-2 border-l border-zinc-800 hover:border-violet-500 py-0.5"
                  >
                    <span className="flex-1">{pub.title}</span>
                    {LINK_ICON}
                  </a>
                ))}
              </div>
            </div>
          ) : activeMonth ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-2 h-2 rounded-sm bg-zinc-700" />
              <span className="text-[11px]">No publications in {activeMonth}</span>
              <button
                onClick={() => setSelectedIdx(null)}
                className="text-[10px] text-zinc-600 hover:text-zinc-300 ml-auto border border-zinc-800 rounded px-1.5 py-0.5 transition-colors"
              >
                clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-600">
              <div className="w-2 h-2 rounded-sm bg-violet-400/30" />
              <span className="text-[11px]">Click on the chart to see {totalPubs} HRA-related publications for that month</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
