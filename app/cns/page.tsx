import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import TrafficDonut from "../components/charts/TrafficDonut";
import DonutChart from "../components/charts/DonutChart";
import CNSYearlyChart from "../components/charts/CNSYearlyChart";
import CNSOverviewTrendChart from "../components/charts/CNSOverviewTrendChart";
import TopPagesChart from "../components/charts/TopPagesChart";

import CNSFundingChart from "../components/charts/CNSFundingChart";
import CNSFundingByYearChart from "../components/charts/CNSFundingByYearChart";

import metadata from "../../public/data/cns/cns_data_metadata.json";
import trafficTypes from "../../public/data/cns/cns_traffic_types.json";
import yearlyVisits from "../../public/data/cns/cns_yearly_visits.json";
import monthlyVisits from "../../public/data/cns/cns_monthly_visits.json";
import publications from "../../public/data/cns/cns_publications.json";
import cnsEvents from "../../public/data/cns/cns_events.json";
import funding from "../../public/data/cns/cns_funding.json";
import topPages from "../../public/data/cns/cns_top_pages.json";
import geoData from "../../public/data/cns/cns_geo_distribution.json";
import contentBreakdown from "../../public/data/cns/cns_content_breakdown.json";
import cachePerformance from "../../public/data/cns/cns_cache_performance.json";
import cnsNews from "../../public/data/cns/cns_news.json";

/* ── Derived stats ──────────────────────────────────────────────────────────── */

function fmtDate(iso: string): string {
  const [y, m] = iso.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m) - 1]} ${y}`;
}

const humanCount = trafficTypes.find((d) => d.type === "Likely Human")?.count ?? 0;
const totalRequests = trafficTypes.reduce((sum, d) => sum + d.count, 0);
const humanPct = ((humanCount / totalRequests) * 100).toFixed(1);
const countryCount = geoData.filter((d) => d.c_country !== "-").length;
const dateRange = `${fmtDate(metadata.first_date)} – ${fmtDate(metadata.last_date)}`;

const topCountry = geoData[0];
const usVisits = topCountry?.visits ?? 0;
const usPct = ((usVisits / geoData.reduce((s, d) => s + d.visits, 0)) * 100).toFixed(1);

// Content insights
const teamPhotoVisits = contentBreakdown.find((d) => d.type === "Team Photos")?.count ?? 0;
const pubVisits = contentBreakdown.find((d) => d.type === "Publications")?.count ?? 0;
const presVisits = contentBreakdown.find((d) => d.type === "Presentations")?.count ?? 0;

// Content donut colors
const CONTENT_COLORS: Record<string, string> = {
  "Team Photos": "#ec4899",
  "Other PDFs": "#a1a1aa",
  Presentations: "#3b82f6",
  Publications: "#8b5cf6",
  "Team Pages": "#f43f5e",
  Workshops: "#10b981",
  "Publications Page": "#7c3aed",
  News: "#f59e0b",
  Contact: "#06b6d4",
  Jobs: "#14b8a6",
  "Presentations Page": "#60a5fa",
  Homepage: "#6366f1",
  "Dead Link Redirects": "#ef4444",
  "Scanner/Probe Traffic": "#78716c",
};

const contentDonutData = contentBreakdown.map((d) => ({
  name: d.type,
  value: d.count,
  color: CONTENT_COLORS[d.type] ?? "#71717a",
}));

// Yearly growth
const fullYears = yearlyVisits.filter((d) => parseInt(d.year) >= 2019 && parseInt(d.year) <= 2025);
const peakYear = fullYears.reduce((mx, d) => (d.human > mx.human ? d : mx), fullYears[0]);

// AI Bot emergence
const aiTotal = trafficTypes.find((d) => d.type === "AI-Assistant / Bot")?.count ?? 0;
const aiPct = ((aiTotal / totalRequests) * 100).toFixed(1);

// Cache performance
const CACHE_COLORS: Record<string, string> = {
  Hit: "#10b981",
  Miss: "#f59e0b",
  Error: "#f43f5e",
  RefreshHit: "#3b82f6",
  Redirect: "#8b5cf6",
  Other: "#71717a",
};
const cacheTotal = cachePerformance.reduce((s, d) => s + d.count, 0);
const cacheHits = cachePerformance.find((d) => d.result_type === "Hit")?.count ?? 0;
const cacheRefreshHits = cachePerformance.find((d) => d.result_type === "RefreshHit")?.count ?? 0;
const cacheHitPct = cacheTotal > 0 ? (((cacheHits + cacheRefreshHits) / cacheTotal) * 100).toFixed(1) : "0";
const cacheDonutData = cachePerformance.map((d) => ({
  name: d.result_type,
  value: d.count,
  color: CACHE_COLORS[d.result_type] ?? "#71717a",
}));

// News stats
const newsCount = cnsNews.length;
const latestNewsDate = cnsNews.length > 0
  ? [...cnsNews].sort((a, b) => b.date.localeCompare(a.date))[0].date
  : "";
const latestNewsLabel = latestNewsDate
  ? (() => {
      const [y, m] = latestNewsDate.split("-");
      const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${names[parseInt(m) - 1]} ${y}`;
    })()
  : "N/A";

