import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import EventTypesChart from "../components/charts/EventTypesChart";
import TopUIPathsChart from "../components/charts/TopUIPathsChart";
import CDEWorkflowChart from "../components/charts/CDEWorkflowChart";
import SpatialSearchChart from "../components/charts/SpatialSearchChart";
import OpacityChart from "../components/charts/OpacityChart";
import RUIKeyboardChart from "../components/charts/RUIKeyboardChart";
import { ErrorSourceChart, ErrorCauseChart } from "../components/charts/ErrorBreakdownChart";

import eventTypes from "../../public/data/event_types.json";
import topUIPathsData from "../../public/data/top_ui_paths.json";
import cdeWorkflow from "../../public/data/cde_workflow.json";
import spatialSearch from "../../public/data/spatial_search.json";
import opacityData from "../../public/data/opacity_interactions.json";
import cdeTabsData from "../../public/data/cde_tabs.json";

const totalEvents = eventTypes.reduce((s, d) => s + d.count, 0);
const errorCount = eventTypes.find((d) => d.event === "error")?.count ?? 0;
const errorPct = ((errorCount / totalEvents) * 100).toFixed(1);
const clickCount = eventTypes.find((d) => d.event === "click")?.count ?? 0;
const opacityTotal = opacityData.reduce((s, d) => s + d.count, 0);
const spatialTotal = spatialSearch.reduce((s, d) => s + d.count, 0);

