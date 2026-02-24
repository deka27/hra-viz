import StatCard from "../components/StatCard";
import SessionDepthChart from "../components/charts/SessionDepthChart";
import {
  SpikeComparisonChart,
  TripleToolSpikeChart,
  AprilCoSpikeChart,
  SeasonalPatternChart,
  KGTrajectoryChart,
  EUIBaselineLiftChart,
} from "../components/charts/InsightEventCharts";
import {
  KeyboardAsymmetryChart,
  CDEEntrySplitChart,
  ReferrerEcosystemChart,
  NavClicksChart,
} from "../components/charts/InsightFeatureCharts";

// Chart to embed per insight (keyed by insight id)
const INSIGHT_CHARTS: Record<number, React.ReactNode> = {
  1:  <SpikeComparisonChart />,
  2:  <TripleToolSpikeChart />,
  3:  <AprilCoSpikeChart />,
  4:  <SeasonalPatternChart />,
  5:  <KGTrajectoryChart />,
  6:  <EUIBaselineLiftChart />,
  10: <KeyboardAsymmetryChart />,
  12: <CDEEntrySplitChart />,
  18: <ReferrerEcosystemChart />,
  19: <NavClicksChart />,
  20: <SessionDepthChart />,
};

const insights = [
  // ── EVENTS & SPIKES ─────────────────────────────────────────────────────────
  {
    id: 1,
    section: "Events & Traffic Spikes",
    color: "border-l-red-500",
    dot: "bg-red-500",
    tag: "Spike",
    title: "March 2024 workshop drove a 4,075% EUI surge",
    metric: "171 → 7,140 visits in one month",
    detail:
      "EUI's March 2024 spike is the largest single-month jump in the dataset (+4,075%). FTU Explorer spiked even harder in percentage terms (+5,673%: 22 → 1,270), while RUI hit +1,564%. All three tools spiked simultaneously — unmistakably a single organized event.",
    implication:
      "Identify and partner with the instructors/organizers. The event was large enough to be a university course or multi-institution workshop. Building course-ready materials (guided exercises, sample data sets) could make HRA tools a recurring semester fixture.",
    data: [
      { label: "EUI spike", value: "+4,075%" },
      { label: "FTU Explorer spike", value: "+5,673%" },
      { label: "RUI spike", value: "+1,564%" },
    ],
  },
  {
    id: 2,
    section: "Events & Traffic Spikes",
    color: "border-l-amber-500",
    dot: "bg-amber-500",
    tag: "Spike",
    title: "October 2024 triple-tool spike was eerily symmetric",
    metric: "CDE=1,218 · EUI=1,254 · RUI=1,253",
    detail:
      "In October 2024, three tools reached nearly identical visit counts within 36 of each other — a statistical near-impossibility by chance. This is a textbook signature of a single live demo event where an instructor switched between tools in front of an audience, each tool getting a comparable share of the session.",
    implication:
      "This level of coordinated usage suggests HRA tools are being demonstrated as a suite, not individually. Lean into this by building a unified 'HRA Demo Mode' or guided multi-tool walkthrough.",
    data: [
      { label: "CDE visits", value: "1,218" },
      { label: "EUI visits", value: "1,254" },
      { label: "RUI visits", value: "1,253" },
    ],
  },
  {
    id: 3,
    section: "Events & Traffic Spikes",
    color: "border-l-emerald-500",
    dot: "bg-emerald-500",
    tag: "New Event Found",
    title: "April 2025: A CDE + FTU Explorer co-spike we weren't tracking",
    metric: "CDE +156% · FTU +471%",
    detail:
      "April 2025 shows CDE jumping 451 (+156%) and FTU Explorer hitting 594 (+471%), while EUI stayed flat at 240. This is a distinct event from the March/October patterns — it specifically showcased CDE and FTU, suggesting a specialized workshop focused on cell distribution and functional tissue units.",
    implication:
      "There are at least 3 distinct recurring event types: a broad spring showcase (March 2024), a fall conference (October 2024), and a CDE/FTU-focused workshop (April 2025). Each warrants its own outreach strategy.",
    data: [
      { label: "CDE Apr 2025", value: "176 → 451 (+156%)" },
      { label: "FTU Apr 2025", value: "104 → 594 (+471%)" },
      { label: "EUI Apr 2025 (flat)", value: "228 → 240 (+5%)" },
    ],
  },
  {
    id: 4,
    section: "Events & Traffic Spikes",
    color: "border-l-orange-500",
    dot: "bg-orange-500",
    tag: "Academic Pattern",
    title: "October is consistently the highest-traffic month",
    metric: "Oct avg: 4,321 visits · Oct 2025: 4,834 (all-time peak)",
    detail:
      "Averaging across all Octobers in the dataset: 4,321 visits/month — far above any other calendar month. This perfectly aligns with fall academic semester activity. January averages 1,017 (post-holiday) and May averages just 410 (summer lull).",
    implication:
      "Plan major feature releases and outreach campaigns for September so they're polished before the October peak. Ensure server infrastructure can handle 4–5× normal traffic in October.",
    data: [
      { label: "Oct avg (all years)", value: "4,321 visits" },
      { label: "Oct 2025 (all-time high)", value: "4,834 visits" },
      { label: "May avg (summer lull)", value: "410 visits" },
    ],
  },

  // ── TOOL TRAJECTORIES ───────────────────────────────────────────────────────
  {
    id: 5,
    section: "Tool Trajectories",
    color: "border-l-rose-500",
    dot: "bg-rose-500",
    tag: "Growth Story",
    title: "KG Explorer launched and immediately dominated — but is now declining",
    metric: "Peak 3,891 in Oct '25 → 2,141 in Jan '26 (−45%)",
    detail:
      "KG Explorer grew 90% MoM at launch (Aug→Sep 2025), peaked at 3,891 in October, then declined 45% over the following three months. Some decline is expected post-launch and from seasonal patterns (Dec/Jan are slower months), but the pace is steep. January 2026 at 2,141 is still well above any other tool's baseline.",
    implication:
      "Monitor KG Explorer's February and March 2026 numbers closely. If the decline continues past the seasonal dip, investigate whether users are hitting friction points (missing features, confusing UI, or data gaps).",
    data: [
      { label: "Oct '25 peak", value: "3,891 visits" },
      { label: "Jan '26", value: "2,141 visits (−45%)" },
      { label: "Growth at launch", value: "+90% MoM" },
    ],
  },
  {
    id: 6,
    section: "Tool Trajectories",
    color: "border-l-blue-500",
    dot: "bg-blue-500",
    tag: "Lasting Impact",
    title: "The March 2024 workshop permanently lifted EUI's baseline",
    metric: "Pre-event avg: 132/mo → Post-event avg: 209/mo (+58%)",
    detail:
      "EUI's pre-March 2024 baseline (Jan–Feb 2024 avg) was 132 visits/month. After the event, the Apr–Aug 2024 avg was 209 — a 58% permanent lift. The March 2024 event essentially grew EUI's regular audience by ~77 users/month.",
    implication:
      "Events are one of the highest-ROI growth strategies for HRA tools. Each major event leaves a lasting baseline increase. Doubling the frequency of events could compound baseline growth significantly.",
    data: [
      { label: "Pre-event baseline", value: "132 visits/mo" },
      { label: "Post-event baseline", value: "209 visits/mo" },
      { label: "Permanent lift", value: "+58% (+77 users/mo)" },
    ],
  },
  {
    id: 7,
    section: "Tool Trajectories",
    color: "border-l-zinc-400",
    dot: "bg-zinc-400",
    tag: "Concerning Trend",
    title: "Non-KG tools are flat-to-declining in H2 2025",
    metric: "535–787 visits/mo (ex-KG), down from 744–1,491 in H1",
    detail:
      "Stripping out KG Explorer, the four other tools combined averaged 535–787 visits/month in H2 2025, versus 541–1,491 in H1. The HRA user base doesn't appear to be growing overall — it's shifting to KG Explorer. EUI's 2025 total (2,748) is down from its 2024 equivalent (3,255 excl. the March spike).",
    implication:
      "KG Explorer's success may be attracting users who would otherwise use EUI or FTU Explorer. Cross-linking between tools could keep users in the HRA ecosystem rather than leaving after one tool.",
    data: [
      { label: "Non-KG H1 2025 avg", value: "~779 visits/mo" },
      { label: "Non-KG H2 2025 avg", value: "~670 visits/mo" },
      { label: "EUI 2025 vs 2024 (ex-spike)", value: "2,748 vs 3,255 (−16%)" },
    ],
  },

  // ── FEATURE INSIGHTS ────────────────────────────────────────────────────────
  {
    id: 8,
    section: "Feature Insights",
    color: "border-l-violet-500",
    dot: "bg-violet-500",
    tag: "Hidden Feature",
    title: "RUI opacity controls are nearly invisible to users",
    metric: "196 total opacity toggles across 5,161 RUI visits (3.8%)",
    detail:
      "Only 1 in 26 RUI visits triggers any opacity interaction. The 'All Anatomical Structures' global toggle accounts for 26% of those (50 uses) — users who find the feature tend to use the bulk action rather than per-structure controls.",
    implication:
      "Surface opacity controls with an onboarding tooltip on first RUI load. A simple 'Tip: You can toggle organ visibility' prompt could dramatically increase this metric.",
    data: [
      { label: "Total opacity toggles", value: "196" },
      { label: "Usage rate", value: "3.8% of visits" },
      { label: "Most-used toggle", value: "All Structures (50×)" },
    ],
  },
  {
    id: 9,
    section: "Feature Insights",
    color: "border-l-amber-400",
    dot: "bg-amber-400",
    tag: "Missing Feature",
    title: "CDE export/download is completely undiscovered",
    metric: "132 visualizations created · 0 downloads",
    detail:
      "The CDE workflow has a strong 81% completion rate (163 uploads → 132 submits), but zero download interactions are logged. Users are creating visualizations and then hitting a dead end. Either the export button doesn't exist, is hidden, or is far outside the visible viewport.",
    implication:
      "Audit the CDE post-visualization screen immediately. Place a prominent 'Download / Export' CTA directly after the visualization renders. This is potentially the highest-value UX fix in the entire HRA suite.",
    data: [
      { label: "Visualizations submitted", value: "132" },
      { label: "Downloads logged", value: "0" },
      { label: "Completion rate", value: "81% (upload → submit)" },
    ],
  },
  {
    id: 10,
    section: "Feature Insights",
    color: "border-l-violet-400",
    dot: "bg-violet-400",
    tag: "Navigation Pattern",
    title: "RUI users strafe left 2× more than right",
    metric: "A key: 974 uses · D key: 473 uses",
    detail:
      "In RUI 3D navigation, the A key (left) is used 2.06× more than D (right). Q+E (vertical rotation: 1,276 total) dwarf W (forward: 528), suggesting users spend much more time adjusting depth and elevation than translating through the 3D space.",
    implication:
      "Users may be finding it easier to approach tissue block placement by rotating vertically and sidestepping left. Consider adding a visible movement guide or smart-snap features to reduce navigation friction.",
    data: [
      { label: "A key (left)", value: "974 (30.0%)" },
      { label: "D key (right)", value: "473 (14.5%)" },
      { label: "Q+E (vertical)", value: "1,276 (39.2%)" },
    ],
  },
  {
    id: 11,
    section: "Feature Insights",
    color: "border-l-emerald-400",
    dot: "bg-emerald-400",
    tag: "High Engagement",
    title: "EUI spatial search users are deeply engaged once inside",
    metric: "330 scene navigation events vs 101 button clicks (3.3×)",
    detail:
      "Of users who click the spatial search button (101), many spend significant time navigating the 3D scene (330 navigation events). Only 37 reach the 'continue to search' step (37%), but those who do view results — 68 view tissue blocks, 54 anatomical structures, 25 cell types.",
    implication:
      "The spatial search onboarding has a 37% continuation rate. Simplifying the organ selection step or adding a 'Quick Search' preset for common organs (kidney, heart) could significantly increase completion.",
    data: [
      { label: "Button clicks", value: "101" },
      { label: "Scene navigation events", value: "330 (3.3×)" },
      { label: "Continue to search", value: "37 (37% of clicks)" },
    ],
  },
  {
    id: 12,
    section: "Feature Insights",
    color: "border-l-fuchsia-500",
    dot: "bg-fuchsia-500",
    tag: "UX Insight",
    title: "43% of CDE users skip the landing page entirely",
    metric: "70 of 163 uploads bypassed the landing CTA",
    detail:
      "The CDE landing page 'Create a Visualization' CTA was clicked 93 times, but 163 file uploads were recorded — meaning 70 users (43%) went directly to the upload page without using the CTA. These are likely returning users with bookmarked URLs or direct links from documentation.",
    implication:
      "The upload page itself needs to be fully self-explanatory since nearly half of users arrive there without landing page context. Add in-page guidance, accepted file format info, and a quick-start template directly on the upload screen.",
    data: [
      { label: "Landing CTA clicks", value: "93" },
      { label: "Total uploads", value: "163" },
      { label: "Direct-to-upload rate", value: "43% bypassed landing" },
    ],
  },

  // ── TRAFFIC & GEOGRAPHY ─────────────────────────────────────────────────────
  {
    id: 20,
    section: "Traffic & Geography",
    color: "border-l-orange-400",
    dot: "bg-orange-400",
    tag: "Engagement",
    title: "Engagement is bimodal — users either bounce immediately or go very deep",
    metric: "28% single-event bounces · 24% with 11+ events",
    detail:
      "Of 6,362 tracked sessions, 1,776 (28%) contained only a single interaction before ending. Yet on the opposite end, 1,449 sessions (23%) generated 11 or more events — and 741 (12%) hit 20+. The middle tiers (3–10 events) make up 33%. There is no 'average' user: sessions are strongly polarized between quick visits and deep dives.",
    implication:
      "Two distinct user archetypes are evident: explorers who bounce after a quick look and power users who spend significant time. Design for both: add immediate value indicators on first load to hook the bouncers, and invest in advanced features and shortcuts for the power users who return.",
    data: [
      { label: "Single-event bounces", value: "1,776 (28%)" },
      { label: "Sessions with 11+ events", value: "1,449 (23%)" },
      { label: "Sessions with 20+ events", value: "741 (12%)" },
    ],
  },

  // ── PORTAL & ECOSYSTEM ──────────────────────────────────────────────────────
  {
    id: 18,
    section: "Portal & Ecosystem",
    color: "border-l-teal-500",
    dot: "bg-teal-500",
    tag: "External Integration",
    title: "GTEx Portal is HRA's largest external API consumer — 1.73M requests",
    metric: "GTEx 1.73M · HubMAP 1.38M · EBI 97K · SenNet 95K",
    detail:
      "Referrer analysis of 12.7M CloudFront log rows reveals GTEx Portal (gtexportal.org) is responsible for 1,726,230 requests to HRA's CDN and APIs — more than HubMAP (1.38M). Every GTEx gene visualization that overlays organ-level data triggers multiple HRA API calls in the background. EBI (97K) and SenNet (95K) are also significant integrators. Internal self-referrals from humanatlas.io account for an additional 2.4M.",
    implication:
      "HRA is not just a standalone tool suite — it's foundational API infrastructure for at least 4 major genomics platforms. Any breaking API changes need careful deprecation periods and partner notifications. Formalize API contracts with the GTEx and HubMAP engineering teams to prevent inadvertent breakage.",
    data: [
      { label: "GTEx Portal", value: "1.73M API requests" },
      { label: "HubMAP", value: "1.38M API requests" },
      { label: "EBI + SenNet", value: "192K combined" },
    ],
  },
  {
    id: 19,
    section: "Portal & Ecosystem",
    color: "border-l-sky-400",
    dot: "bg-sky-400",
    tag: "Discovery Path",
    title: "Users browse 'Data' 1.5× more than 'Apps' — data drives tool discovery",
    metric: "Data: 668 clicks · Apps: 440 · Development: 278",
    detail:
      "Portal navigation click analysis (e.label field from 114K event-tracked interactions) shows 'Data' is the most-clicked navigation item (668), followed by 'Apps' (440) — a 52% gap. Users explore HRA datasets first and discover interactive tools second. 'Development' documentation drives 278 clicks, signaling a meaningful developer/researcher audience.",
    implication:
      "Embed tool launch points directly within data browsing pages. 'Explore this dataset in EUI' or 'Register a tissue block with RUI' CTAs placed on data pages can capture users already in research mode — likely higher-intent than cold-landing on the Apps page.",
    data: [
      { label: "'Data' nav clicks", value: "668 (35%)" },
      { label: "'Apps' nav clicks", value: "440 (23%)" },
      { label: "'Development' nav clicks", value: "278 (15%)" },
    ],
  },
  {
    id: 13,
    section: "Portal & Ecosystem",
    color: "border-l-sky-500",
    dot: "bg-sky-500",
    tag: "Discovery Path",
    title: "The HRA portal is the primary tool discovery mechanism",
    metric: "6,620 portal navigation interactions in top 20 UI elements",
    detail:
      "Four of the top 20 UI interactions are HRA Portal header navigation links (Data, Applications, Training, About). Portal elements collectively account for 6,620 interactions — more than EUI (4,877) or RUI (4,488) individually.",
    implication:
      "The portal's 'Applications' navigation link (1,442 interactions) is a critical funnel point. Ensure the tool listing page loads fast, shows clear descriptions, and is updated immediately when new tools launch.",
    data: [
      { label: "Portal nav interactions", value: "6,620" },
      { label: "Applications link", value: "1,442 clicks" },
      { label: "Training link", value: "882 clicks" },
    ],
  },
  {
    id: 14,
    section: "Portal & Ecosystem",
    color: "border-l-teal-500",
    dot: "bg-teal-500",
    tag: "Feature Champion",
    title: "FTU Explorer's entire value is in one element",
    metric: "2,387 bar graph interactions from a single UI element",
    detail:
      "The HRA Population Visualizer bar graph is FTU Explorer's #2 most-interacted element overall. It's the single most interaction-dense element per tool — FTU Explorer's value proposition is entirely concentrated in this one visualization. No other FTU elements appear in the top 20.",
    implication:
      "FTU Explorer has a very focused use case. Double down on the bar graph: add filtering, export, and comparison features. Consider promoting it as a standalone widget embeddable in other HRA tools.",
    data: [
      { label: "Bar graph interactions", value: "2,387" },
      { label: "Rank among all elements", value: "#2 overall" },
      { label: "Other FTU elements in top 20", value: "None" },
    ],
  },

  // ── TRAFFIC & GEOGRAPHY ─────────────────────────────────────────────────────
  {
    id: 15,
    section: "Traffic & Geography",
    color: "border-l-rose-400",
    dot: "bg-rose-400",
    tag: "Global Reach",
    title: "Asia-Pacific accounts for nearly 1 in 4 visits",
    metric: "10,341 visits (23.8%) from Asia-Pacific",
    detail:
      "Asia-Pacific delivers 23.8% of total visits, nearly matching Europe (11.8%) combined. Hong Kong (#2 globally, 2,845), Singapore (#3, 1,926), Japan (#4, 1,875), and China (#5, 1,862) all individually outrank Germany, Ireland, and most European countries.",
    implication:
      "Asia-Pacific is not an afterthought — it's the #2 market by region. Ensure HRA tool servers are geographically distributed to minimize latency for Asian users, and consider reaching out to leading biomedical research institutions in HK, SG, and JP.",
    data: [
      { label: "Asia-Pacific total", value: "10,341 visits (23.8%)" },
      { label: "Hong Kong rank", value: "#2 globally" },
      { label: "Singapore rank", value: "#3 globally" },
    ],
  },
  {
    id: 16,
    section: "Traffic & Geography",
    color: "border-l-yellow-500",
    dot: "bg-yellow-500",
    tag: "Anomaly",
    title: "Ecuador, Bulgaria, and Seychelles show suspicious traffic volume",
    metric: "EC: 769 · BG: 246 · SC: 108",
    detail:
      "Ecuador ranks #9 globally (769 visits) — ahead of Germany. Bulgaria has 246 visits and Seychelles (pop. ~100K) has 108. None of these countries have prominent biomedical atlas research programs. Possible explanations: CDN/proxy endpoints misattributing traffic, or automated scripts.",
    implication:
      "Cross-reference CloudFront IP addresses for Ecuador and Seychelles traffic against known CDN ranges. If confirmed as CDN artifacts, exclude these from geographic analyses to avoid misallocating outreach resources.",
    data: [
      { label: "Ecuador rank", value: "#9 globally (769 visits)" },
      { label: "Bulgaria", value: "246 visits" },
      { label: "Seychelles (pop 100K)", value: "108 visits" },
    ],
  },
  {
    id: 17,
    section: "Feature Insights",
    color: "border-l-red-400",
    dot: "bg-red-400",
    tag: "Quality Issue",
    title: "72% of all errors come from 3 fixable bugs",
    metric: "15,401 of 21,350 errors traceable to specific root causes",
    detail:
      "Stack trace analysis reveals the error rate isn't a broad UX problem — it's concentrated in 3 specific bugs. KG Explorer has missing icon assets on the CDN (6,712 errors, 31%). An API endpoint (technology-names) is returning CORS/network failures app-wide (6,438 errors, 30%). EUI has a null reference in its 3D picking pipeline that triggers on clicks before the model loads (2,251 errors, 11%). RUI and CDE are nearly clean (0.2% and 0.7% error rates).",
    implication:
      "Fix in priority order: (1) Patch the technology-names API CORS configuration — one server fix eliminates 6,400 errors. (2) Audit KG Explorer CDN paths for icon assets — all product and organ SVGs are failing to resolve. (3) Add a null guard in EUI's eR.unproject / getLastPickedObject before accessing index [0].",
    data: [
      { label: "KG Explorer error rate", value: "35% (7,034 errors)" },
      { label: "EUI error rate", value: "28% (2,846 errors)" },
      { label: "RUI error rate", value: "0.2% (16 errors) ✓" },
    ],
  },
];

