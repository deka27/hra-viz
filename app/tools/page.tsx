import ChartCard from "../components/ChartCard";
import MonthlyTrendsChart from "../components/charts/MonthlyTrendsChart";
import YearlyGroupedBar from "../components/charts/YearlyGroupedBar";
import DonutChart from "../components/charts/DonutChart";
import StatCard from "../components/StatCard";
import ToolHourlyHeatmap from "../components/charts/ToolHourlyHeatmap";
import TrafficByDowChart from "../components/charts/TrafficByDowChart";

import monthlyData from "../../public/data/tool_visits_by_month.json";
import yearlyData from "../../public/data/tool_visits_by_year.json";
import totalData from "../../public/data/total_tool_visits.json";
import hourlyHeatmapData from "../../public/data/tool_hourly_heatmap.json";
import dowData from "../../public/data/traffic_by_dow.json";

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

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tool Usage</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Visit Trends by Tool</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Monthly and yearly breakdown of HRA tool page visits. KG Explorer launched in Aug 2025 and immediately became the most-visited tool.
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