export default function FeaturesPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Feature Analysis</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">How Users Interact with Tools</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Breakdown of interaction types, most-used UI elements, and deep dives into feature adoption across EUI, RUI, and CDE.
        </p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Interactions"
          value={totalEvents.toLocaleString()}
          sub="Clicks, hovers, keys, errors"
        />
        <StatCard
          label="Error Rate"
          value={`${errorPct}%`}
          sub={`${errorCount.toLocaleString()} error events`}
          accent="text-red-400"
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
          sub="978 total — healthy usage"
          accent="text-blue-400"
        />
      </div>

      {/* Event types */}
      <ChartCard
        title="Interaction Types"
        subtitle={`${totalEvents.toLocaleString()} total logged interactions across all HRA tools`}
        badge="All Tools"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <EventTypesChart data={eventTypes} />
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">Most common</span>
            <span className="text-sm font-semibold text-blue-400">Click ({((clickCount / totalEvents) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">Error rate</span>
            <span className="text-sm font-semibold text-red-400">{errorPct}% of interactions</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">Keyboard use</span>
            <span className="text-sm font-semibold text-amber-400">Significant — RUI keyboard nav</span>
          </div>
        </div>
      </ChartCard>

      {/* Error breakdown */}
      <ChartCard
        title="Where Do the Errors Come From?"
        subtitle="Stack trace analysis of 21,350 error events — 72% eliminated by 3 targeted fixes"
        badge="Quality · All Tools"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Error rate by tool</p>
            <ErrorSourceChart />
            <p className="text-xs text-zinc-600 mt-2">
              RUI (0.2%) and CDE (0.7%) are nearly clean. KG Explorer (35%) and EUI (28%) drive the bulk.
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Errors by root cause</p>
            <ErrorCauseChart />
            <p className="text-xs text-zinc-600 mt-2">
              Top 2 causes alone account for 62% of all errors — both are infrastructure issues, not UX.
            </p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Fix #1</span>
              <span className="text-xs text-zinc-400 font-medium">6,438 errors</span>
            </div>
            <p className="text-xs text-zinc-300">
              <span className="font-semibold">API CORS failure</span> — <code className="text-zinc-400 text-[10px]">technology-names</code> endpoint returns
              &ldquo;0 Unknown Error&rdquo;. Fix CORS headers on <code className="text-zinc-400 text-[10px]">apps.humanatlas.io/api/v1</code>.
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Fix #2</span>
              <span className="text-xs text-zinc-400 font-medium">6,712 errors</span>
            </div>
            <p className="text-xs text-zinc-300">
              <span className="font-semibold">KG Explorer missing icons</span> — SVG assets for organs and products
              (all-organs, kidneys, ftu, schema…) not resolving on CDN. Audit CDN asset paths.
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Fix #3</span>
              <span className="text-xs text-zinc-400 font-medium">2,251 errors</span>
            </div>
            <p className="text-xs text-zinc-300">
              <span className="font-semibold">EUI null ref in 3D picker</span> —{" "}
              <code className="text-zinc-400 text-[10px]">Cannot read properties of null (reading &apos;0&apos;)</code> in{" "}
              <code className="text-zinc-400 text-[10px]">getLastPickedObject</code>. Add null guard before accessing index.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Top UI elements */}
      <ChartCard
        title="Top 20 Most Interacted UI Elements"
        subtitle="Color-coded by tool — EUI (blue), RUI (violet), KG Explorer (rose), Portal (gray)"
        badge="Top 20"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <TopUIPathsChart data={topUIPathsData} />
      </ChartCard>

      {/* RUI Keyboard Navigation */}
      <ChartCard
        title="RUI 3D Navigation — Keyboard Key Usage"
        subtitle="Heatmap — violet intensity = interaction count · S key not logged (no data)"
        badge="RUI"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RUIKeyboardChart />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Key Finding</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                <span className="text-violet-300 font-semibold">A (left) is used 2× more than D (right)</span> — 974 vs 473 interactions.
                Users heavily favor left-side navigation when placing tissue blocks in 3D space.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Rotation vs Translation</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Q+E (vertical, 1,276 total) outpace W (forward, 528), suggesting users spend
                more time adjusting <span className="text-violet-300 font-semibold">depth/elevation</span> than moving forward through the 3D model.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* CDE workflow + Spatial search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="CDE Workflow Steps"
          subtitle="User journey through the cell distribution explorer tool"
          badge="CDE"
          badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
        >
          <CDEWorkflowChart data={cdeWorkflow} />
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            <span className="text-amber-400 font-medium">132 of 163</span> users who uploaded data submitted a visualization (81% completion).
            Zero download interactions recorded — the export feature is completely undiscovered.
          </p>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">CDE Tab Usage</p>
            <div className="flex gap-3 flex-wrap">
              {cdeTabsData.map(({ tab, count }) => {
                const isTop = count >= (cdeTabsData[0]?.count ?? 0) * 0.9;
                const color = isTop
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700";
                return (
                  <div key={tab} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${color}`}>
                    <span>{tab}</span>
                    <span className="opacity-70">{count}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Upload and Visualization tabs are nearly equal — users who upload almost always proceed to view the result.
              Table, OMAPs, and Illustration tabs are rarely discovered.
            </p>
          </div>
        </ChartCard>

        <ChartCard
          title="EUI Spatial Search"
          subtitle="Workflow steps and organ selection breakdown"
          badge="EUI"
          badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
        >
          <SpatialSearchChart data={spatialSearch} />
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            <span className="text-blue-400 font-medium">Kidney</span> is the most searched organ, followed by heart.
            Male sex selected 2.3× more than female in spatial searches.
          </p>
        </ChartCard>
      </div>

      {/* Opacity usage */}
      <ChartCard
        title="RUI Opacity Controls — Anatomical Structure Usage"
        subtitle="Only 196 total opacity toggle interactions — this feature is nearly invisible to users"
        badge="RUI · Low Adoption"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OpacityChart data={opacityData} />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Finding</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                The &ldquo;All Anatomical Structures&rdquo; global toggle accounts for 26% of all opacity interactions —
                users who find the feature tend to use the bulk toggle rather than per-structure controls.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Recommendation</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Surface opacity controls more prominently in the RUI UI — perhaps via an onboarding tooltip or
                a more visible panel toggle to increase discoverability.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
