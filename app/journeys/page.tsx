import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import EUISpatialFunnelChart from "../components/charts/EUISpatialFunnelChart";
import CDESankeyChart from "../components/charts/CDESankeyChart";
import ToolCorrelationHeatmap from "../components/charts/ToolCorrelationHeatmap";
import ToolCorrelationGraph from "../components/charts/ToolCorrelationGraph";
import ToolTransitionFlowChart from "../components/charts/ToolTransitionFlowChart";

import spatialSearch from "../../public/data/spatial_search.json";
import cdeWorkflow from "../../public/data/cde_workflow.json";
import opacityData from "../../public/data/opacity_interactions.json";
import totalToolVisits from "../../public/data/total_tool_visits.json";
import crossToolRecommendations from "../../public/data/cross_tool_recommendations.json";

const spatialApplyCount = spatialSearch.find((d) => d.path === "eui.data-filters.filters.spatial-search.add")?.count ?? 0;
const euiVisits = totalToolVisits.find((d) => d.tool === "EUI")?.visits ?? 0;
const spatialOpenCount = spatialSearch.find((d) => d.path === "eui.body-ui.spatial-search-button")?.count ?? 0;
const spatialConfigCount = spatialSearch.find((d) => d.path === "eui.body-ui.spatial-search-config.continue")?.count ?? 0;
const spatialResultsCount = spatialSearch.find((d) => d.path === "eui.body-ui.spatial-search.results.tissue-blocks")?.count ?? 0;
const cdeUploads = cdeWorkflow.find((d) => d.path === "cde-ui.create-visualization-page.upload-data.file-upload.upload")?.count ?? 0;
const cdeVisualizations = cdeWorkflow.find((d) => d.path === "cde-ui.create-visualization-page.visualize-data.submit")?.count ?? 0;
const cdeLandingCreate = cdeWorkflow.find((d) => d.path === "cde-ui.landing-page.create-and-explore.visual-cards.create-a-visualization")?.count ?? 0;
const cdeCompletionPct = cdeUploads > 0 ? Math.round((cdeVisualizations / cdeUploads) * 100) : 0;
const cdeDirectEntry = cdeUploads - cdeLandingCreate;
const cdeDropoffs = cdeUploads - cdeVisualizations;
const opacityPanelOpens = opacityData.find((d) => d.path === "rui.left-sidebar.opacity-settings.toggle")?.count ?? 0;
const pct = (value: number, total: number, digits = 2) => (total > 0 ? ((value / total) * 100).toFixed(digits) : "0.00");
const pctRounded = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
const recs = (crossToolRecommendations as {
  recommendations?: Array<{ source_tool: string; recommended_tool: string; co_sessions: number; lift: number }>;
}).recommendations ?? [];

