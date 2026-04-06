import ChartCard from "../components/ChartCard";
import MonthlyTrendsChart from "../components/charts/MonthlyTrendsChart";
import YearlyGroupedBar from "../components/charts/YearlyGroupedBar";
import DonutChart from "../components/charts/DonutChart";
import StatCard from "../components/StatCard";
import ToolHourlyHeatmap from "../components/charts/ToolHourlyHeatmap";
import TrafficByDowChart from "../components/charts/TrafficByDowChart";
import { ErrorSourceChart, ErrorCauseChart } from "../components/charts/ErrorBreakdownChart";
import { ErrorBucketBySourceChart } from "../components/charts/ErrorRootCauseBreakdownCharts";
import MonthlyErrorTrendChart from "../components/charts/MonthlyErrorTrendChart";
import ToolErrorPanel from "../components/charts/ToolErrorPanel";
import ToolReturnRateChart from "../components/charts/ToolReturnRateChart";

import monthlyData from "../../public/data/tool_visits_by_month.json";
import toolErrorRatesLong from "../../public/data/tool_error_rates_long.json";
import topErrorsByTool from "../../public/data/top_errors_by_tool.json";
import toolReturnRateData from "../../public/data/tool_return_rate.json";
import yearlyData from "../../public/data/tool_visits_by_year.json";
import totalData from "../../public/data/total_tool_visits.json";
import hourlyHeatmapData from "../../public/data/tool_hourly_heatmap.json";
import dowData from "../../public/data/traffic_by_dow.json";
import eventTypes from "../../public/data/event_types.json";
import errorClusters from "../../public/data/error_clusters.json";
import monthlyErrorData from "../../public/data/monthly_error_trend.json";
import errorBreakdown from "../../public/data/error_breakdown.json";
import errorRootCauseBreakdown from "../../public/data/error_root_cause_breakdown.json";
import externalEvents from "../../public/data/external_events.json";
import hraReleases from "../../public/data/hra_releases.json";
import publicationsData from "../../public/data/publications.json";

const TOOL_CARD_COLORS: Record<string, string> = {
  "KG Explorer": "text-rose-400",
  "EUI": "text-blue-400",
  "RUI": "text-violet-400",
  "CDE": "text-amber-400",
  "FTU Explorer": "text-emerald-400",
  "Portal/Other": "text-zinc-400",
};

const TOOL_PIE_COLORS: Record<string, string> = {
  "KG Explorer": "#f43f5e",
  "EUI": "#3b82f6",
  "RUI": "#8b5cf6",
  "CDE": "#f59e0b",
  "FTU Explorer": "#10b981",
};

