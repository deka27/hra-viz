"use client";

import { useState, useCallback, useMemo } from "react";
import ThemedEChart from "../ThemedEChart";
import { tooltipStyle, axisStyle, formatMonth } from "../../lib/chartTheme";

interface MonthRow {
  month_year: string;
  human: number;
}

interface Publication {
  pmid?: string;
  slug?: string;
  title: string;
  pub_date: string;
  doi: string;
  journal: string;
  authors: string[];
  url?: string;
}

interface EventEntry {
  date_start: string;
  title: string;
  type: string;
  link?: string;
}

interface PubRef {
  title: string;
  url: string;
  preprint: boolean;
}

interface EventRef {
  title: string;
  type: string;
  url: string;
}

interface PubMonth {
  count: number;
  pubs: PubRef[];
}

interface EventMonth {
  count: number;
  events: EventRef[];
}

interface Props {
  data: MonthRow[];
  publications: Publication[];
  events?: EventEntry[];
}

const PREPRINT_JOURNALS = ["biorxiv", "arxiv", "medrxiv"];
const isPreprint = (journal: string) => PREPRINT_JOURNALS.some((p) => journal.toLowerCase().includes(p));

export default function CNSOverviewTrendChart({ data, publications, events = [] }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const months = useMemo(() => data.map((d) => formatMonth(d.month_year)), [data]);

  // Aggregate publications by month
  const { pubsByMonth, pubBarPublished, pubBarPreprint, maxPubs, totalPubs } = useMemo(() => {
    const map = new Map<string, PubMonth>();
    for (const pub of publications) {
      if (pub.pub_date.length < 7) continue;
      const label = formatMonth(pub.pub_date.slice(0, 7));
      const entry = map.get(label) ?? { count: 0, pubs: [] };
      entry.count++;
      entry.pubs.push({
        title: pub.title.length > 60 ? pub.title.slice(0, 57) + "\u2026" : pub.title,
        url: pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : (pub.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/` : "")),
        preprint: isPreprint(pub.journal),
      });
      map.set(label, entry);
    }
    const published = months.map((m) => map.get(m)?.pubs.filter((p) => !p.preprint).length ?? 0);
    const preprint = months.map((m) => map.get(m)?.pubs.filter((p) => p.preprint).length ?? 0);
    const combined = months.map((_, i) => published[i] + preprint[i]);
    return {
      pubsByMonth: map,
      pubBarPublished: published,
      pubBarPreprint: preprint,
      maxPubs: Math.max(...combined, 1),
      totalPubs: [...map.values()].reduce((s, e) => s + e.count, 0),
    };
  }, [publications, months]);

  // Aggregate events by month
  const { eventsByMonth, eventBar, totalEvents } = useMemo(() => {
    const map = new Map<string, EventMonth>();
    for (const ev of events) {
      if (ev.date_start.length < 7) continue;
      const label = formatMonth(ev.date_start.slice(0, 7));
      const entry = map.get(label) ?? { count: 0, events: [] };
      entry.count++;
      entry.events.push({
        title: ev.title.length > 60 ? ev.title.slice(0, 57) + "\u2026" : ev.title,
        type: ev.type,
        url: ev.link || "",
      });
      map.set(label, entry);
    }
    const bar = months.map((m) => map.get(m)?.count ?? 0);
    return {
      eventsByMonth: map,
      eventBar: bar,
      totalEvents: [...map.values()].reduce((s, e) => s + e.count, 0),
    };
  }, [events, months]);

  const hasEvents = eventsByMonth.size > 0;
  const hasPubs = pubsByMonth.size > 0;

  // Default zoom: last 36 months
  const defaultStart = useMemo(() => {
    if (data.length <= 36) return 0;
    return Math.round(((data.length - 36) / data.length) * 100);
  }, [data]);

  // Detect partial (incomplete) last month: if its total is < 50% of the prior month
  const isLastMonthPartial = useMemo(() => {
    if (data.length < 2) return false;
    const last = data[data.length - 1].human;
    const prev = data[data.length - 2].human;
    return prev > 0 && last < prev * 0.5;
  }, [data]);

  // Compute secondary axis max accounting for events stacked on pubs
  const secondaryMax = useMemo(() => {
    const combined = months.map((_, i) => pubBarPublished[i] + pubBarPreprint[i] + eventBar[i]);
    return Math.max(...combined, maxPubs, 1) + 1;
  }, [months, pubBarPublished, pubBarPreprint, eventBar, maxPubs]);

  const option = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tooltipFormatter = (params: any[]) => {
      const publishedParam = params.find((p: { seriesName: string }) => p.seriesName === "Published");
      const preprintParam = params.find((p: { seriesName: string }) => p.seriesName === "Preprint");
      const eventsParam = params.find((p: { seriesName: string }) => p.seriesName === "Events");
      const pubTotal = (publishedParam?.value ?? 0) + (preprintParam?.value ?? 0);
      const eventTotal = eventsParam?.value ?? 0;
      const visitParam = params.find((p: { seriesName: string }) => p.seriesName === "Human visits");
      const month = params[0]?.axisValue ?? "";

      let html = `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>`;
      if (visitParam && visitParam.value > 0) {
        html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
          <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
            <span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;flex-shrink:0;display:inline-block"></span>
            Human visits
          </span>
          <span style="font-weight:600;color:#fafafa">${Number(visitParam.value).toLocaleString()}</span>
        </div>`;
      }
      if (pubTotal > 0) {
        html += `<div style="padding-top:5px;border-top:1px solid #3f3f46;margin-top:3px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
            <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
              <span style="width:8px;height:8px;border-radius:2px;background:#a78bfa;flex-shrink:0;display:inline-block"></span>
              Published
            </span>
            <span style="font-weight:600;color:#a78bfa">${publishedParam?.value ?? 0}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
            <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
              <span style="width:8px;height:8px;border-radius:2px;background:#fbbf24;flex-shrink:0;display:inline-block"></span>
              Preprint
            </span>
            <span style="font-weight:600;color:#fbbf24">${preprintParam?.value ?? 0}</span>
          </div>
        </div>`;
      }
      if (eventTotal > 0) {
        html += `<div style="padding-top:5px;border-top:1px solid #3f3f46;margin-top:3px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
            <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
              <span style="width:8px;height:8px;border-radius:2px;background:#f59e0b;flex-shrink:0;display:inline-block"></span>
              Events
            </span>
            <span style="font-weight:600;color:#f59e0b">${eventTotal}</span>
          </div>
        </div>`;
      }
      const lastMonthLabel = months[months.length - 1];
      if (isLastMonthPartial && month === lastMonthLabel) {
        html += `<div style="margin-top:6px;padding-top:5px;border-top:1px solid #3f3f46;font-size:10px;color:#fbbf24;font-style:italic">Partial month — data collection still in progress</div>`;
      }
      html += "</div>";
      return html;
    };

    return {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", ...tooltipStyle, formatter: tooltipFormatter },
      graphic: [{
        type: "text",
        left: "center",
        bottom: 42,
        style: { text: "Drag handles to adjust timeline", fill: "#52525b", fontSize: 10 },
      }],
      legend: {
        top: 0, right: 0, itemWidth: 16, itemHeight: 4, borderRadius: 2,
        textStyle: { color: "#a1a1aa", fontSize: 12 },
        data: ["Human visits"],
      },
      grid: { top: 36, left: 8, right: (hasPubs || hasEvents) ? 32 : 8, bottom: 72, containLabel: true },
      xAxis: {
        type: "category" as const,
        data: months,
        boundaryGap: true,
        ...axisStyle,
        axisLabel: { color: "#71717a", fontSize: 10, interval: 3, rotate: 30 },
      },
      yAxis: [
        {
          type: "value" as const,
          ...axisStyle,
          axisLabel: {
            color: "#71717a", fontSize: 11,
            formatter: (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
          },
        },
        ...((hasPubs || hasEvents) ? [{
          type: "value" as const,
          position: "right" as const,
          min: 0,
          max: secondaryMax,
          splitLine: { show: false },
          axisLine: { lineStyle: { color: "#a78bfa40" } },
          axisLabel: { color: "#a78bfa", fontSize: 10, formatter: (v: number) => v === 0 ? "" : `${v}` },
          axisTick: { show: false },
        }] : []),
      ],
      dataZoom: [
        {
          type: "slider", bottom: 0, height: 36, start: defaultStart, end: 100,
          borderColor: "#3f3f46", backgroundColor: "#18181b",
          fillerColor: "rgba(59,130,246,0.08)",
          selectedDataBackground: {
            lineStyle: { color: "#3b82f6", width: 1 },
            areaStyle: { color: "rgba(59,130,246,0.15)" },
          },
          dataBackground: {
            lineStyle: { color: "#52525b", width: 0.5 },
            areaStyle: { color: "rgba(82,82,91,0.15)" },
          },
          handleIcon: "path://M-9.35,34.56V42m0-40V9.5m-2,0h4a2,2,0,0,1,2,2v21a2,2,0,0,1,-2,2h-4a2,2,0,0,1,-2,-2v-21a2,2,0,0,1,2,-2Z",
          handleSize: "110%",
          handleStyle: { color: "#3b82f6", borderColor: "#2563eb", borderWidth: 1, shadowBlur: 4, shadowColor: "rgba(59,130,246,0.3)" },
          moveHandleStyle: { color: "#3b82f6" },
          emphasis: { handleStyle: { color: "#60a5fa", borderColor: "#3b82f6" } },
          textStyle: { color: "#a1a1aa", fontSize: 10 },
          brushSelect: false,
        },
        { type: "inside" },
      ],
      series: [
        {
          name: "Human visits",
          type: "line",
          smooth: 0.3,
          symbol: "none",
          lineStyle: { color: "#3b82f6", width: 2 },
          areaStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59,130,246,0.25)" },
                { offset: 1, color: "rgba(59,130,246,0.02)" },
              ],
            },
          },
          emphasis: { focus: "series" as const },
          data: data.map((d) => d.human),
          ...(isLastMonthPartial ? {
            markArea: {
              silent: true,
              data: [[
                {
                  xAxis: months[months.length - 1],
                  itemStyle: {
                    color: "rgba(251,191,36,0.06)",
                    borderColor: "rgba(251,191,36,0.35)",
                    borderWidth: 1,
                    borderType: "dashed" as const,
                  },
                  label: {
                    show: true,
                    position: "insideTop",
                    formatter: "Partial month",
                    color: "#fbbf24",
                    fontSize: 10,
                    fontStyle: "italic",
                  },
                },
                { xAxis: months[months.length - 1] },
              ]],
            },
          } : {}),
        },
        ...(hasPubs ? [
          {
            name: "Published",
            type: "bar",
            stack: "pubs",
            yAxisIndex: 1,
            data: pubBarPublished,
            barWidth: 14,
            barGap: "-100%",
            itemStyle: { color: "rgba(167,139,250,0.35)", borderRadius: [0, 0, 0, 0] },
            emphasis: { itemStyle: { color: "rgba(167,139,250,0.6)" } },
            z: 10,
          },
          {
            name: "Preprint",
            type: "bar",
            stack: "pubs",
            yAxisIndex: 1,
            data: pubBarPreprint,
            barWidth: 14,
            barGap: "-100%",
            itemStyle: { color: "rgba(251,191,36,0.35)", borderRadius: [2, 2, 0, 0] },
            emphasis: { itemStyle: { color: "rgba(251,191,36,0.6)" } },
            z: 10,
          },
        ] : []),
        ...(hasEvents ? [
          {
            name: "Events",
            type: "bar",
            stack: "pubs",
            yAxisIndex: 1,
            data: eventBar,
            barWidth: 14,
            barGap: "-100%",
            itemStyle: { color: "rgba(245,158,11,0.40)", borderRadius: [2, 2, 0, 0] },
            emphasis: { itemStyle: { color: "rgba(245,158,11,0.65)" } },
            z: 10,
          },
        ] : []),
      ],
    };
  }, [data, months, hasPubs, hasEvents, pubBarPublished, pubBarPreprint, eventBar, secondaryMax, defaultStart, isLastMonthPartial]);

  // Click to select month
  const handleClick = useCallback((params: { dataIndex?: number }) => {
    if (params.dataIndex == null) return;
    setSelectedIdx((prev) => prev === params.dataIndex ? null : params.dataIndex!);
  }, []);

  const chartEvents = useMemo(
    () => (hasPubs || hasEvents) ? { click: handleClick } : undefined,
    [hasPubs, hasEvents, handleClick],
  );

  const activeMonth = selectedIdx != null ? months[selectedIdx] : null;
  const activePubs = activeMonth ? pubsByMonth.get(activeMonth) ?? null : null;
  const activeEvents = activeMonth ? eventsByMonth.get(activeMonth) ?? null : null;

  return (
    <div className="flex flex-col gap-2">
      <ThemedEChart
        option={option}
        style={{ height: "380px", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={chartEvents}
      />

      {/* Legend */}
      {(hasPubs || hasEvents) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-1">
          {hasPubs && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#a78bfa" }} />
                <span className="text-[11px] text-zinc-500">Published (right axis)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#fbbf24" }} />
                <span className="text-[11px] text-zinc-500">Preprint</span>
              </div>
            </>
          )}
          {hasEvents && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-[11px] text-zinc-500">Events (right axis)</span>
            </div>
          )}
        </div>
      )}

      {/* Click-to-show panel */}
      {(hasPubs || hasEvents) && (
        <div className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
          {(activePubs || activeEvents) ? (
            <div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full bg-violet-400" />
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">{activeMonth}</span>
                  {activePubs && <span className="text-xs text-zinc-500">{activePubs.count} paper{activePubs.count > 1 ? "s" : ""}</span>}
                  {activeEvents && <span className="text-xs text-zinc-500">{activeEvents.count} event{activeEvents.count > 1 ? "s" : ""}</span>}
                </div>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  clear
                </button>
              </div>
              {/* Publications */}
              {activePubs && activePubs.pubs.length > 0 && (
                <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {activePubs.pubs.map((pub, i) => (
                    <a
                      key={`pub-${i}`}
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-violet-500/5 transition-colors group"
                    >
                      <span className="flex-1 text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors leading-snug">
                        {pub.title}
                        {pub.preprint && <span className="ml-1.5 text-[9px] font-medium text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">preprint</span>}
                      </span>
                      <span className="text-[10px] text-zinc-600 group-hover:text-violet-400 shrink-0 transition-colors">Open</span>
                    </a>
                  ))}
                </div>
              )}
              {/* Events */}
              {activeEvents && activeEvents.events.length > 0 && (
                <>
                  {activePubs && activePubs.pubs.length > 0 && (
                    <div className="px-4 py-1.5 bg-amber-500/5 border-t border-b border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Events</span>
                    </div>
                  )}
                  <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                    {activeEvents.events.map((ev, i) => {
                      const inner = (
                        <span className="flex-1 text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors leading-snug">
                          {ev.title}
                          <span className="ml-1.5 text-[9px] font-medium text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">{ev.type}</span>
                        </span>
                      );
                      return ev.url ? (
                        <a
                          key={`ev-${i}`}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-amber-500/5 transition-colors group"
                        >
                          {inner}
                          <span className="text-[10px] text-zinc-600 group-hover:text-amber-400 shrink-0 transition-colors">Open</span>
                        </a>
                      ) : (
                        <div key={`ev-${i}`} className="flex items-center gap-3 px-4 py-2 group">
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : activeMonth ? (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-zinc-500">No publications or events in {activeMonth}</span>
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
              <span className="text-xs">
                Click on the chart to see
                {hasPubs ? ` ${totalPubs} publications` : ""}
                {hasPubs && hasEvents ? " and" : ""}
                {hasEvents ? ` ${totalEvents} events` : ""}
                {" "}in this date range
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
