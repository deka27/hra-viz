import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import HTTPStatusChart from "../../components/charts/HTTPStatusChart";
import MonthlyHTTPErrorChart from "../../components/charts/MonthlyHTTPErrorChart";
import Top404Chart from "../../components/charts/Top404Chart";
import SecuritySignalsChart from "../../components/charts/SecuritySignalsChart";
import CNSErrorCategoryChart from "../../components/charts/CNSErrorCategoryChart";
import CNSErrorRateChart from "../../components/charts/CNSErrorRateChart";
import CNSErrorDrilldownPanel from "../../components/charts/CNSErrorDrilldownPanel";

import httpStatus from "../../../public/data/cns/cns_http_status.json";
import monthlyErrors from "../../../public/data/cns/cns_monthly_errors.json";
import top404s from "../../../public/data/cns/cns_top_404s.json";
import top500s from "../../../public/data/cns/cns_top_500s.json";
import deadLinks from "../../../public/data/cns/cns_dead_links.json";
import securitySignals from "../../../public/data/cns/cns_security_signals.json";
import errorCategories from "../../../public/data/cns/cns_error_categories.json";
import monthlyErrorRate from "../../../public/data/cns/cns_monthly_error_rate.json";
import topErrorsByMonth from "../../../public/data/cns/cns_top_errors_by_month.json";
import metadata from "../../../public/data/cns/cns_data_metadata.json";

// Derive stats from data
const total404 = httpStatus.find((d) => d.status === 404)?.count ?? 0;
const total500 = httpStatus.find((d) => d.status === 500)?.count ?? 0;
const total403 = httpStatus.find((d) => d.status === 403)?.count ?? 0;
const deadLinkHits = deadLinks.reduce((s, d) => s + d.count, 0);
const securityTotal = securitySignals.reduce((s, d) => s + d.count, 0);
const totalRequests = httpStatus.reduce((s, d) => s + d.count, 0);
const totalErrors = total404 + total500 + total403;
const errorRate = ((totalErrors / totalRequests) * 100).toFixed(1);

// Aggregate error categories for fix priority cards
const catMap = new Map<string, number>();
errorCategories.forEach((d) => {
  catMap.set(d.category, (catMap.get(d.category) ?? 0) + d.count);
});
const deadLinkCount = deadLinkHits;
const missingPdfCount = (catMap.get("Missing PDFs (404)") ?? 0) + (catMap.get("Missing Documents (404)") ?? 0);
const homepageServerErrors = catMap.get("Homepage Server Errors (500)") ?? 0;
const scannerProbes404 = catMap.get("Scanner/Attack Probes (404)") ?? 0;
const scannerProbes500 = catMap.get("Scanner-Triggered Server Errors (500)") ?? 0;
const scannerTotal = scannerProbes404 + scannerProbes500;

// Extract destination URL from dead link query strings for display
function extractDeadLinkUrl(raw: string): string {
  try {
    const params = new URLSearchParams(raw.startsWith("?") ? raw : `?${raw}`);
    const url = params.get("url");
    if (url) {
      return decodeURIComponent(url)
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
    }
  } catch {
    // fall through
  }
  return raw.length > 60 ? raw.slice(0, 57) + "..." : raw;
}

const deadLinkDisplay = deadLinks.map((d) => ({
  path: extractDeadLinkUrl(d.url),
  count: d.count,
}));

// Monthly error date range
const firstMonth = monthlyErrors[0]?.month_year ?? "";
const lastMonth = monthlyErrors[monthlyErrors.length - 1]?.month_year ?? "";
const monthCount = monthlyErrors.length;

// Exclude partial months (current month from metadata last_date) so "peak" calcs
// are not distorted by in-flight data. Also safety threshold on total_errors.
const currentPartialMonth = metadata.last_date.slice(0, 7); // e.g., "2026-04"
const completeMonthlyErrors = monthlyErrors.filter(
  (d) => d.month_year !== currentPartialMonth && d.total_errors > 20000
);

// Peak 500-error month (dynamically derived from complete months)
const maxErrorMonth = completeMonthlyErrors.reduce(
  (mx, d) => (d.s500 > mx.s500 ? d : mx),
  completeMonthlyErrors[0]
);

