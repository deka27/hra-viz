import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import CDEWorkflowChart from "../components/charts/CDEWorkflowChart";
import SpatialSearchChart from "../components/charts/SpatialSearchChart";
import OpacityChart from "../components/charts/OpacityChart";
import RUIKeyboardChart from "../components/charts/RUIKeyboardChart";
import OrgContentSelectChart from "../components/charts/OrgContentSelectChart";

import cdeWorkflow from "../../public/data/cde_workflow.json";
import spatialSearch from "../../public/data/spatial_search.json";
import opacityData from "../../public/data/opacity_interactions.json";
import cdeTabsData from "../../public/data/cde_tabs.json";
import topPathsByEvent from "../../public/data/top_paths_by_event.json";
import sidebarActions from "../../public/data/sidebar_actions.json";
import orgSelections from "../../public/data/organ_selections.json";
import totalToolVisits from "../../public/data/total_tool_visits.json";

const cdeUploads = cdeWorkflow.find((d) => d.path === "cde-ui.create-visualization-page.upload-data.file-upload.upload")?.count ?? 0;
const cdeViz = cdeWorkflow.find((d) => d.path === "cde-ui.create-visualization-page.visualize-data.submit")?.count ?? 0;
const cdeCompletionPct = cdeUploads > 0 ? Math.round((cdeViz / cdeUploads) * 100) : 0;
const euiVisits = totalToolVisits.find((d) => d.tool === "EUI")?.visits ?? 0;
const ruiVisits = totalToolVisits.find((d) => d.tool === "RUI")?.visits ?? 0;
const spatialOpenCount = spatialSearch.find((d) => d.path === "eui.body-ui.spatial-search-button")?.count ?? 0;
const spatialApplyCount = spatialSearch.find((d) => d.path === "eui.data-filters.filters.spatial-search.add")?.count ?? 0;
const spatialOpenPct = euiVisits > 0 ? ((spatialOpenCount / euiVisits) * 100).toFixed(2) : "0.00";
const keyboardRows = ((topPathsByEvent as { keyboard?: { path: string; count: number }[] }).keyboard ?? [])
  .filter((row) => row.path.startsWith("rui.stage-content.directional-controls.keyboard."));
function ruiKeyCount(key: string): number {
  const keyLower = key.toLowerCase();
  return keyboardRows
    .filter((row) => row.path.toLowerCase().endsWith(`.${keyLower}`))
    .reduce((sum, row) => sum + row.count, 0);
}
const ruiA = ruiKeyCount("a");
const ruiD = ruiKeyCount("d");
const ruiQ = ruiKeyCount("q");
const ruiE = ruiKeyCount("e");
const ruiW = ruiKeyCount("w");
const ruiS = ruiKeyCount("s");
const keyboardTotal = keyboardRows.reduce((sum, row) => sum + row.count, 0);
const keyboardPerVisit = ruiVisits > 0 ? (keyboardTotal / ruiVisits).toFixed(2) : "0.00";
const adRatio = ruiD > 0 ? `${(ruiA / ruiD).toFixed(1)}x` : "n/a";
const kgSelectionTotal = orgSelections.reduce((sum, row) => sum + row.count, 0);
const kgOrganViews =
  (orgSelections.find((row) => row.selection === "all-organs")?.count ?? 0) +
  (orgSelections.find((row) => row.selection === "3d-organs")?.count ?? 0);
const kgOrganShare = kgSelectionTotal > 0 ? ((kgOrganViews / kgSelectionTotal) * 100).toFixed(1) : "0.0";

