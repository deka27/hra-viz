import ChartCard from "../components/ChartCard";
import MonthlyTrendsChart from "../components/charts/MonthlyTrendsChart";
import YearlyGroupedBar from "../components/charts/YearlyGroupedBar";
import DonutChart from "../components/charts/DonutChart";
import StatCard from "../components/StatCard";
import ToolHourlyHeatmap from "../components/charts/ToolHourlyHeatmap";
import TrafficByDowChart from "../components/charts/TrafficByDowChart";
import { ErrorSourceChart, ErrorCauseChart } from "../components/charts/ErrorBreakdownChart";
import MonthlyErrorTrendChart from "../components/charts/MonthlyErrorTrendChart";

import monthlyData from "../../public/data/tool_visits_by_month.json";
import yearlyData from "../../public/data/tool_visits_by_year.json";
import totalData from "../../public/data/total_tool_visits.json";
import hourlyHeatmapData from "../../public/data/tool_hourly_heatmap.json";
import dowData from "../../public/data/traffic_by_dow.json";
import eventTypes from "../../public/data/event_types.json";
import errorClusters from "../../public/data/error_clusters.json";
import monthlyErrorData from "../../public/data/monthly_error_trend.json";
import errorBreakdown from "../../public/data/error_breakdown.json";

const TOOL_CARD_COLORS: Record<string, string> = {
  "KG Explorer": "text-rose-400",
  "EUI": "text-blue-400",
  "RUI": "text-violet-400",
  "CDE": "text-amber-400",
  "FTU Explorer": "text-emerald-400",
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
        <MonthlyTrendsChart data={monthlyData} />
      </ChartCard>

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
          accent="text-rose-400"
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
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Error rate by tool</p>
            <ErrorSourceChart />
            <p className="text-xs text-zinc-500 mt-2">
              RUI and CDE are nearly clean. KG Explorer and EUI drive the bulk of errors.
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
              <span className="font-semibold">API CORS failure</span> — <code className="text-zinc-600 dark:text-zinc-400 text-[10px]">technology-names</code> endpoint returns
              &ldquo;0 Unknown Error&rdquo;. Fix CORS headers on <code className="text-zinc-600 dark:text-zinc-400 text-[10px]">apps.humanatlas.io/api/v1</code>.
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
              <span className="font-semibold">EUI null ref in 3D picker</span> —{" "}
              <code className="text-zinc-600 dark:text-zinc-400 text-[10px]">Cannot read properties of null (reading &apos;0&apos;)</code> in{" "}
              <code className="text-zinc-600 dark:text-zinc-400 text-[10px]">getLastPickedObject</code>. Add null guard before accessing index.
            </p>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Error Volume Over Time"
        subtitle="Monthly error events by tool · Oct 2025 spike = KG Explorer launch + CDN icon failures · trend improving"
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
              before app-attribution is set in the event payload. These overlap with the KG icon failures.
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