// Funding stats
const totalFunding = funding.reduce((s, d) => s + d.amount, 0);
const activeGrants = funding.filter((d) => d.date_end >= "2025-01-01").length;
const grantCount = funding.length;
const funderCounts = funding.reduce<Record<string, number>>((acc, d) => {
  const f = d.funder.trim();
  acc[f] = (acc[f] || 0) + 1;
  return acc;
}, {});
const topFunder = Object.entries(funderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
const topFunderShort = topFunder.length > 20 ? topFunder.replace(/National /g, "").replace(/ of Health| Foundation/g, "") : topFunder;

function fmtDollars(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function CNSOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          <span>CloudFront Log Analytics</span>
          <span>·</span>
          <span>Indiana University</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          CNS Website Analytics
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Traffic analytics for <span className="text-zinc-700 dark:text-zinc-300 font-medium">cns.iu.edu</span> derived from Amazon CloudFront access logs.
          Covers <span className="text-zinc-700 dark:text-zinc-300 font-medium">{dateRange}</span> · {fmtCompact(totalRequests)} total requests · {countryCount} countries.
        </p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Human Visits"
          value={fmtCompact(humanCount)}
          sub={`of ${fmtCompact(totalRequests)} total requests`}
          accent="text-blue-400"
        />
        <StatCard
          label="Date Range"
          value={dateRange}
          sub={`${metadata.total_rows.toLocaleString()} log rows`}
        />
        <StatCard
          label="Countries"
          value={countryCount.toString()}
          sub={`US = ${usPct}% of traffic`}
          accent="text-emerald-400"
        />
        <StatCard
          label="Human Traffic"
          value={`${humanPct}%`}
          sub="Of all CloudFront requests"
          accent="text-violet-400"
        />
        <StatCard
          label="News Articles"
          value={newsCount.toString()}
          sub={`Latest: ${latestNewsLabel}`}
          accent="text-cyan-400"
        />
      </div>

      {/* Traffic donut + Yearly bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ChartCard
          title="Traffic Type Breakdown"
          subtitle={`${totalRequests.toLocaleString()} total CloudFront requests`}
          className="lg:col-span-2"
        >
          <TrafficDonut data={trafficTypes} />
        </ChartCard>

        <ChartCard
          title="Yearly Traffic Volume"
          subtitle="Human, bot, and AI-bot requests per year (stacked)"
          className="lg:col-span-3"
        >
          <CNSYearlyChart data={yearlyVisits} />
        </ChartCard>
      </div>

      {/* Monthly trend with publications */}
      <ChartCard
        title="Monthly Human Traffic with Publications & Events"
        subtitle="Blue line = monthly human visits, purple bars = publications, amber bars = events"
        badge={`${monthlyVisits.length} months`}
        badgeColor="bg-blue-500/10 text-blue-500 border-blue-500/20"
      >
        <CNSOverviewTrendChart data={monthlyVisits} publications={publications} events={cnsEvents} />
      </ChartCard>

      {/* Top pages */}
      <ChartCard
        title="Top 10 Most Visited Pages"
        subtitle="Pages ranked by total CloudFront request count"
        badge="All Time"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <TopPagesChart data={topPages} count={10} />
      </ChartCard>

      {/* Content breakdown donut */}
      <ChartCard
        title="Content Type Breakdown"
        subtitle="Requests categorized by content type served"
      >
        <DonutChart data={contentDonutData} unit="requests" />
      </ChartCard>

      {/* CDN Cache Performance */}
      <ChartCard
        title="CDN Cache Performance"
        subtitle={`${cacheHitPct}% effective hit rate (Hit + RefreshHit) across ${fmtCompact(cacheTotal)} requests`}
        badge="CloudFront"
        badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      >
        <DonutChart data={cacheDonutData} unit="requests" />
      </ChartCard>

      {/* ── Funding Section ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Research Funding</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Funding"
          value={fmtDollars(totalFunding)}
          sub={`${grantCount} grants total`}
          accent="text-emerald-400"
        />
        <StatCard
          label="Active Grants"
          value={activeGrants.toString()}
          sub="End date >= Jan 2025"
          accent="text-blue-400"
        />
        <StatCard
          label="Top Funder"
          value={topFunderShort}
          sub={`${funderCounts[topFunder]} grants`}
          accent="text-violet-400"
        />
        <StatCard
          label="Grant Count"
          value={grantCount.toString()}
          sub={`${Object.keys(funderCounts).length} unique funders`}
          accent="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Grant Timeline (Top 20 by Amount)"
          subtitle="Horizontal bars show grant duration, colored by funder"
          badge="Gantt"
          badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        >
          <CNSFundingChart data={funding} />
        </ChartCard>

        <ChartCard
          title="Active Funding by Year"
          subtitle="Annual funding amount distributed across active grant years, stacked by funder"
        >
          <CNSFundingByYearChart data={funding} />
        </ChartCard>
      </div>

      {/* Insight callout cards */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Key Findings</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Growth Trajectory</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Human traffic peaked at{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(peakYear.human)} requests in {peakYear.year}</span> — a steady climb from early CloudFront logging.
            2023 and 2024 show sustained high traffic above 2M human requests per year.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">AI Crawler Emergence</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            AI-assistant bots account for{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(aiTotal)} requests ({aiPct}%)</span> — first appearing mid-2023. LLM training crawlers are actively
            indexing CNS&apos;s research publications and team data.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Content Demand</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Team photos draw{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(teamPhotoVisits)} requests</span>, publications{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(pubVisits)}</span>, and presentations{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(presVisits)}</span> — research outputs are a primary traffic driver.
          </p>
        </div>
      </div>
    </div>
  );
}