export default function OpportunitiesPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Journeys & Opportunities</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">How Users Move and Where They Drop Off</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Track feature drop-offs and cross-tool movement patterns to surface the clearest UX and growth opportunities.
        </p>
      </div>

      {/* Hero gap stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CDE Download Metric"
          value="N/A"
          sub="Download/export events are not instrumented"
          accent="text-amber-400"
        />
        <StatCard
          label="Spatial Search → Applied"
          value={`${spatialApplyCount} uses`}
          sub={`Of ${euiVisits.toLocaleString()} EUI visits — ${pct(spatialApplyCount, euiVisits)}%`}
          accent="text-red-400"
        />
        <StatCard
          label="RUI Opacity Panel Opens"
          value={opacityPanelOpens.toString()}
          sub={`Panel toggle found by ${opacityPanelOpens} users total`}
          accent="text-orange-400"
        />
        <StatCard
          label="CDE Completion Rate"
          value={`${cdeCompletionPct}%`}
          sub={`${cdeVisualizations} / ${cdeUploads} uploaders — strong`}
          accent="text-emerald-400"
        />
      </div>

      {/* Critical Gaps */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">3 Critical Feature Discovery Gaps</h2>
          <p className="text-xs text-zinc-500">Features that exist but are functionally invisible to users</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Gap 1: CDE Download */}
          <div className="bg-white dark:bg-zinc-900 border border-red-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Critical · CDE</span>
              <span className="text-2xl font-bold text-red-400">N/A</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Export / Download Not Measurable</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {cdeVisualizations} users successfully created visualizations, but CDE logs currently do not capture
                download/export actions. We cannot yet distinguish true non-usage from missing tracking.
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Add an explicit <code className="text-zinc-700 dark:text-zinc-300">download/export</code> analytics event first.
                Then evaluate discoverability and add a post-render CTA if observed usage is still low.
              </p>
            </div>
          </div>

          {/* Gap 2: Spatial Search */}
          <div className="bg-white dark:bg-zinc-900 border border-red-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Critical · EUI</span>
              <span className="text-2xl font-bold text-red-400">{spatialApplyCount}</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Spatial Search Rarely Applied</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Of {euiVisits.toLocaleString()} EUI visits, only {spatialOpenCount} ({pct(spatialOpenCount, euiVisits)}%) opened the spatial search panel — and just {spatialApplyCount} ever
                applied it as an active filter. Users open the feature but don&apos;t complete the workflow.
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Add an in-panel tooltip explaining what spatial search does and why to apply it.
                The &ldquo;Apply Filter&rdquo; button may need to be more salient — consider auto-applying on config completion.
              </p>
            </div>
          </div>

          {/* Gap 3: RUI Opacity */}
          <div className="bg-white dark:bg-zinc-900 border border-orange-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Critical · RUI</span>
              <span className="text-2xl font-bold text-orange-400">{opacityPanelOpens}</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Opacity Panel Undiscovered</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The opacity settings panel toggle was found by only {opacityPanelOpens} users in the entire dataset.
                {opacityData.reduce((s, d) => s + d.count, 0)} total opacity interactions happened — all from those who stumbled on it manually.
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Expose opacity controls in the main sidebar as an expanded section, not behind a collapsed
                toggle. Or add a first-use tooltip pointing to the panel after the user places a tissue block.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EUI Spatial Search Funnel */}
      <ChartCard
        title="EUI Spatial Search — Drop-off Funnel"
        subtitle={`Of ${spatialOpenCount} users who opened spatial search, only ${spatialApplyCount} (${pctRounded(spatialApplyCount, spatialOpenCount)}%) ever applied it as a data filter`}
        badge="EUI · Low Adoption"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EUISpatialFunnelChart />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">The Entry Problem</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Only <span className="text-blue-400 font-semibold">{pct(spatialOpenCount, euiVisits)}%</span> of EUI visitors
                ({spatialOpenCount} of {euiVisits.toLocaleString()}) ever open the spatial search panel.
                The feature is valuable but not prominent enough to be discovered organically.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">The Completion Gap</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Of those {spatialOpenCount} who open the panel, <span className="text-blue-400 font-semibold">{spatialConfigCount} ({pctRounded(spatialConfigCount, spatialOpenCount)}%)</span> configure an organ
                but only <span className="text-red-400 font-semibold">{spatialApplyCount} ({pctRounded(spatialApplyCount, spatialOpenCount)}%)</span> apply it as a filter.
                Users explore the feature but don&apos;t understand or find the final &ldquo;Apply&rdquo; action.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Note on &ldquo;Explored Results&rdquo;</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {spatialResultsCount} result views exceed the {spatialConfigCount} who configured — likely users re-opening an
                existing search. Results are browsed but rarely committed to.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* CDE Sankey */}
      <ChartCard
        title="CDE User Journey — Where Users Go and Where They Stop"
        subtitle={`Flow of all ${cdeUploads} users who uploaded data through the CDE workflow`}
        badge="CDE"
        badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CDESankeyChart />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Direct Entry: {pctRounded(cdeDirectEntry, cdeUploads)}%</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {cdeDirectEntry} of {cdeUploads} uploaders bypassed the landing page entirely — arriving directly at the create page
                via bookmarks, external links, or navigation. Suggests the landing page is not the primary discovery path.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Config Drop-off: {pctRounded(cdeDropoffs, cdeUploads)}%</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {cdeDropoffs} users ({pctRounded(cdeDropoffs, cdeUploads)}%) abandoned at the configuration step — 5 axis selectors + cell type + parameters.
                This is the highest-friction step in the workflow. Defaults or smart suggestions could help.
              </p>
            </div>
            <div className="bg-zinc-200/70 dark:bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Instrumentation Gap</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Download/export interactions are not currently logged in CDE. Add an explicit event to
                measure whether users stop at visualization or continue to export.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Tool Correlation Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Tool Co-movement Heatmap"
          subtitle="Pearson correlation of monthly visits · Jan 2024 – Jan 2026 · KG dampened by 21 months of zeros pre-launch"
          badge="Pearson r"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <ToolCorrelationHeatmap />
        </ChartCard>

        <ChartCard
          title="Correlation Force Graph"
          subtitle="Node size = total visits · edge weight = Pearson r · dashed = weak link · drag nodes to explore"
          badge="Force Graph"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <ToolCorrelationGraph />
        </ChartCard>
      </div>

      {/* Tool Transition Flow */}
      <ChartCard
        title="Where Do Users Go Between Tools?"
        subtitle="Directed flow of tool-switching sessions · arrow thickness = session count · % label = probability from source tool"
        badge="User Journeys"
        badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/20"
      >
        <ToolTransitionFlowChart />
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">KG Explorer as Hub</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              KG Explorer is the dominant destination —{" "}
              <span className="text-rose-400 font-semibold">82% of FTU Explorer exits</span> and{" "}
              <span className="text-rose-400 font-semibold">80% of CDE exits</span> flow to KG Explorer.
              It acts as the knowledge layer users return to between tool sessions.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">RUI → EUI Pipeline</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="text-violet-400 font-semibold">89% of RUI exits go to EUI</span> —
              users who register tissue blocks immediately explore spatial context in EUI.
              This is the clearest sequential workflow in the entire suite.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Bidirectional Loops</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              KG ↔ CDE and KG ↔ FTU show strong bidirectional loops — users alternate between
              exploring the knowledge graph and drilling into cell or FTU data.
              Cross-linking these pairs more tightly would reduce friction in these natural workflows.
            </p>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Cross-Tool Usage (Session-Level)"
        subtitle="Do users move between tools in the same session?"
        badge="Tool Loyalty"
        badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
      >
        <div className="flex flex-col gap-3 py-1">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Users strongly prefer <span className="text-zinc-900 dark:text-zinc-100 font-medium">staying in one tool</span> per session.
            All cross-tool pairings have lift &lt; 1 — meaning switching tools is{" "}
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">less likely than random chance</span>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
            {[...recs]
              .sort((a, b) => b.co_sessions - a.co_sessions)
              .slice(0, 6)
              .map((r) => (
                <div key={`${r.source_tool}-${r.recommended_tool}`} className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {r.source_tool} → {r.recommended_tool}
                  </span>
                  <span className="text-xs text-zinc-500">{r.co_sessions} sessions</span>
                </div>
              ))}
          </div>
          <p className="text-xs text-zinc-500">
            Most cross-tool sessions involve KG Explorer + CDE ({recs.find((r) => r.source_tool === "CDE" && r.recommended_tool === "KG Explorer")?.co_sessions ?? 0} sessions).
            Use lightweight cross-links in context rather than aggressive handoff prompts.
          </p>
        </div>
      </ChartCard>

      {/* Cross-Tool Opportunities */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Cross-Tool Growth Opportunities</h2>
          <p className="text-xs text-zinc-500">Derived from monthly co-occurrence patterns — tools that move together share audiences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">EUI</span>
              </div>
              <span className="text-zinc-400 dark:text-zinc-600">↔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">FTU Explorer</span>
              </div>
              <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">r = 0.89</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Strongest correlation in the dataset. Both spike together during IU workshop events — they share
              the same workshop-attending researcher audience. Adding an FTU Explorer CTA inside EUI
              (and vice versa) could increase adoption of both with near-zero engineering cost.
            </p>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-emerald-400 font-medium">Action: Add &ldquo;Explore organ FTUs&rdquo; button in EUI sidebar when a user selects an organ</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">CDE</span>
              </div>
              <span className="text-zinc-400 dark:text-zinc-600">↔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">RUI</span>
              </div>
              <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">r = 0.67</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              CDE and RUI share a data-registration researcher audience who work with
              tissue-level data. CDE users who visualize cell distributions are likely the same users
              who register tissue blocks in RUI. Cross-linking them could improve both tool stickiness.
            </p>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-emerald-400 font-medium">Action: Link from CDE visualization to &ldquo;Register this tissue in RUI&rdquo; workflow</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">EUI</span>
              </div>
              <span className="text-zinc-400 dark:text-zinc-600">↔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">CDE</span>
              </div>
              <span className="ml-auto text-xs font-mono text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">r ≈ 0.00</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Near-zero correlation means EUI and CDE attract separate user personas. EUI serves
              spatial browsers; CDE serves data-upload researchers. Attempting to cross-promote
              these two would likely see low conversion — focus cross-promotion budget elsewhere.
            </p>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium">No action: Different audiences — don&apos;t conflate them in onboarding or marketing</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">KG Explorer</span>
              </div>
              <span className="text-zinc-400 dark:text-zinc-600">trajectory</span>
              <span className="ml-auto text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">−45% since Oct</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              KG Explorer peaked in October 2025 at launch excitement and has declined 45% since.
              Over its active window it shows r=0.64 correlation with RUI — suggesting its audience overlaps
              with RUI&apos;s power users. Targeted re-engagement of RUI users could reverse the KG decline.
            </p>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-amber-400 font-medium">Action: Add KG Explorer surface to RUI sidebar — &ldquo;Explore the knowledge graph for this structure&rdquo;</p>
            </div>
          </div>
        </div>
      </div>

      {/* What's actually working */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">What&apos;s Working</p>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Strengths to Protect</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-emerald-400">{cdeCompletionPct}%</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">CDE Completion Rate</span>
            <span className="text-xs text-zinc-500">{cdeVisualizations} of {cdeUploads} uploaders successfully visualized their data — the core workflow is solid once users start</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-violet-400">63%</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">RUI Keyboard Engagement</span>
            <span className="text-xs text-zinc-500">3,251 keyboard interactions across 5,161 RUI visits — users are invested enough to learn keyboard shortcuts</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-blue-400">+58%</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">EUI Permanent Baseline Lift</span>
            <span className="text-xs text-zinc-500">The Mar 2024 workshop caused a lasting +58% lift in EUI&apos;s monthly baseline — events convert to retained users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
