import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import GeoBarChart from "../components/charts/GeoBarChart";
import GeoRegionDonut from "../components/charts/GeoRegionDonut";
import DonutChart from "../components/charts/DonutChart";
import WorldMapChart from "../components/charts/WorldMapChart";
import GeoToolPreferenceChart from "../components/charts/GeoToolPreferenceChart";
import GeoBotChart from "../components/charts/GeoBotChart";

import geoData from "../../public/data/geo_distribution.json";
import geoToolPref from "../../public/data/geo_tool_preference.json";
import geoToolBreakdown from "../../public/data/geo_tool_breakdown.json";
import geoBotData from "../../public/data/geo_bot_traffic.json";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  SG: "Singapore",
  FR: "France",
  HK: "Hong Kong",
  IE: "Ireland",
};

function countryName(code?: string): string {
  if (!code) return "Unknown";
  return COUNTRY_NAMES[code] ?? code;
}

const filtered = geoData.filter((d) => d.c_country !== "-");
const total = filtered.reduce((s, d) => s + d.visits, 0);
const usVisits = filtered.find((d) => d.c_country === "US")?.visits ?? 0;
const intlVisits = total - usVisits;
const countryCount = filtered.length;
const asiaCodes = ["HK","SG","JP","CN","KR","AU","IN","VN","TW","PH","ID","MY","TH","BD","NZ","PK"];
const apTotal = filtered.filter((d) => asiaCodes.includes(d.c_country)).reduce((s, d) => s + d.visits, 0);

// Tool preference insights
const kgDominantCount = geoToolPref.filter((d) => d.c_country !== "US" && d.top_tool === "KG Explorer").length;
const intlCountries = geoToolPref.filter((d) => d.c_country !== "US").length;

// Bot insights
const topBotCountry = geoBotData[0];
const highBotRateCountries = [...geoBotData]
  .filter((d) => d.c_country !== "US")
  .sort((a, b) => b.bot_pct - a.bot_pct)
  .slice(0, 2);
const highBotRateA = highBotRateCountries[0];
const highBotRateB = highBotRateCountries[1];