function fmtMonth(ym: string): string {
  const [y, mo] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

const sorted = [...totalData].sort((a, b) => b.visits - a.visits);
const dateRange = `${fmtMonth(monthlyData[0].month_year)} – ${fmtMonth(monthlyData[monthlyData.length - 1].month_year)}`;
const numMonths = monthlyData.length;
const totalEvents = eventTypes.reduce((s, d) => s + d.count, 0);
const errorCount = eventTypes.find((d) => d.event === "error")?.count ?? 0;
const errorPct = ((errorCount / totalEvents) * 100).toFixed(1);
const clusterTotal = (errorClusters as { total_error_rows: number }).total_error_rows;
const errorSources = (errorBreakdown as { by_source: { tool: string; errors: number }[] }).by_source;
const topErrorSource = [...errorSources].sort((a, b) => b.errors - a.errors)[0];
const topErrorSourceShare = topErrorSource && errorCount > 0
  ? ((topErrorSource.errors / errorCount) * 100).toFixed(1)
  : "0.0";
const errorByMonth = (monthlyErrorData as { by_month: { month_year: string; total_errors: number }[] }).by_month;
const peakErrorMonth = errorByMonth.reduce((mx, row) => (row.total_errors > mx.total_errors ? row : mx), errorByMonth[0]);
const latestErrorMonth = errorByMonth[errorByMonth.length - 1];
const peakToLatestDropPct = peakErrorMonth && latestErrorMonth && peakErrorMonth.total_errors > 0
  ? (((peakErrorMonth.total_errors - latestErrorMonth.total_errors) / peakErrorMonth.total_errors) * 100).toFixed(1)
  : "0.0";

type ErrRow = { tool: string; month_year: string; visits: number; errors: number; rate: number };
const errLong = toolErrorRatesLong as ErrRow[];
const kgErrActive = errLong.filter((d) => d.tool === "KG Explorer" && d.visits > 0);

// Per-tool peak/current error rates — derived so narrative text stays accurate after each parquet update
function toolPeakRate(tool: string) { const rows = errLong.filter(d => d.tool === tool && d.visits > 0); return rows.reduce((mx, d) => d.rate > mx.rate ? d : mx, rows[0] ?? { rate: 0, month_year: "" }); }
function toolLatestRate(tool: string) { const rows = errLong.filter(d => d.tool === tool && d.visits > 0); return rows[rows.length - 1] ?? { rate: 0, month_year: "" }; }

const euiPeak = toolPeakRate("EUI");
const cdePeak = toolPeakRate("CDE"); const cdeLatest = toolLatestRate("CDE");
const ruiPeak = toolPeakRate("RUI");
const ftuPeak = toolPeakRate("FTU Explorer");

type TopErrEntry = { message: string; count: number; bucket: string };
type TopErrToolRow = { tool: string; all_time: TopErrEntry[]; by_month: Record<string, TopErrEntry[]> };
const topErrByTool = topErrorsByTool as unknown as TopErrToolRow[];
const ftuTopErr = topErrByTool.find(d => d.tool === "FTU Explorer")?.all_time[0];
const kgPeakEntry = kgErrActive.reduce((max, d) => d.rate > max.rate ? d : max, kgErrActive[0] ?? { rate: 0, month_year: "" });
const kgLaunchRate = kgPeakEntry?.rate ?? 0;
const kgCurrentRate = kgErrActive[kgErrActive.length - 1]?.rate ?? 0;
const kgRateDrop = kgLaunchRate > 0 ? Math.round(((kgLaunchRate - kgCurrentRate) / kgLaunchRate) * 100) : 0;

type RetRow = { month_year: string; tool: string; users: number; returning: number; return_pct: number };
const retArr = toolReturnRateData as RetRow[];
const latestRetMonth = retArr.length > 0 ? retArr[retArr.length - 1].month_year : "";
const latestRets = retArr.filter((d) => d.month_year === latestRetMonth);
const ruiRetPct = latestRets.find((d) => d.tool === "RUI")?.return_pct ?? 0;
const euiRetPct = latestRets.find((d) => d.tool === "EUI")?.return_pct ?? 0;
const kgRetPct = latestRets.find((d) => d.tool === "KG Explorer")?.return_pct ?? 0;
const rootCauseBuckets = (errorRootCauseBreakdown as { by_bucket: { bucket: string; errors: number }[] }).by_bucket;

// ── Release impact: avg 2 months after vs avg 2 months before ──
type MonthRow = typeof monthlyData[number];
const TOOL_KEYS = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"] as const;
function monthTotal(row: MonthRow) { return TOOL_KEYS.reduce((s, k) => s + (row[k] ?? 0), 0); }
function avgWindow(start: number, count: number) {
  const vals: number[] = [];
  for (let i = start; i < start + count && i < monthlyData.length; i++) {
    if (i >= 0) vals.push(monthTotal(monthlyData[i]));
  }
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}
const releaseImpacts = hraReleases
  .filter((r) => {
    const label = fmtMonth(r.date);
    return monthlyData.some((d) => fmtMonth(d.month_year) === label);
  })
  .map((r) => {
    const idx = monthlyData.findIndex((d) => fmtMonth(d.month_year) === fmtMonth(r.date));
    const afterAvg = avgWindow(idx, 2);       // release month + 1 month after
    const beforeAvg = avgWindow(idx - 2, 2);  // 2 months before release
    const releaseVisits = Math.round(afterAvg);
    const delta = beforeAvg > 0 ? Math.round(((afterAvg - beforeAvg) / beforeAvg) * 100) : 0;
    return { ...r, releaseVisits, priorVisits: Math.round(beforeAvg), delta, month: fmtMonth(r.date) };
  });
// ── Publication impact: months with papers vs months without ──
type PubEntry = { pmid: string; title: string; pub_date: string; doi: string; journal: string; authors: string[] };
const pubsTyped = publicationsData as PubEntry[];
const pubCountByMonth = new Map<string, number>();
for (const p of pubsTyped) {
  if (p.pub_date.length < 7) continue;
  const label = fmtMonth(p.pub_date.slice(0, 7));
  pubCountByMonth.set(label, (pubCountByMonth.get(label) ?? 0) + 1);
}
// Compare average visits in pub months vs non-pub months (within our data range)
const pubMonthVisits: number[] = [];
const noPubMonthVisits: number[] = [];
for (const row of monthlyData) {
  const label = fmtMonth(row.month_year);
  const total = monthTotal(row);
  if (pubCountByMonth.has(label)) pubMonthVisits.push(total);
  else noPubMonthVisits.push(total);
}
const avgPubMonth = pubMonthVisits.length > 0 ? Math.round(pubMonthVisits.reduce((a, b) => a + b, 0) / pubMonthVisits.length) : 0;
const avgNoPubMonth = noPubMonthVisits.length > 0 ? Math.round(noPubMonthVisits.reduce((a, b) => a + b, 0) / noPubMonthVisits.length) : 0;
const pubLift = avgNoPubMonth > 0 ? Math.round(((avgPubMonth - avgNoPubMonth) / avgNoPubMonth) * 100) : 0;
const totalPubCount = [...pubCountByMonth.values()].reduce((a, b) => a + b, 0);

const topRootCauseFixes = [...rootCauseBuckets]
  .sort((a, b) => b.errors - a.errors)
  .slice(0, 4)
  .map((row) => {
    const coverage = errorCount > 0 ? ((row.errors / errorCount) * 100).toFixed(1) : "0.0";
    const guidance: Record<string, { title: string; action: string }> = {
      "Net/CORS: technology list API": {
        title: "Stabilize technology list API access",
        action: "Fix CORS + gateway routing for /api/v1/technology-names and add retries with fallback cache.",
      },
      "Icon retrieval failures": {
        title: "Repair icon asset delivery",
        action: "Audit icon manifest paths, publish missing SVGs, and add pre-deploy link checks against CDN URLs.",
      },
      "Null selection read": {
        title: "Guard empty selection states",
        action: "Add null/length checks before index access in selection handlers (e.g., getLastPickedObject).",
      },
      "Unreadable structured error object": {
        title: "Improve client error serialization",
        action: "Log structured error fields (name/message/stack) instead of raw object stringification.",
      },
      "Content file fetch failures": {
        title: "Harden content file loading",
        action: "Verify YAML asset URLs, add timeout/retry, and surface a user-safe fallback when content fetch fails.",
      },
      "Local development request noise": {
        title: "Separate dev telemetry from prod",
        action: "Tag local environments and exclude localhost/127.0.0.1 events from production dashboards.",
      },
      "Other": {
        title: "Triage long-tail errors",
        action: "Sample the uncategorized tail weekly and promote recurring patterns into explicit buckets.",
      },
    };
    const suggestion = guidance[row.bucket] ?? guidance.Other;
    return {
      bucket: row.bucket,
      errors: row.errors,
      coverage,
      title: suggestion.title,
      action: suggestion.action,
    };
  });

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Usage + Reliability</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Tool Usage and Reliability Trends</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Monthly and yearly breakdown of HRA tool page visits, plus cross-tool reliability trends. KG Explorer launched in Aug 2025 and immediately became the most-visited tool.
        </p>
      </div>

      {/* Per-tool stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sorted.map((t) => (
          <StatCard
            key={t.tool}
            label={t.tool}
            value={t.visits.toLocaleString()}
            accent={TOOL_CARD_COLORS[t.tool] ?? "text-zinc-900 dark:text-zinc-50"}
          />
        ))}
      </div>

      {/* Monthly trends — main chart */}
      <ChartCard
        title="Monthly Visits per Tool"
        subtitle={`${dateRange} · Use the slider or scroll to zoom`}
        badge={`${numMonths} months`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <MonthlyTrendsChart
          data={monthlyData}
          events={externalEvents as { date: string; type: "release" | "workshop" | "publication" | "social"; title: string }[]}
          publications={publicationsData as { pmid: string; title: string; pub_date: string; doi: string; journal: string; authors: string[] }[]}
        />
      </ChartCard>

      {/* Release impact + Publication correlation */}
      <div className="grid grid-cols-1 gap-4">
        {/* Release impact */}
        {releaseImpacts.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full bg-cyan-400" />
              <span className="text-base font-semibold text-zinc-200">HRA Release Impact</span>
              <span className="text-xs text-zinc-600 ml-2">Avg visits (release month + 1 after) vs avg (2 months before)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {releaseImpacts.map((r) => (
                <div key={r.date} className="bg-zinc-800/40 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-sm font-bold text-cyan-300">{r.version}</span>
                    <span className="text-xs text-zinc-500">{r.month}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-100 tabular-nums">{r.releaseVisits.toLocaleString()}</span>
                    <span className={`text-sm font-semibold ${r.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {r.delta >= 0 ? "+" : ""}{r.delta}%
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publication correlation */}
        {totalPubCount > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full bg-violet-400" />
              <span className="text-base font-semibold text-zinc-200">Publication ↔ Traffic Correlation</span>
              <span className="text-xs text-zinc-600 ml-2">{totalPubCount} papers across {pubCountByMonth.size} months</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-zinc-800/40 rounded-lg p-4 text-center">
                <span className="text-3xl font-bold text-violet-400 tabular-nums">{avgPubMonth.toLocaleString()}</span>
                <span className="block text-xs text-zinc-500 mt-1">avg visits (pub months)</span>
              </div>
              <div className="bg-zinc-800/40 rounded-lg p-4 text-center">
                <span className="text-3xl font-bold text-zinc-500 tabular-nums">{avgNoPubMonth.toLocaleString()}</span>
                <span className="block text-xs text-zinc-500 mt-1">avg visits (no pubs)</span>
              </div>
              <div className="bg-zinc-800/40 rounded-lg p-4 text-center">
                <span className={`text-3xl font-bold tabular-nums ${pubLift >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pubLift >= 0 ? "+" : ""}{pubLift}%
                </span>
                <span className="block text-xs text-zinc-500 mt-1">publication lift</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {pubLift > 0
                ? `Months with publications see ${pubLift}% more traffic on average. Correlation is suggestive but confounders (releases, workshops) often overlap with publication months.`
                : "No clear lift detected — publications may coincide with other traffic drivers."}
            </p>
          </div>
        )}
      </div>

      {/* Yearly + tool share */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ChartCard
          title="Visits by Year (Grouped)"
          subtitle="Year-over-year tool breakdown"
          className="lg:col-span-3"
        >
          <YearlyGroupedBar data={yearlyData} />
        </ChartCard>

        <ChartCard
          title="All-Time Tool Share"
          subtitle="Cumulative visits across all tools"
          className="lg:col-span-2"
        >
          <DonutChart
            data={totalData.map((d) => ({
              name: d.tool,
              value: d.visits,
              color: TOOL_PIE_COLORS[d.tool] ?? "#3b82f6",
            }))}
            unit="visits"
          />
        </ChartCard>
      </div>

      {/* Per-tool hourly heatmap */}
      <ChartCard
        title="When Each Tool Gets Used — By Hour (EST)"
        subtitle="Event count per hour of day (EST) · KG Explorer peaks late morning EST; EUI follows a similar pattern"
        badge="Hourly · All Tools"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <ToolHourlyHeatmap data={hourlyHeatmapData} />
      </ChartCard>

      {/* Day of week breakdown */}
      <ChartCard
        title="Visits by Day of Week"
        subtitle="Stacked by tool · EUI Sunday spike driven by March 2024 workshop event skewing the aggregate"
        badge="Day of Week"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <TrafficByDowChart data={dowData} />
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Weekend Drop-off</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              All tools see sharply lower weekend traffic — CDE, RUI, and FTU drop 60–80%.
              The pattern is most consistent with <span className="text-blue-400 font-semibold">weekday professional or academic workflows</span>,
              with lighter casual usage on weekends.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">EUI Sunday Anomaly</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              EUI shows unusually high Sunday visits — an artifact of the{" "}
              <span className="text-blue-400 font-semibold">March 2024 workshop</span> (7,140 visits)
              whose dates happened to fall on a Sunday, skewing the DOW aggregate.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">KG Explorer: Flat Across Week</span>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                KG Explorer has the most even distribution across days — reflecting its{" "}
                <span className="text-rose-400 font-semibold">international user base</span> across multiple time zones
                rather than a single institution&apos;s working hours.
              </p>
            </div>
        </div>
      </ChartCard>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cross-Tool Reliability</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Logged Errors"
          value={errorCount.toLocaleString()}
          sub={`${errorPct}% of all events`}
          accent="text-red-400"
        />
        <StatCard
          label="Clustered Samples"
          value={clusterTotal.toLocaleString()}
          sub="Rows used for root-cause clustering"
          accent="text-amber-400"
        />
        <StatCard
          label="Top Error Source"
          value={topErrorSource ? topErrorSource.errors.toLocaleString() : "0"}
          sub={topErrorSource ? `${topErrorSource.tool} (${topErrorSourceShare}% of errors)` : "No source data"}
          accent={topErrorSource ? (TOOL_CARD_COLORS[topErrorSource.tool] ?? "text-zinc-300") : "text-zinc-300"}
        />
        <StatCard
          label="Peak→Latest Drop"
          value={`${peakToLatestDropPct}%`}
          sub={`${peakErrorMonth ? fmtMonth(peakErrorMonth.month_year) : "n/a"} → ${latestErrorMonth ? fmtMonth(latestErrorMonth.month_year) : "n/a"}`}
          accent="text-emerald-400"
        />
      </div>

      <ChartCard
        title="Where Do the Errors Come From?"
        subtitle={`${errorCount.toLocaleString()} logged error events (${errorPct}% of all events) · stack trace clustering (${clusterTotal.toLocaleString()} sampled) shows 72% traceable to 3 fixable bugs`}
        badge="Quality · All Tools"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Error volume by source</p>
            <ErrorSourceChart />
            <p className="text-xs text-zinc-500 mt-2">
              Portal/Other (unattributed app context) and KG Explorer account for most error volume; RUI and CDE are low.
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Errors by root cause</p>
            <ErrorCauseChart />
            <p className="text-xs text-zinc-500 mt-2">
              Top 2 causes alone account for 62% of all errors — both are infrastructure issues, not UX.
              <span className="block mt-1 text-zinc-500">Source: NLP clustering on {clusterTotal.toLocaleString()} error messages — separate universe from the event-log error count above.</span>
            </p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Fix #1</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">6,438 errors</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold">API request blocked before response</span> — the technology list request
              fails before any HTTP status comes back, so users see loading failures instead of a clear server message.
              Fix CORS policy and cross-origin routing on <code className="text-zinc-600 dark:text-zinc-400 text-[10px]">apps.humanatlas.io/api/v1</code>.
            </p>
          </div>
          <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Fix #2</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">6,712 errors</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold">KG Explorer missing icons</span> — SVG assets for organs and products
              (all-organs, kidneys, ftu, schema…) not resolving on CDN. Audit CDN asset paths.
            </p>
          </div>
          <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Fix #3</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">2,251 errors</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold">EUI selection state is sometimes empty</span> — the 3D picker tries to read
              the first selected item even when nothing is selected, causing a client crash.
              Add a null/length guard in <code className="text-zinc-600 dark:text-zinc-400 text-[10px]">getLastPickedObject</code> before indexing.
            </p>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Root-Cause Composition by Source"
        subtitle="Stacked error counts by source (Portal/Other + tools)"
        badge="All Sources"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <ErrorBucketBySourceChart data={errorRootCauseBreakdown} />
        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topRootCauseFixes.map((fix, idx) => (
            <div key={fix.bucket} className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Priority #{idx + 1}</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{fix.errors.toLocaleString()} errors ({fix.coverage}%)</span>
              </div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{fix.title}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{fix.action}</p>
              <p className="text-[11px] text-zinc-500">Bucket: {fix.bucket}</p>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard
        title="Error Volume Over Time"
        subtitle="Monthly error events by source (tools + Portal/Other) · Oct 2025 spike = KG launch + CDN icon failures · trend improving"
        badge="Error Trend"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <MonthlyErrorTrendChart data={monthlyErrorData} />
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Oct 2025 Spike</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              12,387 errors in October — driven by{" "}
              <span className="text-rose-400 font-semibold">KG Explorer&apos;s August launch</span> triggering
              CDN icon resolution failures that accumulated until CDN paths were corrected.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Declining Trend</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Errors fell from <span className="text-red-400 font-semibold">12,387 → 3,149 → 2,976</span> in
              Oct–Dec 2025. Jan 2026 is partial but tracking lower. The CDN fixes are taking hold.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Portal/Other Category</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              The large &ldquo;Portal/Other&rdquo; bar represents errors from the HRA portal layer
              before app-attribution is set in the event payload. Some KG icon failures were logged without app attribution, so they appear under Portal/Other.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Quality journey section */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tool Error Rate Timeline</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Peak Error Rate" value={`${kgLaunchRate}`} sub="Errors per 100 visits (Oct '25)" accent="text-red-400" />
        <StatCard label="Current Error Rate" value={`${kgCurrentRate}`} sub="Errors per 100 visits (latest month)" accent="text-emerald-400" />
        <StatCard label="Rate Improvement" value={`${kgRateDrop}%`} sub="Reduction from launch to now" accent="text-emerald-400" />
        <StatCard label="RUI Return Rate" value={`${ruiRetPct}%`} sub={`Users returning · EUI ${euiRetPct}% · KG ${kgRetPct}%`} accent="text-violet-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="KG Explorer — Error Rate"
          subtitle="Hover a month to see that month's top errors · click to pin"
          badge="KG Explorer · Quality"
          badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
        >
          <ToolErrorPanel rateData={errLong} errorData={topErrByTool} tool="KG Explorer" />
          <p className="mt-3 text-sm text-zinc-500">
            Peaked at <span className="text-red-400 font-semibold">{kgLaunchRate}</span> in Oct &apos;25 (CDN icon failures + CORS on the technology list API). Down to <span className="text-emerald-400 font-semibold">{kgCurrentRate}</span> — <span className="text-emerald-400 font-semibold">{kgRateDrop}% improvement</span>.
          </p>
        </ChartCard>

        <ChartCard
          title="EUI — Error Rate"
          subtitle="Hover a month to see that month's top errors · click to pin"
          badge="EUI · Quality"
          badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
        >
          <ToolErrorPanel rateData={errLong} errorData={topErrByTool} tool="EUI" />
          <p className="mt-3 text-sm text-zinc-500">
            EUI peaked at <span className="text-red-400 font-semibold">{euiPeak.rate} errors/100 visits</span> ({fmtMonth(euiPeak.month_year)}). API failures (session-token, ontology endpoints) and null-ref errors on map initialization are the top drivers.
          </p>
        </ChartCard>

        <ChartCard
          title="CDE — Error Rate"
          subtitle="Hover a month to see that month's top errors · click to pin"
          badge="CDE · Quality"
          badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
        >
          <ToolErrorPanel rateData={errLong} errorData={topErrByTool} tool="CDE" />
          <p className="mt-3 text-sm text-zinc-500">
            CDE peaked at <span className="text-red-400 font-semibold">{cdePeak.rate} errors/100 visits</span> ({fmtMonth(cdePeak.month_year)}), latest at {cdeLatest.rate} ({fmtMonth(cdeLatest.month_year)}). Angular DI errors (NG0201, NG0950) and undefined property reads dominate.
          </p>
        </ChartCard>

        <ChartCard
          title="RUI — Error Rate"
          subtitle="Hover a month to see that month's top errors · click to pin"
          badge="RUI · Quality"
          badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
        >
          <ToolErrorPanel rateData={errLong} errorData={topErrByTool} tool="RUI" />
          <p className="mt-3 text-sm text-zinc-500">
            RUI generally has low error rates — peak at <span className="text-red-400 font-semibold">{ruiPeak.rate} errors/100</span> ({fmtMonth(ruiPeak.month_year)}). Icon retrieval from localhost dev environments accounts for most of the noise.
          </p>
        </ChartCard>

        <ChartCard
          title="FTU Explorer — Error Rate"
          subtitle="Hover a month to see that month's top errors · click to pin"
          badge="FTU Explorer · Quality"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <ToolErrorPanel rateData={errLong} errorData={topErrByTool} tool="FTU Explorer" />
          <p className="mt-3 text-sm text-zinc-500">
            FTU Explorer peaked at <span className="text-red-400 font-semibold">{ftuPeak.rate} errors/100</span> ({fmtMonth(ftuPeak.month_year)}). {ftuTopErr && <><code className="text-xs">{ftuTopErr.message}</code> is the dominant error ({ftuTopErr.count.toLocaleString()} hits). </>}Localhost dev noise also inflates counts.
          </p>
        </ChartCard>
      </div>

      <ChartCard
        title="Are Users Coming Back? — Tool Return Rates"
        subtitle="% of monthly active users who visited that tool in a prior month · data from H2 2025 onward"
        badge="Retention"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      >
        <ToolReturnRateChart data={toolReturnRateData} />
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">RUI Leads Retention</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              RUI has the highest return rate at <span className="text-violet-400 font-semibold">{ruiRetPct}% in the latest month</span>. Tissue registration is a recurring professional task — users come back because they have to.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">EUI Stabilizing</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              EUI sits at <span className="text-blue-400 font-semibold">{euiRetPct}%</span>, consistent with a mixed audience of returning researchers and first-time workshop visitors.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">KG Explorer Building</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              KG Explorer launched at near-zero return rate and is now at <span className="text-rose-400 font-semibold">{kgRetPct}%</span>. Adding bookmarking and share features could accelerate habit formation significantly.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Key observations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            color: "bg-rose-500",
            label: "KG Explorer",
            text: "Launched Aug 2025, reached 3,891 visits/mo by Oct 2025 — fastest-growing tool in the HRA suite.",
          },
          {
            color: "bg-blue-500",
            label: "EUI Spike",
            text: "March 2024 saw 7,140 EUI visits (41× baseline), almost certainly a university workshop or class exercise.",
          },
          {
            color: "bg-amber-500",
            label: "Oct 2024 Event",
            text: "CDE, EUI, and RUI all spiked simultaneously in Oct 2024 — likely a conference demonstration.",
          },
          {
            color: "bg-violet-500",
            label: "RUI Growth",
            text: "RUI visits have gradually increased in 2025, possibly reflecting growing adoption in tissue registration workflows.",
          },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