function fmtMonthLabel(ym: string): string {
  const [y, mo] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

function fmtKCompact(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString();
}

const peakErrorMonthLabel = fmtMonthLabel(maxErrorMonth.month_year);
const peakErrorMonthValue = fmtKCompact(maxErrorMonth.s500);

// Category chart data: aggregate by category
const categoryChartData = [...catMap.entries()]
  .map(([category, count]) => ({ category, count }))
  .sort((a, b) => b.count - a.count);

export default function CNSErrorsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">CNS Analytics</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Errors + Security</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          HTTP error analysis and security threat signals from {monthCount} months of CloudFront logs
          ({firstMonth} to {lastMonth}). The combined error rate is {errorRate}% of all {totalRequests.toLocaleString()} requests.
        </p>
      </div>

      {/* 1. Stat cards (existing + error rate) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Error Rate"
          value={`${errorRate}%`}
          sub={`${totalErrors.toLocaleString()} errors / ${totalRequests.toLocaleString()} requests`}
          accent="text-red-400"
        />
        <StatCard
          label="Total 404s"
          value={total404.toLocaleString()}
          sub={`${((total404 / totalRequests) * 100).toFixed(1)}% of all requests`}
          accent="text-amber-400"
        />
        <StatCard
          label="Total 500s"
          value={total500.toLocaleString()}
          sub={`${((total500 / totalRequests) * 100).toFixed(1)}% of all requests`}
          accent="text-rose-400"
        />
        <StatCard
          label="Dead Link Hits"
          value={deadLinkHits.toLocaleString()}
          sub={`${deadLinks.length} unique dead link targets`}
          accent="text-orange-400"
        />
        <StatCard
          label="Security Signals"
          value={securityTotal.toLocaleString()}
          sub={`${securitySignals.length} attack categories detected`}
          accent="text-violet-400"
        />
      </div>

      {/* 2. HTTP Status donut (existing) */}
      <ChartCard
        title="HTTP Status Code Distribution"
        subtitle="Breakdown of all response status codes across CloudFront logs"
        badge={`${totalRequests.toLocaleString()} requests`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <HTTPStatusChart data={httpStatus} />
      </ChartCard>

      {/* 3. Error category bar (NEW) */}
      <ChartCard
        title="Error Categories"
        subtitle="Errors grouped into actionable buckets. Scanner probes dominate 404s; server errors cluster on legacy scripts and homepage."
        badge={`${categoryChartData.length} categories`}
        badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
      >
        <CNSErrorCategoryChart data={categoryChartData} />
      </ChartCard>

      {/* 4. Error rate over time (NEW) */}
      <ChartCard
        title="Error Rate Over Time"
        subtitle={`Monthly total requests vs errors with error rate percentage. Rate spiked above 40% during 2021 traffic surges and the ${peakErrorMonthLabel} 500-error peak.`}
        badge={`${monthCount} months`}
        badgeColor="bg-blue-500/10 text-blue-500 border-blue-500/20"
      >
        <CNSErrorRateChart data={monthlyErrorRate} />
      </ChartCard>

      {/* 5. Monthly Error Drilldown */}
      <ChartCard
        title="Monthly Error Drilldown"
        subtitle="Click a month to see the top recurring error paths — useful for identifying persistent issues"
        badge={`${monthCount} months`}
        badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
      >
        <CNSErrorDrilldownPanel
          monthlyErrors={monthlyErrors}
          topErrorsByMonth={topErrorsByMonth}
        />
      </ChartCard>

      {/* 6. Fix priority cards */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Fix Priorities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fix #1: Dead links */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold">1</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dead Links</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              {deadLinkCount.toLocaleString()} <span className="text-sm font-normal text-zinc-500">hits</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Visitors hitting redirect pages for {deadLinks.length} URLs that no longer exist (mostly scimaps.org links).
            </p>
            <div className="text-xs font-medium text-rose-500 bg-rose-500/5 rounded-md px-2 py-1 inline-block">
              Fix: Update or remove broken external links
            </div>
          </div>

          {/* Fix #2: Missing PDFs/docs */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">2</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Missing PDFs/Docs</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              {missingPdfCount.toLocaleString()} <span className="text-sm font-normal text-zinc-500">404s</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Requests for PDF publications, reports, and documents that have been moved or deleted.
            </p>
            <div className="text-xs font-medium text-amber-500 bg-amber-500/5 rounded-md px-2 py-1 inline-block">
              Fix: Add 301 redirects for moved documents
            </div>
          </div>

          {/* Fix #3: Homepage server errors */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">3</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Homepage 500s</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              {homepageServerErrors.toLocaleString()} <span className="text-sm font-normal text-zinc-500">errors</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Server errors on the homepage (&apos;/&apos;) affecting real visitors. These are distinct from scanner-triggered 500s.
            </p>
            <div className="text-xs font-medium text-blue-500 bg-blue-500/5 rounded-md px-2 py-1 inline-block">
              Fix: Investigate backend / caching issues
            </div>
          </div>
        </div>

        {/* Scanner noise callout */}
        <div className="mt-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Note:</span>{" "}
            {scannerTotal.toLocaleString()} errors ({((scannerTotal / totalErrors) * 100).toFixed(0)}%) are from automated scanners probing for WordPress, PHP scripts, and admin panels.
            These are noise and do not require content fixes -- WAF rules or rate limiting can suppress them.
          </p>
        </div>
      </div>

      {/* 6. Monthly error trend (existing) */}
      <ChartCard
        title="Monthly Error Trend"
        subtitle={`Stacked area of 404, 500, and 403 errors over time. 500 errors surged starting late 2023. Note: ${fmtMonthLabel(currentPartialMonth)} is a partial month (data through ${metadata.last_date}) and is excluded from peak calculations.`}
        badge={`${monthCount} months`}
        badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
      >
        <MonthlyHTTPErrorChart data={monthlyErrors} />
      </ChartCard>

      {/* 7. Two-column: Top 404s and Top 500s (existing) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Top 404 Paths"
          subtitle="Most-requested paths returning 404 Not Found. Many are attack probes (wp-login.php, .env)."
          badge={`${top404s.length} paths`}
          badgeColor="bg-amber-500/10 text-amber-500 border-amber-500/20"
        >
          <Top404Chart data={top404s} color="#f59e0b" label="404 hits" />
        </ChartCard>

        <ChartCard
          title="Top 500 Error Paths"
          subtitle="Paths triggering the most server errors. Many are attack probes hitting non-existent scripts."
          badge={`${top500s.length} paths`}
          badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
        >
          <Top404Chart data={top500s} color="#f43f5e" label="500 errors" />
        </ChartCard>
      </div>

      {/* 8. Dead links (existing) */}
      <ChartCard
        title="Dead Link Analysis"
        subtitle="External URLs that visitors attempted to reach via CNS redirect pages. These link targets are no longer valid."
        badge={`${deadLinks.length} dead targets`}
        badgeColor="bg-orange-500/10 text-orange-500 border-orange-500/20"
      >
        <Top404Chart data={deadLinkDisplay} color="#f97316" label="attempts" />
      </ChartCard>

      {/* 9. Security signals (existing) */}
      <ChartCard
        title="Security Threat Signals"
        subtitle="Attack patterns detected in CloudFront request paths and query strings"
        badge={`${securityTotal.toLocaleString()} total`}
        badgeColor="bg-violet-500/10 text-violet-500 border-violet-500/20"
      >
        <SecuritySignalsChart data={securitySignals} />
      </ChartCard>

      {/* 10. Insights callout cards (existing) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">500 Error Surge</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            500 errors became the dominant error type starting Nov 2023, likely from backend infrastructure changes.
            Monthly 500s peaked at <span className="font-semibold text-rose-400">{peakErrorMonthValue} in {peakErrorMonthLabel}</span>.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Attack Surface</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Top 404 paths are dominated by attack probes (wp-login.php, .env, xmlrpc.php).
            Legitimate 404s include legacy PDFs and workshop pages that have moved.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Top Threats</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Path traversal and admin panel probes account for the majority of security signals,
            followed by WordPress brute-force attempts and XSS/SQL injection probes.
          </p>
        </div>
      </div>
    </div>
  );
}