export default function GeoPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Geographic Distribution</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Global Reach of HRA Tools</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          HRA tools are accessed from {countryCount} countries. While the US dominates overall visits,
          KG Explorer has captured {kgDominantCount} of {intlCountries} international markets.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Countries" value={countryCount.toString()} sub="Countries with recorded visits" accent="text-blue-400" />
        <StatCard label="US Visits" value={usVisits.toLocaleString()} sub={`${((usVisits / total) * 100).toFixed(1)}% of total`} accent="text-blue-400" />
        <StatCard label="International" value={intlVisits.toLocaleString()} sub={`${((intlVisits / total) * 100).toFixed(1)}% from outside US`} />
        <StatCard label="Asia-Pacific" value={apTotal.toLocaleString()} sub={`${((apTotal / total) * 100).toFixed(1)}% of total visits`} accent="text-rose-400" />
      </div>

      {/* World map */}
      <ChartCard
        title="World Map — Visits by Country"
        subtitle="Scroll or pinch to zoom · Hover a country for details · Blue intensity = visit count"
        badge={`${countryCount} countries`}
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <WorldMapChart data={geoData} toolPref={geoToolPref} botData={geoBotData} />
      </ChartCard>

      {/* Top countries bar */}
      <ChartCard
        title="Top 20 Countries by Visits"
        subtitle="Color-coded by region: blue = Americas, violet = Europe, rose = Asia-Pacific, amber = Middle East & Africa"
        badge="Top 20"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <GeoBarChart data={geoData} />
      </ChartCard>

      {/* Tool preference by country */}
      <ChartCard
        title="Which Tool Does Each Country Favor?"
        subtitle="Bar length = total visits · Color = most-used tool · Label = dominant tool + its % share · Top 30 countries"
        badge="Tool Preference"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <GeoToolPreferenceChart data={geoToolBreakdown} />
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">US vs. World</span>
            <p className="text-sm text-zinc-300">
              The <span className="text-blue-400 font-semibold">US prefers EUI</span> (42% of visits) —
              reflecting its long-established role as the primary spatial exploration tool.
              Every other top-30 country except Ecuador favors KG Explorer.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">KG Explorer&apos;s International Capture</span>
            <p className="text-sm text-zinc-300">
              <span className="text-rose-400 font-semibold">KG Explorer dominates {kgDominantCount} of {intlCountries} international markets</span> —
              launched Aug 2025, it became the default entry point for new international users
              within months.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Near-Exclusive Adoption</span>
            <p className="text-sm text-zinc-300">
              Hong Kong (98%), Japan (93%), South Korea (94%), and Ireland (86%) show
              near-exclusive KG Explorer preference — suggesting a{" "}
              <span className="text-rose-400 font-semibold">specific international research community</span> driving adoption.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Bot traffic by country */}
      <ChartCard
        title="Bot Traffic by Country"
        subtitle="Bot + AI-crawler requests per country · bar = volume · label = bot rate % of all requests from that country"
        badge="Traffic Quality"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <GeoBotChart data={geoBotData} />
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Volume vs Rate</span>
            <p className="text-sm text-zinc-300">
              {countryName(topBotCountry?.c_country)} has the highest bot volume ({topBotCountry?.bot_pct}% rate), while
              <span className="text-red-400 font-semibold"> {countryName(highBotRateA?.c_country)} ({highBotRateA?.bot_pct}%) and {countryName(highBotRateB?.c_country)} ({highBotRateB?.bot_pct}%)</span>{" "}
              show the highest bot-rate share among non-US countries.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Likely AI Crawlers</span>
            <p className="text-sm text-zinc-300">
              The &ldquo;AI-Assistant Bot&rdquo; category captures LLM training crawlers.
              {countryName(highBotRateA?.c_country)} and {countryName(highBotRateB?.c_country)} cloud regions
              appear to host many such crawlers targeting open scientific data APIs.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Clean Traffic</span>
            <p className="text-sm text-zinc-300">
              Hong Kong (1.1%) and Ireland (1.9%) have very low bot rates despite high human visit volumes —
              predominantly genuine research traffic.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Regional breakdown + US vs Intl */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Regional Breakdown" subtitle="Visit share by world region">
          <GeoRegionDonut data={geoData} />
        </ChartCard>

        <ChartCard title="US vs. International" subtitle="Domestic vs. global visit split">
          <DonutChart
            data={[
              { name: "United States", value: usVisits, color: "#3b82f6" },
              { name: "International", value: intlVisits, color: "#52525b" },
            ]}
            unit="visits"
          />
        </ChartCard>
      </div>

      {/* Notable country callouts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">Notable Country Patterns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { flag: "🇭🇰", country: "Hong Kong", code: "HK", color: "text-rose-400",
              note: "#2 globally — disproportionately high given population. Likely strong research institution usage." },
            { flag: "🇸🇬", country: "Singapore", code: "SG", color: "text-rose-400",
              note: "#3 globally — Singapore's biomedical research community is actively using HRA tools." },
            { flag: "🇯🇵", country: "Japan", code: "JP", color: "text-rose-400",
              note: "Strong engagement — Japan has a large bioinformatics research community aligned with HRA's goals." },
            { flag: "🇮🇪", country: "Ireland", code: "IE", color: "text-violet-400",
              note: "Higher than expected — possible datacenter/proxy traffic or cloud research infrastructure." },
            { flag: "🇩🇪", country: "Germany", code: "DE", color: "text-violet-400",
              note: "Consistent European usage. Germany is a major player in open biomedical data initiatives." },
            { flag: "🇪🇨", country: "Ecuador", code: "EC", color: "text-blue-400",
              note: "Unexpectedly high for South America — possibly a research collaboration or CDN proxy traffic." },
          ].map((c) => (
            <div key={c.country} className="flex flex-col gap-2 p-3 bg-zinc-800/40 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.flag}</span>
                <div>
                  <span className={`text-sm font-semibold ${c.color}`}>{c.country}</span>
                  <span className="text-xs text-zinc-500 ml-2">{(filtered.find((d) => d.c_country === c.code)?.visits ?? 0).toLocaleString()} visits</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{c.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
