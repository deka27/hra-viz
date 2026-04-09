import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import HTTPStatusChart from "../../components/charts/HTTPStatusChart";
import MonthlyHTTPErrorChart from "../../components/charts/MonthlyHTTPErrorChart";
import Top404Chart from "../../components/charts/Top404Chart";
import SecuritySignalsChart from "../../components/charts/SecuritySignalsChart";

import httpStatus from "../../../public/data/cns/cns_http_status.json";
import monthlyErrors from "../../../public/data/cns/cns_monthly_errors.json";
import top404s from "../../../public/data/cns/cns_top_404s.json";
import top500s from "../../../public/data/cns/cns_top_500s.json";
import deadLinks from "../../../public/data/cns/cns_dead_links.json";
import securitySignals from "../../../public/data/cns/cns_security_signals.json";

// Derive stats from data
const total404 = httpStatus.find((d) => d.status === 404)?.count ?? 0;
const total500 = httpStatus.find((d) => d.status === 500)?.count ?? 0;
const total403 = httpStatus.find((d) => d.status === 403)?.count ?? 0;
const deadLinkHits = deadLinks.reduce((s, d) => s + d.count, 0);
const securityTotal = securitySignals.reduce((s, d) => s + d.count, 0);
const totalRequests = httpStatus.reduce((s, d) => s + d.count, 0);
const errorRate = (((total404 + total500 + total403) / totalRequests) * 100).toFixed(1);

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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* HTTP Status donut */}
      <ChartCard
        title="HTTP Status Code Distribution"
        subtitle="Breakdown of all response status codes across CloudFront logs"
        badge={`${totalRequests.toLocaleString()} requests`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <HTTPStatusChart data={httpStatus} />
      </ChartCard>

      {/* Monthly error trend */}
      <ChartCard
        title="Monthly Error Trend"
        subtitle="Stacked area of 404, 500, and 403 errors over time. 500 errors surged starting late 2023."
        badge={`${monthCount} months`}
        badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
      >
        <MonthlyHTTPErrorChart data={monthlyErrors} />
      </ChartCard>

      {/* Two-column: Top 404s and Top 500s */}
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

      {/* Dead links */}
      <ChartCard
        title="Dead Link Analysis"
        subtitle="External URLs that visitors attempted to reach via CNS redirect pages. These link targets are no longer valid."
        badge={`${deadLinks.length} dead targets`}
        badgeColor="bg-orange-500/10 text-orange-500 border-orange-500/20"
      >
        <Top404Chart data={deadLinkDisplay} color="#f97316" label="attempts" />
      </ChartCard>

      {/* Security signals */}
      <ChartCard
        title="Security Threat Signals"
        subtitle="Attack patterns detected in CloudFront request paths and query strings"
        badge={`${securityTotal.toLocaleString()} total`}
        badgeColor="bg-violet-500/10 text-violet-500 border-violet-500/20"
      >
        <SecuritySignalsChart data={securitySignals} />
      </ChartCard>

      {/* Insights callout cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">500 Error Surge</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            500 errors became the dominant error type starting Nov 2023, likely from backend infrastructure changes.
            Monthly 500s peaked at <span className="font-semibold text-rose-400">118K in Apr 2025</span>.
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
