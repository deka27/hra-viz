import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import GeoBarChart from "../components/charts/GeoBarChart";
import GeoRegionDonut from "../components/charts/GeoRegionDonut";
import DonutChart from "../components/charts/DonutChart";
import WorldMapChart from "../components/charts/WorldMapChart";

import geoData from "../../public/data/geo_distribution.json";

const filtered = geoData.filter((d) => d.c_country !== "-");
const total = filtered.reduce((s, d) => s + d.visits, 0);
const usVisits = filtered.find((d) => d.c_country === "US")?.visits ?? 0;
const intlVisits = total - usVisits;
const countryCount = filtered.length;
const asiaCodes = ["HK","SG","JP","CN","KR","AU","IN","VN","TW","PH","ID","MY","TH","BD","NZ","PK"];
const apTotal = filtered.filter((d) => asiaCodes.includes(d.c_country)).reduce((s, d) => s + d.visits, 0);

export default function GeoPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Geographic Distribution</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Global Reach of HRA Tools</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          HRA tools are accessed from {countryCount} countries. While the US dominates, Asia-Pacific shows
          strong engagement — particularly Hong Kong, Singapore, and Japan.
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
        badge="93 countries"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <WorldMapChart data={geoData} />
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

      {/* Regional breakdown + US vs Intl */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            { flag: "🇭🇰", country: "Hong Kong", visits: "2,845", color: "text-rose-400",
              note: "#2 globally — disproportionately high given population. Likely strong research institution usage." },
            { flag: "🇸🇬", country: "Singapore", visits: "1,926", color: "text-rose-400",
              note: "#3 globally — Singapore's biomedical research community is actively using HRA tools." },
            { flag: "🇯🇵", country: "Japan", visits: "1,875", color: "text-rose-400",
              note: "Strong engagement — Japan has a large bioinformatics research community aligned with HRA's goals." },
            { flag: "🇮🇪", country: "Ireland", visits: "1,098", color: "text-violet-400",
              note: "Higher than expected — possible datacenter/proxy traffic or cloud research infrastructure." },
            { flag: "🇩🇪", country: "Germany", visits: "944", color: "text-violet-400",
              note: "Consistent European usage. Germany is a major player in open biomedical data initiatives." },
            { flag: "🇪🇨", country: "Ecuador", visits: "769", color: "text-blue-400",
              note: "Unexpectedly high for South America — possibly a research collaboration or CDN proxy traffic." },
          ].map((c) => (
            <div key={c.country} className="flex flex-col gap-2 p-3 bg-zinc-800/40 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.flag}</span>
                <div>
                  <span className={`text-sm font-semibold ${c.color}`}>{c.country}</span>
                  <span className="text-xs text-zinc-500 ml-2">{c.visits} visits</span>
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