const SECTIONS = [...new Set(insights.map((i) => i.section))];

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Key Insights</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">What the Data Tells Us</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          20 actionable findings derived from CloudFront log analysis across{" "}
          <span className="text-zinc-300 font-medium">27 months</span> of HRA tool usage data, covering
          traffic patterns, feature adoption, user behavior, and geographic distribution.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Insights" value="20" sub="Across 4 categories" accent="text-blue-400" />
        <StatCard label="Event Patterns" value="4" sub="Systemic academic cycle" accent="text-amber-400" />
        <StatCard label="Hidden Features" value="2" sub="Opacity controls, CDE export" accent="text-violet-400" />
        <StatCard label="Quality Issues" value="3" sub="Errors, declining KG, anomalies" accent="text-red-400" />
      </div>

      {/* Insights grouped by section */}
      {SECTIONS.map((section) => (
        <div key={section} className="flex flex-col gap-4">
          {/* Section divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2">
              {section}
            </span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {insights
            .filter((i) => i.section === section)
            .map((insight) => {
              const chart = INSIGHT_CHARTS[insight.id];
              return (
                <div
                  key={insight.id}
                  className={`bg-zinc-900 border border-zinc-800 border-l-4 ${insight.color} rounded-xl p-5`}
                >
                  {/* Top row: tag + number */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${insight.dot}`} />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      #{insight.id} · {insight.tag}
                    </span>
                  </div>

                  {/* Two-column layout when there's no chart, chart-below when there is */}
                  {chart ? (
                    <div className="flex flex-col gap-4">
                      {/* Text content */}
                      <div className="flex flex-col gap-2">
                        <div>
                          <h2 className="text-base font-bold text-zinc-100 mb-0.5">{insight.title}</h2>
                          <p className="text-xs font-medium text-zinc-500">{insight.metric}</p>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{insight.detail}</p>
                        <div className="flex items-start gap-2 bg-zinc-800/60 rounded-lg p-3">
                          <span className="text-xs text-zinc-500 mt-0.5 shrink-0">→</span>
                          <p className="text-xs text-zinc-300 leading-relaxed">{insight.implication}</p>
                        </div>
                      </div>
                      {/* Chart below */}
                      <div className="border-t border-zinc-800 pt-4">
                        {chart}
                      </div>
                    </div>
                  ) : (
                    /* Side-by-side layout for text-only insights */
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                      <div className="flex-1 flex flex-col gap-2">
                        <div>
                          <h2 className="text-base font-bold text-zinc-100 mb-0.5">{insight.title}</h2>
                          <p className="text-xs font-medium text-zinc-500">{insight.metric}</p>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{insight.detail}</p>
                        <div className="flex items-start gap-2 bg-zinc-800/60 rounded-lg p-3 mt-1">
                          <span className="text-xs text-zinc-500 mt-0.5 shrink-0">→</span>
                          <p className="text-xs text-zinc-300 leading-relaxed">{insight.implication}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 lg:min-w-[200px]">
                        {insight.data.map((d) => (
                          <div key={d.label} className="bg-zinc-800/40 rounded-lg px-3 py-2">
                            <div className="text-xs text-zinc-500">{d.label}</div>
                            <div className="text-sm font-semibold text-zinc-200 tabular-nums">{d.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
