import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import EUISpatialFunnelChart from "../components/charts/EUISpatialFunnelChart";
import CDESankeyChart from "../components/charts/CDESankeyChart";

export default function OpportunitiesPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">UX Gaps & Opportunities</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">What Users Aren&apos;t Finding</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Several high-value features in EUI, RUI, and CDE go nearly undiscovered.
          These are the biggest opportunities to improve tool value without adding new functionality.
        </p>
      </div>

      {/* Hero gap stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CDE Downloads"
          value="0"
          sub="Export feature is completely invisible"
          accent="text-red-400"
        />
        <StatCard
          label="Spatial Search → Applied"
          value="5 uses"
          sub="Of 13,366 EUI visits — 0.04%"
          accent="text-red-400"
        />
        <StatCard
          label="RUI Opacity Panel Opens"
          value="4"
          sub="Panel toggle found by 4 users total"
          accent="text-orange-400"
        />
        <StatCard
          label="CDE Completion Rate"
          value="81%"
          sub="132 / 163 uploaders — strong"
          accent="text-emerald-400"
        />
      </div>

      {/* Critical Gaps */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-zinc-100">3 Critical Feature Discovery Gaps</h2>
          <p className="text-xs text-zinc-500">Features that exist but are functionally invisible to users</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Gap 1: CDE Download */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Critical · CDE</span>
              <span className="text-2xl font-bold text-red-400">0</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-100">Export / Download Never Used</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                132 users successfully created visualizations. Zero of them used the download feature.
                Either the button is invisible after render, or users don&apos;t know it exists.
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-zinc-400">
                Add a prominent &ldquo;Download your visualization&rdquo; CTA immediately after the visualization renders.
                Consider an auto-prompt: &ldquo;Your chart is ready — export as PNG or CSV?&rdquo;
              </p>
            </div>
          </div>

          {/* Gap 2: Spatial Search */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Critical · EUI</span>
              <span className="text-2xl font-bold text-red-400">5</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-100">Spatial Search Rarely Applied</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Of 13,366 EUI visits, only 101 (0.76%) opened the spatial search panel — and just 5 ever
                applied it as an active filter. Users open the feature but don&apos;t complete the workflow.
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-zinc-400">
                Add an in-panel tooltip explaining what spatial search does and why to apply it.
                The &ldquo;Apply Filter&rdquo; button may need to be more salient — consider auto-applying on config completion.
              </p>
            </div>
          </div>

          {/* Gap 3: RUI Opacity */}
          <div className="bg-zinc-900 border border-orange-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Critical · RUI</span>
              <span className="text-2xl font-bold text-orange-400">4</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-100">Opacity Panel Undiscovered</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The opacity settings panel toggle was found by only 4 users in the entire dataset.
                196 total opacity interactions happened — all from those who stumbled on it manually.
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-zinc-400">
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
        subtitle="Of 101 users who opened spatial search, only 5 (5%) ever applied it as a data filter"
        badge="EUI · Low Adoption"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EUISpatialFunnelChart />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">The Entry Problem</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Only <span className="text-blue-400 font-semibold">0.76%</span> of EUI visitors
                (101 of 13,366) ever open the spatial search panel.
                The feature is valuable but not prominent enough to be discovered organically.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">The Completion Gap</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Of those 101 who open the panel, <span className="text-blue-400 font-semibold">37 (37%)</span> configure an organ
                but only <span className="text-red-400 font-semibold">5 (5%)</span> apply it as a filter.
                Users explore the feature but don&apos;t understand or find the final &ldquo;Apply&rdquo; action.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Note on &ldquo;Explored Results&rdquo;</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                68 result views exceed the 37 who configured — likely users re-opening an
                existing search. Results are browsed but rarely committed to.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* CDE Sankey */}
      <ChartCard
        title="CDE User Journey — Where Users Go and Where They Stop"
        subtitle="Flow of all 163 users who uploaded data through the CDE workflow"
        badge="CDE"
        badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CDESankeyChart />
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Direct Entry: 43%</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                70 of 163 uploaders bypassed the landing page entirely — arriving directly at the create page
                via bookmarks, external links, or navigation. Suggests the landing page is not the primary discovery path.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Config Drop-off: 19%</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                31 users (19%) abandoned at the configuration step — 5 axis selectors + cell type + parameters.
                This is the highest-friction step in the workflow. Defaults or smart suggestions could help.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Zero Downloads</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Every user who visualized stopped there. The download capability is a completely
                missed product surface — no logged interaction whatsoever.
              </p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Cross-Tool Opportunities */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-zinc-100">Cross-Tool Growth Opportunities</h2>
          <p className="text-xs text-zinc-500">Derived from monthly co-occurrence patterns — tools that move together share audiences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-zinc-200">EUI</span>
              </div>
              <span className="text-zinc-600">↔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-zinc-200">FTU Explorer</span>
              </div>
              <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">r = 0.89</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Strongest correlation in the dataset. Both spike together during IU workshop events — they share
              the same workshop-attending researcher audience. Adding an FTU Explorer CTA inside EUI
              (and vice versa) could increase adoption of both with near-zero engineering cost.
            </p>
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-emerald-400 font-medium">Action: Add &ldquo;Explore organ FTUs&rdquo; button in EUI sidebar when a user selects an organ</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-zinc-200">CDE</span>
              </div>
              <span className="text-zinc-600">↔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-sm font-semibold text-zinc-200">RUI</span>
              </div>
              <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">r = 0.67</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              CDE and RUI share a data-registration researcher audience who work with
              tissue-level data. CDE users who visualize cell distributions are likely the same users
              who register tissue blocks in RUI. Cross-linking them could improve both tool stickiness.
            </p>
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-emerald-400 font-medium">Action: Link from CDE visualization to &ldquo;Register this tissue in RUI&rdquo; workflow</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-zinc-200">EUI</span>
              </div>
              <span className="text-zinc-600">↔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-zinc-200">CDE</span>
              </div>
              <span className="ml-auto text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">r ≈ 0.00</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Near-zero correlation means EUI and CDE attract separate user personas. EUI serves
              spatial browsers; CDE serves data-upload researchers. Attempting to cross-promote
              these two would likely see low conversion — focus cross-promotion budget elsewhere.
            </p>
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium">No action: Different audiences — don&apos;t conflate them in onboarding or marketing</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-sm font-semibold text-zinc-200">KG Explorer</span>
              </div>
              <span className="text-zinc-600">trajectory</span>
              <span className="ml-auto text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">−45% since Oct</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              KG Explorer peaked in October 2025 at launch excitement and has declined 45% since.
              Over its active window it shows r=0.64 correlation with RUI — suggesting its audience overlaps
              with RUI&apos;s power users. Targeted re-engagement of RUI users could reverse the KG decline.
            </p>
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-amber-400 font-medium">Action: Add KG Explorer surface to RUI sidebar — &ldquo;Explore the knowledge graph for this structure&rdquo;</p>
            </div>
          </div>
        </div>
      </div>

      {/* What's actually working */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">What&apos;s Working</p>
          <h2 className="text-base font-semibold text-zinc-50">Strengths to Protect</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-emerald-400">81%</span>
            <span className="text-sm text-zinc-300 font-medium">CDE Completion Rate</span>
            <span className="text-xs text-zinc-500">132 of 163 uploaders successfully visualized their data — the core workflow is solid once users start</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-violet-400">63%</span>
            <span className="text-sm text-zinc-300 font-medium">RUI Keyboard Engagement</span>
            <span className="text-xs text-zinc-500">3,251 keyboard interactions across 5,161 RUI visits — users are invested enough to learn keyboard shortcuts</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-blue-400">+58%</span>
            <span className="text-sm text-zinc-300 font-medium">EUI Permanent Baseline Lift</span>
            <span className="text-xs text-zinc-500">The Mar 2024 workshop caused a lasting +58% lift in EUI&apos;s monthly baseline — events convert to retained users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
