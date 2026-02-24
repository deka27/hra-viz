import ChartCard from "../components/ChartCard";
import MonthlyTrendsChart from "../components/charts/MonthlyTrendsChart";
import YearlyGroupedBar from "../components/charts/YearlyGroupedBar";
import DonutChart from "../components/charts/DonutChart";
import StatCard from "../components/StatCard";

import monthlyData from "../../public/data/tool_visits_by_month.json";
import yearlyData from "../../public/data/tool_visits_by_year.json";
import totalData from "../../public/data/total_tool_visits.json";

const TOOL_CARD_COLORS: Record<string, string> = {
  "KG Explorer": "text-rose-400",
  "EUI": "text-blue-400",
  "RUI": "text-violet-400",
  "CDE": "text-amber-400",
  "FTU Explorer": "text-emerald-400",
};

const TOOL_HEX: Record<string, string> = {
  "KG Explorer": "#f43f5e",
  "EUI": "#3b82f6",
  "RUI": "#8b5cf6",
  "CDE": "#f59e0b",
  "FTU Explorer": "#10b981",
};

const sorted = [...totalData].sort((a, b) => b.visits - a.visits);

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tool Usage</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Visit Trends by Tool</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
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
            accent={TOOL_CARD_COLORS[t.tool] ?? "text-zinc-50"}
          />
        ))}
      </div>

      {/* Monthly trends — main chart */}
      <ChartCard
        title="Monthly Visits per Tool"
        subtitle="Nov 2023 – Jan 2026 · Use the slider or scroll to zoom"
        badge="27 months"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <MonthlyTrendsChart data={monthlyData} />
      </ChartCard>

      {/* Yearly + tool share */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
              color: TOOL_HEX[d.tool] ?? "#3b82f6",
            }))}
            unit="visits"
          />
        </ChartCard>
      </div>

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
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
