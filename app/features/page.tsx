import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import EventTypesChart from "../components/charts/EventTypesChart";
import TopUIPathsChart from "../components/charts/TopUIPathsChart";
import TopPathsByEventChart from "../components/charts/TopPathsByEventChart";
import CDEWorkflowChart from "../components/charts/CDEWorkflowChart";
import SpatialSearchChart from "../components/charts/SpatialSearchChart";
import OpacityChart from "../components/charts/OpacityChart";
import RUIKeyboardChart from "../components/charts/RUIKeyboardChart";
import OrgContentSelectChart from "../components/charts/OrgContentSelectChart";
import { ErrorSourceChart, ErrorCauseChart } from "../components/charts/ErrorBreakdownChart";
import MonthlyErrorTrendChart from "../components/charts/MonthlyErrorTrendChart";

import eventTypes from "../../public/data/event_types.json";
import errorClusters from "../../public/data/error_clusters.json";
import topUIPathsData from "../../public/data/top_ui_paths.json";
import cdeWorkflow from "../../public/data/cde_workflow.json";
import spatialSearch from "../../public/data/spatial_search.json";
import opacityData from "../../public/data/opacity_interactions.json";
import cdeTabsData from "../../public/data/cde_tabs.json";
import topPathsByEvent from "../../public/data/top_paths_by_event.json";
import sidebarActions from "../../public/data/sidebar_actions.json";
import orgSelections from "../../public/data/organ_selections.json";
import monthlyErrorData from "../../public/data/monthly_error_trend.json";

const totalEvents = eventTypes.reduce((s, d) => s + d.count, 0);
const errorCount = eventTypes.find((d) => d.event === "error")?.count ?? 0;
const errorPct = ((errorCount / totalEvents) * 100).toFixed(1);
const clickCount = eventTypes.find((d) => d.event === "click")?.count ?? 0;
const clusterTotal = (errorClusters as { total_error_rows: number }).total_error_rows;
const opacityTotal = opacityData.reduce((s, d) => s + d.count, 0);
const spatialTotal = spatialSearch.reduce((s, d) => s + d.count, 0);
const cdeUploads = cdeWorkflow.find((d) => d.path === "cde-ui.create-visualization-page.upload-data.file-upload.upload")?.count ?? 0;
const cdeViz = cdeWorkflow.find((d) => d.path === "cde-ui.create-visualization-page.visualize-data.submit")?.count ?? 0;
const cdeCompletionPct = cdeUploads > 0 ? Math.round((cdeViz / cdeUploads) * 100) : 0;

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
        subtitle={`${errorCount.toLocaleString()} logged error events · stack trace clustering (${clusterTotal.toLocaleString()} sampled) shows 72% traceable to 3 fixable bugs`}
        badge="Quality · All Tools"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Error rate by tool</p>
            <ErrorSourceChart />
            <p className="text-xs text-zinc-600 mt-2">
              RUI and CDE are nearly clean. KG Explorer and EUI drive the bulk of errors.
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Errors by root cause</p>
            <ErrorCauseChart />
            <p className="text-xs text-zinc-600 mt-2">
              Top 2 causes alone account for 62% of all errors — both are infrastructure issues, not UX.
              <span className="block mt-1 text-zinc-700">Source: NLP clustering on {clusterTotal.toLocaleString()} error messages — separate universe from the event-log error count above.</span>
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

      {/* Monthly error trend */}
      <ChartCard
        title="Error Volume Over Time"
        subtitle="Monthly error events by tool · Oct 2025 spike = KG Explorer launch + CDN icon failures · trend improving"
        badge="Error Trend"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      >
        <MonthlyErrorTrendChart data={monthlyErrorData} />
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Oct 2025 Spike</span>
            <p className="text-sm text-zinc-300">
              12,387 errors in October — driven by{" "}
              <span className="text-rose-400 font-semibold">KG Explorer&apos;s August launch</span> triggering
              CDN icon resolution failures that accumulated until CDN paths were corrected.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Declining Trend</span>
            <p className="text-sm text-zinc-300">
              Errors fell from <span className="text-red-400 font-semibold">12,387 → 3,149 → 2,976</span> in
              Oct–Dec 2025. Jan 2026 is partial but tracking lower. The CDN fixes are taking hold.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Portal/Other Category</span>
            <p className="text-sm text-zinc-300">
              The large &ldquo;Portal/Other&rdquo; bar represents errors from the HRA portal layer
              before app-attribution is set in the event payload. These overlap with the KG icon failures.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Top UI elements — drilldown by event type */}
      <ChartCard
        title="Where Are Clicks and Hovers Happening?"
        subtitle="Top 15 UI elements per interaction type · color = tool · hover a bar for full path"
        badge="Drilldown"
        badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <TopPathsByEventChart data={topPathsByEvent as Record<string, { path: string; count: number }[]>} />
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
            <span className="text-amber-400 font-medium">{cdeViz} of {cdeUploads}</span> users who uploaded data submitted a visualization ({cdeCompletionPct}% completion).
          </p>
          <div className="mt-3 bg-zinc-800/60 border border-dashed border-zinc-700 rounded-lg p-3 flex gap-3 items-start">
            <span className="text-amber-400 text-sm mt-0.5">⚠</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-zinc-300">Data gap — histogram &amp; violin plot downloads</span>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The CDE app does not fire any tracking event when a user downloads a chart.
                No &ldquo;download&rdquo;, &ldquo;histogram&rdquo;, or &ldquo;violin&rdquo; paths appear anywhere in the logs.
                To answer this question, CDE needs to add a <code className="text-zinc-400">download</code> event to its analytics instrumentation.
              </p>
            </div>
          </div>
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
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">RUI Sidebar Actions</p>
          <div className="flex gap-3 flex-wrap">
            {sidebarActions.map(({ action, count }) => (
              <div key={action} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-zinc-800 border-zinc-700 text-xs font-medium text-zinc-400">
                <span className="capitalize">{action.replace("-", " ")}</span>
                <span className="opacity-60">{count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Users actively toggle the sidebar ({sidebarActions.reduce((s, d) => s + d.count, 0).toLocaleString()} total actions) — yet the opacity panel inside it was opened only {opacityData.find((d) => d.path === "rui.left-sidebar.opacity-settings.toggle")?.count ?? 0} times. The panel exists but isn&apos;t being discovered.
          </p>
        </div>
      </ChartCard>

      {/* KG Explorer content selections */}
      <ChartCard
        title="KG Explorer — What Users Browse"
        subtitle="Top content selections across the HRA portal · organ views, reference libraries, and tool launches"
        badge="KG Explorer · Portal"
        badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OrgContentSelectChart data={orgSelections} />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Organ Views Dominate</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                <span className="text-rose-400 font-semibold">All Organs</span> (313) and{" "}
                <span className="text-rose-400 font-semibold">3D Organs</span> (202) are the most-selected content —
                users primarily use KG Explorer as an organ-level browser before drilling into specific structures.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Reference Content Underused</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                ASCT+B Tables (128) and FTU Illustrations (101) see a fraction of organ view traffic.
                These deep reference resources may need more prominent entry points from within the organ views.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
