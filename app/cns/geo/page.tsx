import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/charts/DonutChart";
import WorldMapChart from "../../components/charts/WorldMapChart";
import GeoBarChart from "../../components/charts/GeoBarChart";
import GeoBotChart from "../../components/charts/GeoBotChart";
import GeoRegionDonut from "../../components/charts/GeoRegionDonut";

import geoData from "../../../public/data/cns/cns_geo_distribution.json";
import geoBotData from "../../../public/data/cns/cns_geo_bot_traffic.json";

// --- Derived stats ---
const filtered = geoData.filter((d) => d.c_country !== "-");
const total = filtered.reduce((s, d) => s + d.visits, 0);
const countryCount = filtered.length;
const usVisits = filtered.find((d) => d.c_country === "US")?.visits ?? 0;
const usPct = ((usVisits / total) * 100).toFixed(1);
const intlVisits = total - usVisits;
const intlPct = ((intlVisits / total) * 100).toFixed(1);

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", DE: "Germany", CN: "China", SG: "Singapore",
  JP: "Japan", IN: "India", GB: "United Kingdom", NL: "Netherlands",
  RU: "Russia", CA: "Canada", FR: "France", HK: "Hong Kong",
  BR: "Brazil", ES: "Spain", KR: "South Korea", IE: "Ireland",
  VN: "Vietnam", AU: "Australia", ID: "Indonesia", SE: "Sweden",
};

function countryName(code?: string): string {
  if (!code) return "Unknown";
  return COUNTRY_NAMES[code] ?? code;
}

// Top 5 countries
const top5 = [...filtered].sort((a, b) => b.visits - a.visits).slice(0, 5);

// Bot insights
const topBotCountry = [...geoBotData].sort((a, b) => b.bot_visits - a.bot_visits)[0];
const highBotRate = [...geoBotData]
  .sort((a, b) => b.bot_pct - a.bot_pct)
  .slice(0, 3);

// Clean-traffic examples for the "Clean Traffic" callout
const inBot = geoBotData.find((d) => d.c_country === "IN");
const nlBot = geoBotData.find((d) => d.c_country === "NL");

// US vs International donut
const usIntlDonut = [
  { name: "United States", value: usVisits, color: "#3b82f6" },
  { name: "International", value: intlVisits, color: "#52525b" },
];

export default function CNSGeoPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          CNS Geographic Distribution
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Global Reach of cns.iu.edu
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          The CNS website is accessed from {countryCount} countries worldwide. The United
          States accounts for {usPct}% of all traffic, with Germany as the second-largest
          source at {((top5[1]?.visits ?? 0) / total * 100).toFixed(1)}%.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Countries"
          value={countryCount.toString()}
          sub="Countries with recorded visits"
          accent="text-blue-400"
        />
        <StatCard
          label="Top Country"
          value="United States"
          sub={`${usVisits.toLocaleString()} visits`}
          accent="text-blue-400"
        />
        <StatCard
          label="US Share"
          value={`${usPct}%`}
          sub={`${usVisits.toLocaleString()} of ${total.toLocaleString()}`}
        />
        <StatCard
          label="International"
          value={`${intlPct}%`}
          sub={`${intlVisits.toLocaleString()} visits from outside US`}
          accent="text-rose-400"
        />
      </div>

      {/* World map */}
      <ChartCard
        title="World Map -- Visits by Country"
        subtitle="Scroll or pinch to zoom -- Hover a country for details -- Fill intensity = visit count"
        badge={`${countryCount} countries`}
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <WorldMapChart data={geoData} toolPref={[]} botData={geoBotData} />
      </ChartCard>

      {/* Top countries bar */}
      <ChartCard
        title="Top 20 Countries by Visits"
        subtitle="Color-coded by region: blue = Americas, violet = Europe, rose = Asia-Pacific, amber = Middle East & Africa"
        badge="Top 20"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <GeoBarChart data={geoData} />
      </ChartCard>

      {/* Bot traffic */}
      <ChartCard
        title="Bot Traffic by Country"
        subtitle="Bot + AI-crawler requests per country -- bar = volume, line = bot rate %"
        badge="Traffic Quality"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <GeoBotChart data={geoBotData} />
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Highest Volume</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="text-red-400 font-semibold">{countryName(topBotCountry?.c_country)}</span> leads
              bot volume with {topBotCountry?.bot_visits.toLocaleString()} bot requests
              ({topBotCountry?.bot_pct}% rate).
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Highest Bot Rate</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {highBotRate.slice(0, 2).map((d, i) => (
                <span key={d.c_country}>
                  {i > 0 && " and "}
                  <span className="text-red-400 font-semibold">{countryName(d.c_country)} ({d.bot_pct}%)</span>
                </span>
              ))}{" "}
              show the highest bot-rate share among tracked countries.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Clean Traffic</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="text-emerald-400 font-semibold">India ({inBot?.bot_pct ?? 0}%)</span> and{" "}
              <span className="text-emerald-400 font-semibold">Netherlands ({nlBot?.bot_pct ?? 0}%)</span>{" "}
              have very low bot rates, indicating predominantly genuine academic traffic.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Region donut + US vs Intl */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Regional Breakdown" subtitle="Visit share by world region">
          <GeoRegionDonut data={geoData} />
        </ChartCard>

        <ChartCard title="US vs. International" subtitle="Domestic vs. global visit split">
          <DonutChart data={usIntlDonut} unit="visits" />
        </ChartCard>
      </div>

      {/* Notable countries */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Notable Country Patterns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { code: "US", country: "United States", color: "text-blue-400",
              note: "Dominant source of traffic, consistent with CNS being based at Indiana University." },
            { code: "DE", country: "Germany", color: "text-violet-400",
              note: "Second-largest source -- strong European interest in network science and visualization research." },
            { code: "CN", country: "China", color: "text-rose-400",
              note: "Third-largest -- significant interest from Chinese research institutions in scientometrics." },
            { code: "SG", country: "Singapore", color: "text-rose-400",
              note: "Disproportionately high traffic for its population -- active network science community." },
            { code: "IN", country: "India", color: "text-amber-400",
              note: "Large academic community with very clean traffic (low bot rate), indicating genuine research interest." },
            { code: "RU", country: "Russia", color: "text-red-400",
              note: "High bot rate (67.4%) -- significant portion of traffic is automated crawling rather than human visitors." },
          ].map((c) => (
            <div key={c.country} className="flex flex-col gap-2 p-3 bg-zinc-100 dark:bg-zinc-800/40 rounded-lg">
              <div className="flex items-center gap-2">
                <div>
                  <span className={`text-sm font-semibold ${c.color}`}>{c.country}</span>
                  <span className="text-xs text-zinc-500 ml-2">
                    {(filtered.find((d) => d.c_country === c.code)?.visits ?? 0).toLocaleString()} visits
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{c.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
