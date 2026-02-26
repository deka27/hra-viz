import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import ToolVisitsChart from "./components/charts/ToolVisitsChart";
import TrafficDonut from "./components/charts/TrafficDonut";
import TotalVisitsSparkline from "./components/charts/TotalVisitsSparkline";
import HourlyTrafficChart from "./components/charts/HourlyTrafficChart";
import RequestFunnelInfographic from "./components/RequestFunnelInfographic";
import EventTypesChart from "./components/charts/EventTypesChart";
import TopPathsByEventChart from "./components/charts/TopPathsByEventChart";

import totalToolVisits from "../public/data/total_tool_visits.json";
import trafficTypes from "../public/data/traffic_types.json";
import monthlyData from "../public/data/tool_visits_by_month.json";
import geoData from "../public/data/geo_distribution.json";
import referrers from "../public/data/referrers.json";
import requestTypeBreakdown from "../public/data/request_type_breakdown.json";
import eventTypes from "../public/data/event_types.json";
import topPathsByEvent from "../public/data/top_paths_by_event.json";
import opacityData from "../public/data/opacity_interactions.json";
import spatialSearch from "../public/data/spatial_search.json";

function fmtMonth(ym: string): string {
  const [y, mo] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

const totalVisits = totalToolVisits.reduce((sum, d) => sum + d.visits, 0);
const humanCount = trafficTypes.find((d) => d.type === "Likely Human")?.count ?? 0;
const totalRequests = trafficTypes.reduce((sum, d) => sum + d.count, 0);
const humanPct = ((humanCount / totalRequests) * 100).toFixed(1);
const numTools = totalToolVisits.length;
const countryCount = geoData.filter((d) => d.c_country !== "-").length;
const dateRange = `${fmtMonth(monthlyData[0].month_year)} – ${fmtMonth(monthlyData[monthlyData.length - 1].month_year)}`;
const numMonths = monthlyData.length;
const gtexRequests = referrers.find((d) => d.name === "GTEx Portal")?.value ?? 0;
const hubmapRequests = referrers.find((d) => d.name === "HubMAP")?.value ?? 0;
const totalEvents = eventTypes.reduce((s, d) => s + d.count, 0);
const clickCount = eventTypes.find((d) => d.event === "click")?.count ?? 0;
const clickPct = ((clickCount / totalEvents) * 100).toFixed(1);
const opacityTotal = opacityData.reduce((s, d) => s + d.count, 0);
const spatialTotal = spatialSearch.reduce((s, d) => s + d.count, 0);

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function OverviewPage() {
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
          Human Reference Atlas Tools
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Usage analytics for the HRA portal tools derived from Amazon CloudFront access logs.
          Covers <span className="text-zinc-700 dark:text-zinc-300 font-medium">{dateRange}</span> · {numTools} tools · {countryCount} countries.
        </p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tool Visits"
          value={totalVisits.toLocaleString()}
          sub={`Across all ${numTools} HRA tools`}
          accent="text-blue-400"
        />
        <StatCard
          label="Human Traffic"
          value={`${humanPct}%`}
          sub={`of ${(totalRequests / 1_000_000).toFixed(1)}M CloudFront requests`}
          accent="text-emerald-400"
        />
        <StatCard
          label="Tools Analyzed"
          value={numTools.toString()}
          sub="EUI · RUI · CDE · FTU · KG"
        />
        <StatCard
          label="Countries Reached"
          value={countryCount.toString()}
          sub="From US to Singapore to Ecuador"
          accent="text-rose-400"
        />
      </div>

      {/* Funnel insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Clean Traffic</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{humanPct}% human</span> traffic is unusually
            clean for a public scientific API — industry average for open endpoints is 40–60%.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">AI Crawlers</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(trafficTypes.find(d => d.type === "AI-Assistant / Bot")?.count ?? 0)} AI-bot requests</span> — LLM training crawlers are actively
            indexing HRA&apos;s open biomedical ontology and atlas data.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">The 226× Gap</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Each tracked visit fires{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">~{Math.round(humanCount / totalVisits)} HTTP requests</span> —
            JS bundles, fonts, API calls, map tiles. CDN volume alone badly overstates actual user engagement.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Visit Concentration</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            KG Explorer captures{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{((totalToolVisits.find(d => d.tool === "KG Explorer")?.visits ?? 0) / totalVisits * 100).toFixed(1)}% of all visits</span> despite
            launching just months ago — reshaping the tool landscape faster than any prior release.
          </p>
        </div>
      </div>

      {/* Request funnel Sankey — first chart */}
      <ChartCard
        title="From 12.78M Requests to 43K Tool Visits"
        subtitle="4-level flow: all CloudFront traffic → traffic type → tracked vs. infra → individual tools"
      >
        <RequestFunnelInfographic trafficTypes={trafficTypes} totalVisits={totalVisits} toolVisits={totalToolVisits} requestTypes={requestTypeBreakdown} />
      </ChartCard>



      {/* Monthly sparkline */}
      <ChartCard
        title="Total Tool Visits by Month"
        subtitle={`Combined visits across all ${numTools} HRA tools, ${dateRange}`}
        badge={`${numMonths} months`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <TotalVisitsSparkline data={monthlyData} />
      </ChartCard>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ChartCard
          title="Total Visits by Tool"
          subtitle={`Cumulative page visits per HRA tool, ${dateRange}`}
          className="lg:col-span-3"
        >
          <ToolVisitsChart data={totalToolVisits} />
        </ChartCard>

        <ChartCard
          title="Traffic Breakdown"
          subtitle={`${totalRequests.toLocaleString()} total CloudFront requests`}
          className="lg:col-span-2"
        >
          <TrafficDonut data={trafficTypes} />
        </ChartCard>
      </div>

      {/* Hourly traffic pattern */}
      <ChartCard
        title="When Are Users Active?"
        subtitle="Traffic distribution by hour of day — human CloudFront requests, all sites"
        badge="EST / EDT"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <HourlyTrafficChart />
      </ChartCard>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Interactivity Snapshot</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Interactions"
          value={totalEvents.toLocaleString()}
          sub="Clicks, hovers, keys, errors"
        />
        <StatCard
          label="Click Share"
          value={`${clickPct}%`}
          sub={`${clickCount.toLocaleString()} click interactions`}
          accent="text-blue-400"
        />
        <StatCard
          label="Opacity Toggles (RUI)"
          value={opacityTotal.toLocaleString()}
          sub="Low adoption — hidden feature"
          accent="text-violet-400"
        />
        <StatCard
          label="Spatial Searches (EUI)"
          value={spatialTotal.toLocaleString()}
          sub="978 total interactions"
          accent="text-blue-400"
        />
      </div>

      <ChartCard
        title="Interaction Types Across All Tools"
        subtitle={`${totalEvents.toLocaleString()} total logged interactions across all HRA tools`}
        badge="Cross-Tool"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <EventTypesChart data={eventTypes} />
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">Most common</span>
            <span className="text-sm font-semibold text-blue-400">Click ({clickPct}%)</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">Event types tracked</span>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{eventTypes.length} categories</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">Keyboard use</span>
            <span className="text-sm font-semibold text-amber-400">Significant — RUI keyboard nav</span>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Where Are Clicks and Hovers Happening?"
        subtitle="Top 15 UI elements per interaction type · color = tool · hover a bar for full path"
        badge="Cross-Tool"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <TopPathsByEventChart data={topPathsByEvent as Record<string, { path: string; count: number }[]>} />
      </ChartCard>

      {/* Quick callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Surge Event</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            EUI visits spiked from{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">171 → 7,140</span> in March 2024 —
            a 41× jump. Probably an internal HuBMAP/HRA training session (no public record found).
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Undiscovered Feature</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            RUI opacity controls used only{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">196 times</span> total across 5,161 visits — a powerful but buried feature.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Breakout Tool</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            KG Explorer launched Aug 2025 and hit{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">3,891 visits/mo</span> by October — now the most-visited HRA tool.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ecosystem Integration</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            GTEx Portal generates{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(gtexRequests)} API calls</span> to HRA — the largest external consumer, ahead of HubMAP ({fmtCompact(hubmapRequests)}).
          </p>
        </div>
      </div>
    </div>
  );
}