export default function ToolBehaviourPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tool Behaviour</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Per-Tool Interaction Behaviour</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Deep dives for EUI (Exploration User Interface), RUI (Registration User Interface), CDE (Cell Distribution Explorer), and KG Explorer (Knowledge Graph Explorer).
        </p>
        <p className="text-xs text-zinc-500 max-w-2xl">
          FTU Explorer = Functional Tissue Unit Explorer.
        </p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="EUI Spatial Reach"
          value={`${spatialOpenPct}%`}
          sub={`${spatialOpenCount} opens · ${spatialApplyCount} applies`}
          accent="text-blue-400"
        />
        <StatCard
          label="RUI Keyboard Depth"
          value={keyboardTotal.toLocaleString()}
          sub={`${keyboardPerVisit} key events per RUI visit`}
          accent="text-violet-400"
        />
        <StatCard
          label="CDE Workflow Completion"
          value={`${cdeCompletionPct}%`}
          sub={`${cdeViz} of ${cdeUploads} uploaders visualized`}
          accent="text-amber-400"
        />
        <StatCard
          label="KG Organ-View Share"
          value={`${kgOrganShare}%`}
          sub={`${kgOrganViews} of ${kgSelectionTotal} selections`}
          accent="text-rose-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">By Tool</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-blue-400 tracking-wider">EUI (Exploration User Interface)</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

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

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-violet-400 tracking-wider">RUI (Registration User Interface)</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* RUI Keyboard Navigation */}
      <ChartCard
        title="RUI 3D Navigation — Keyboard Key Usage"
        subtitle="Heatmap of logged RUI directional key events · action labels inferred from keybind semantics"
        badge="RUI"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RUIKeyboardChart />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Key Finding</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <span className="text-violet-300 font-semibold">A (left) is used {adRatio} more than D (right)</span> — {ruiA.toLocaleString()} vs {ruiD.toLocaleString()} interactions.
                Users heavily favor left-side navigation when placing tissue blocks in 3D space.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Rotation vs Translation</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                W+S (up/down, {(ruiW + ruiS).toLocaleString()} total) and Q+E (back/front, {(ruiQ + ruiE).toLocaleString()} total) are both heavily used,
                showing users spend significant time fine-tuning 3D positioning rather than moving in only one direction.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Opacity usage */}
      <ChartCard
        title="RUI Opacity Controls — Anatomical Structure Usage"
        subtitle="Only 196 total opacity toggle interactions — this feature is nearly invisible to users"
        badge="RUI · Low Adoption"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OpacityChart data={opacityData} />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Finding</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                The &ldquo;All Anatomical Structures&rdquo; global toggle accounts for 26% of all opacity interactions —
                users who find the feature tend to use the bulk toggle rather than per-structure controls.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Recommendation</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Surface opacity controls more prominently in the RUI UI — perhaps via an onboarding tooltip or
                a more visible panel toggle to increase discoverability.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">RUI Sidebar Actions</p>
          <div className="flex gap-3 flex-wrap">
            {sidebarActions.map(({ action, count }) => (
              <div key={action} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <span className="capitalize">{action.replace("-", " ")}</span>
                <span className="opacity-60">{count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Users actively toggle the sidebar ({sidebarActions.reduce((s, d) => s + d.count, 0).toLocaleString()} total actions) — yet the opacity panel inside it was opened only {opacityData.find((d) => d.path === "rui.left-sidebar.opacity-settings.toggle")?.count ?? 0} times. The panel exists but isn&apos;t being discovered.
          </p>
        </div>
      </ChartCard>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-amber-400 tracking-wider">CDE (Cell Distribution Explorer)</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

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
        <div className="mt-3 bg-zinc-200/70 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 flex gap-3 items-start">
          <span className="text-amber-400 text-sm mt-0.5">⚠</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Data gap — histogram &amp; violin plot downloads</span>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The CDE app does not fire any tracking event when a user downloads a chart.
              No &ldquo;download&rdquo;, &ldquo;histogram&rdquo;, or &ldquo;violin&rdquo; paths appear anywhere in the logs.
              To answer this question, CDE needs to add a <code className="text-zinc-600 dark:text-zinc-400">download</code> event to its analytics instrumentation.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">CDE Tab Usage</p>
          <div className="flex gap-3 flex-wrap">
            {cdeTabsData.map(({ tab, count }) => {
              const isTop = count >= (cdeTabsData[0]?.count ?? 0) * 0.9;
              const color = isTop
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
              return (
                <div key={tab} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${color}`}>
                  <span>{tab}</span>
                  <span className="opacity-70">{count}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Upload and Visualization tabs are nearly equal — users who upload almost always proceed to view the result.
            Table, OMAPs, and Illustration tabs are rarely discovered.
          </p>
        </div>
      </ChartCard>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-rose-400 tracking-wider">KG Explorer (Knowledge Graph Explorer)</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* KG Explorer content selections */}
      <ChartCard
        title="KG Explorer — What Users Browse"
        subtitle="Top content selections across the HRA portal · organ views, reference libraries, and tool launches"
        badge="KG Explorer · Portal"
        badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OrgContentSelectChart data={orgSelections} />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Organ Views Dominate</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <span className="text-rose-400 font-semibold">All Organs</span> (313) and{" "}
                <span className="text-rose-400 font-semibold">3D Organs</span> (202) are the most-selected content —
                users primarily use KG Explorer as an organ-level browser before drilling into specific structures.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Reference Content Underused</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
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
