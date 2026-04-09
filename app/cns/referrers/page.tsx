import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/charts/DonutChart";
import ReferrerTrendChart from "../../components/charts/ReferrerTrendChart";
import Top404Chart from "../../components/charts/Top404Chart";

import referrers from "../../../public/data/cns/cns_referrers.json";
import referrerTrend from "../../../public/data/cns/cns_referrer_trend.json";

// Referrer colors
const REFERRER_COLORS: Record<string, string> = {
  Google: "#4285f4",
  "Google Scholar": "#0f9d58",
  Bing: "#00809d",
  Direct: "#71717a",
  DuckDuckGo: "#de5833",
  "HRA Portal": "#8b5cf6",
  "CNS GitHub": "#333333",
  "Sci-Maps": "#f59e0b",
  Yandex: "#ff0000",
  "IU (other)": "#06b6d4",
  HuBMAP: "#10b981",
  Other: "#a1a1aa",
};

// Filter out Self and Attack for external referrer analysis
const externalReferrers = referrers.filter(
  (d) => d.domain !== "Self (CNS)" && d.domain !== "Attack/Injection"
);
const totalExternal = externalReferrers.reduce((s, d) => s + d.count, 0);

// Get stats
const googleCount = referrers.find((d) => d.domain === "Google")?.count ?? 0;
const scholarCount = referrers.find((d) => d.domain === "Google Scholar")?.count ?? 0;
const bingCount = referrers.find((d) => d.domain === "Bing")?.count ?? 0;
const directCount = referrers.find((d) => d.domain === "Direct")?.count ?? 0;

// Donut data -- exclude Direct (94%+ dominance obscures all other sources)
const donutReferrers = externalReferrers.filter((d) => d.domain !== "Direct");
const donutTotal = donutReferrers.reduce((s, d) => s + d.count, 0);
const donutData = donutReferrers.map((d) => ({
  name: d.domain,
  value: d.count,
  color: REFERRER_COLORS[d.domain] ?? "#a1a1aa",
}));

// Bar chart data (top referring domains excluding Self, Attack, Direct, and Other)
const otherCount = externalReferrers.find((d) => d.domain === "Other")?.count ?? 0;
const barData = externalReferrers
  .filter((d) => d.domain !== "Direct" && d.domain !== "Other")
  .sort((a, b) => b.count - a.count)
  .map((d) => ({ path: d.domain, count: d.count }));

// Search engine comparison
const searchEngines = [
  { name: "Google", count: googleCount, color: "#4285f4" },
  { name: "Google Scholar", count: scholarCount, color: "#0f9d58" },
  { name: "Bing", count: bingCount, color: "#00809d" },
];
const searchTotal = searchEngines.reduce((s, e) => s + e.count, 0);

// Trend date range
const firstMonth = referrerTrend[0]?.month_year ?? "";
const lastMonth = referrerTrend[referrerTrend.length - 1]?.month_year ?? "";
const monthCount = referrerTrend.length;

export default function CNSReferrersPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">CNS Analytics</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Referrer Analysis</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Where CNS traffic comes from: search engines, direct visits, and external referrers
          across {monthCount} months of CloudFront logs ({firstMonth} to {lastMonth}).
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Google Referrals"
          value={googleCount.toLocaleString()}
          sub={`${((googleCount / totalExternal) * 100).toFixed(1)}% of external traffic`}
          accent="text-blue-400"
        />
        <StatCard
          label="Google Scholar"
          value={scholarCount.toLocaleString()}
          sub={`${((scholarCount / totalExternal) * 100).toFixed(1)}% of external traffic`}
          accent="text-emerald-400"
        />
        <StatCard
          label="Bing"
          value={bingCount.toLocaleString()}
          sub={`${((bingCount / totalExternal) * 100).toFixed(1)}% of external traffic`}
          accent="text-cyan-400"
        />
        <StatCard
          label="Direct Traffic"
          value={directCount.toLocaleString()}
          sub={`${((directCount / totalExternal) * 100).toFixed(1)}% of external traffic`}
        />
      </div>

      {/* Referrer breakdown donut */}
      <ChartCard
        title="Referrer Breakdown"
        subtitle="Excluding direct and self-referrals -- shows search engines, external sites, and aggregated sources"
        badge={`${donutTotal.toLocaleString()} referrals`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <DonutChart data={donutData} unit="referrals" height={320} />
      </ChartCard>

      {/* Referrer trend */}
      <ChartCard
        title="Referrer Trend Over Time"
        subtitle="Monthly referral volume by source. Direct traffic dominates; search engines are a small but steady stream."
        badge={`${monthCount} months`}
        badgeColor="bg-blue-500/10 text-blue-500 border-blue-500/20"
      >
        <ReferrerTrendChart data={referrerTrend} />
      </ChartCard>

      {/* Top referring domains bar */}
      <ChartCard
        title="Top Referring Domains"
        subtitle={`Named external domains sending traffic to CNS. ${otherCount.toLocaleString()} additional referrals from miscellaneous low-volume domains are grouped as "Other" and excluded.`}
        badge={`${barData.length} sources`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <Top404Chart data={barData} color="#3b82f6" label="referrals" />
      </ChartCard>

      {/* Search engine comparison */}
      <ChartCard
        title="Search Engine Comparison"
        subtitle="Google vs Google Scholar vs Bing as percentage of total search engine referrals"
        badge="Search Engines"
        badgeColor="bg-blue-500/10 text-blue-500 border-blue-500/20"
      >
        <div className="flex flex-col gap-4 py-2">
          {searchEngines.map((engine) => {
            const pct = searchTotal > 0 ? (engine.count / searchTotal) * 100 : 0;
            return (
              <div key={engine.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{engine.name}</span>
                  <span className="text-sm tabular-nums text-zinc-500">
                    {engine.count.toLocaleString()} <span className="text-zinc-600 dark:text-zinc-400">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: engine.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Insights callout cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Direct Dominance</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Direct traffic accounts for <span className="font-semibold text-blue-400">{((directCount / totalExternal) * 100).toFixed(1)}%</span> of
            all external referrals, indicating most visitors type the URL directly or use bookmarks.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Academic Reach</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Google Scholar drives <span className="font-semibold text-emerald-400">{scholarCount.toLocaleString()}</span> referrals,
            confirming CNS&apos;s presence in academic citation networks and research discovery.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sci-Maps Connection</span>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            The Sci-Maps project sends <span className="font-semibold text-amber-400">{(referrers.find((d) => d.domain === "Sci-Maps")?.count ?? 0).toLocaleString()}</span> referrals,
            reflecting the strong relationship between CNS visualization research and the broader mapping community.
          </p>
        </div>
      </div>
    </div>
  );
}
