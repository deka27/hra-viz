import StatCard from "../components/StatCard";
import SessionDepthChart from "../components/charts/SessionDepthChart";
import {
  SpikeComparisonChart,
  AprilCoSpikeChart,
  SeasonalPatternChart,
  KGTrajectoryChart,
} from "../components/charts/InsightEventCharts";
import {
  KeyboardAsymmetryChart,
  ReferrerEcosystemChart,
  NavClicksChart,
} from "../components/charts/InsightFeatureCharts";

// Compact charts for bento cards
const INSIGHT_CHARTS: Record<number, React.ReactNode> = {
  1:  <SpikeComparisonChart compact />,
  3:  <AprilCoSpikeChart compact />,
  4:  <SeasonalPatternChart compact />,
  5:  <KGTrajectoryChart compact />,
  10: <KeyboardAsymmetryChart compact />,
  18: <ReferrerEcosystemChart compact />,
  19: <NavClicksChart compact />,
  20: <SessionDepthChart compact />,
};

const SECTION_GROUPS = [
  { name: "Events & Traffic Spikes",  ids: [1, 2, 3, 4]           },
  { name: "Tool Trajectories",        ids: [5, 6, 7]               },
  { name: "Feature Insights",         ids: [8, 9, 11, 10, 17, 12] },
  { name: "Portal & Ecosystem",       ids: [18, 13, 19, 14]        },
  { name: "Traffic & Geography",      ids: [20, 15, 16]            },
];

const insights = [
  // ── EVENTS & TRAFFIC SPIKES ───────────────────────────────────────────────
  {
    id: 1,
    color: "border-l-red-500",
    dot: "bg-red-500",
    tag: "Spike",
    title: "An unidentified event drove a 4,075% EUI surge in March 2024",
    metric: "171 → 7,140 visits in one month · Probably an internal HuBMAP/HRA training session",
    implication:
      "No public record found for this event. Likely an internal HuBMAP/HRA training or course module. Reach out to the HRA team for records of any workshops or courses in March 2024.",
    data: [
      { label: "EUI spike",         value: "+4,075%" },
      { label: "FTU Explorer spike", value: "+5,673%" },
      { label: "RUI spike",         value: "+1,564%" },
    ],
  },
  {
    id: 2,
    color: "border-l-amber-500",
    dot: "bg-amber-500",
    tag: "Spike",
    title: "October 2024 triple-tool spike was eerily symmetric",
    metric: "CDE=1,218 · EUI=1,254 · RUI=1,253 · Probably: 'HRA: Powers of Ten' Workshop",
    implication:
      "Probably the 'HRA: Powers of Ten' JumpStart workshop (Andreas Bueckle, IU CNS, NIH HuBMAP JumpStart Fellowship 2024–25). Lean into this by building a unified 'HRA Demo Mode' or guided multi-tool walkthrough that an instructor can run in one session.",
    data: [
      { label: "CDE visits",  value: "1,218" },
      { label: "EUI visits",  value: "1,254" },
      { label: "RUI visits",  value: "1,253" },
    ],
  },
  {
    id: 3,
    color: "border-l-emerald-500",
    dot: "bg-emerald-500",
    tag: "New Event Found",
    title: "April 2025: A CDE + FTU Explorer co-spike we weren't tracking",
    metric: "CDE +156% · FTU +471% · Probably: HuBMAP working group or HRA release training",
    implication:
      "Probably an HRA working group session or training around a new HRA release. There are at least 3 distinct recurring event types — each warrants its own outreach strategy.",
    data: [
      { label: "CDE Apr 2025",          value: "176 → 451 (+156%)" },
      { label: "FTU Apr 2025",          value: "104 → 594 (+471%)" },
      { label: "EUI Apr 2025 (flat)",   value: "228 → 240 (+5%)"   },
    ],
  },
  {
    id: 4,
    color: "border-l-orange-500",
    dot: "bg-orange-500",
    tag: "Academic Pattern",
    title: "October is consistently the highest-traffic month",
    metric: "Oct avg: 4,321 visits · Oct 2025: 4,834 (all-time peak)",
    implication:
      "Plan major feature releases and outreach campaigns for September so they're polished before the October peak. Ensure server infrastructure can handle 4–5× normal traffic.",
    data: [
      { label: "Oct avg (all years)",    value: "4,321 visits" },
      { label: "Oct 2025 (all-time)",    value: "4,834 visits" },
      { label: "May avg (summer lull)",  value: "410 visits"   },
    ],
  },

  // ── TOOL TRAJECTORIES ─────────────────────────────────────────────────────
  {
    id: 5,
    color: "border-l-rose-500",
    dot: "bg-rose-500",
    tag: "Growth Story",
    title: "KG Explorer launched and immediately dominated — but is now declining",
    metric: "Peak 3,891 in Oct '25 → 2,141 in Jan '26 (−45%)",
    implication:
      "Monitor KG Explorer's February and March 2026 numbers closely. If decline continues past the seasonal dip, investigate whether users are hitting friction points.",
    data: [
      { label: "Oct '25 peak",     value: "3,891 visits"     },
      { label: "Jan '26",          value: "2,141 (−45%)"     },
      { label: "Growth at launch", value: "+90% MoM"         },
    ],
  },
  {
    id: 6,
    color: "border-l-blue-500",
    dot: "bg-blue-500",
    tag: "Lasting Impact",
    title: "The March 2024 event permanently lifted EUI's baseline",
    metric: "Pre-event avg: 132/mo → Post-event avg: 209/mo (+58%)",
    implication:
      "Events are one of the highest-ROI growth strategies for HRA tools. Each major event leaves a lasting baseline increase. Doubling event frequency could compound baseline growth significantly.",
    data: [
      { label: "Pre-event baseline",  value: "132 visits/mo"       },
      { label: "Post-event baseline", value: "209 visits/mo"       },
      { label: "Permanent lift",      value: "+58% (+77 users/mo)" },
    ],
  },
  {
    id: 7,
    color: "border-l-zinc-400",
    dot: "bg-zinc-400",
    tag: "Concerning Trend",
    title: "Non-KG tools are flat-to-declining in H2 2025",
    metric: "535–787 visits/mo (ex-KG), down from 744–1,491 in H1",
    implication:
      "Cross-linking between tools could keep users in the HRA ecosystem rather than leaving after one tool. KG Explorer's success may be cannibalizing EUI and FTU traffic.",
    data: [
      { label: "Non-KG H1 2025 avg",         value: "~779 visits/mo" },
      { label: "Non-KG H2 2025 avg",         value: "~670 visits/mo" },
      { label: "EUI 2025 vs 2024 (ex-spike)", value: "−16%"          },
    ],
  },

  // ── FEATURE INSIGHTS ──────────────────────────────────────────────────────
  {
    id: 8,
    color: "border-l-violet-500",
    dot: "bg-violet-500",
    tag: "Hidden Feature",
    title: "RUI opacity controls are nearly invisible to users",
    metric: "196 total opacity toggles across 5,161 RUI visits (3.8%)",
    implication:
      "Surface opacity controls with an onboarding tooltip on first RUI load. A simple 'Tip: You can toggle organ visibility' prompt could dramatically increase this metric.",
    data: [
      { label: "Total opacity toggles", value: "196"                  },
      { label: "Usage rate",            value: "3.8% of visits"       },
      { label: "Most-used toggle",      value: "All Structures (50×)" },
    ],
  },
  {
    id: 9,
    color: "border-l-amber-400",
    dot: "bg-amber-400",
    tag: "Missing Feature",
    title: "CDE export/download is completely undiscovered",
    metric: "132 visualizations created · 0 downloads",
    implication:
      "Audit the CDE post-visualization screen immediately. Place a prominent 'Download / Export' CTA directly after the visualization renders. Potentially the highest-value UX fix in HRA.",
    data: [
      { label: "Visualizations submitted", value: "132"        },
      { label: "Downloads logged",         value: "0"          },
      { label: "Completion rate",          value: "81% of uploads" },
    ],
  },
  {
    id: 11,
    color: "border-l-emerald-400",
    dot: "bg-emerald-400",
    tag: "High Engagement",
    title: "EUI spatial search users are deeply engaged once inside",
    metric: "330 scene navigation events vs 101 button clicks (3.3×)",
    implication:
      "The spatial search onboarding has a 37% continuation rate. Simplifying organ selection or adding 'Quick Search' presets for common organs (kidney, heart) could significantly increase completion.",
    data: [
      { label: "Button clicks",            value: "101"              },
      { label: "Scene navigation events",  value: "330 (3.3×)"       },
      { label: "Continue to search",       value: "37 (37% of clicks)" },
    ],
  },
  {
    id: 10,
    color: "border-l-violet-400",
    dot: "bg-violet-400",
    tag: "Navigation Pattern",
    title: "RUI users strafe left 2× more than right",
    metric: "A key: 974 uses · D key: 473 uses",
    implication:
      "Users may find it easier to approach placement by rotating vertically and sidestepping left. Consider a visible movement guide or smart-snap features to reduce navigation friction.",
    data: [
      { label: "A key (left)",    value: "974 (30.0%)"  },
      { label: "D key (right)",   value: "473 (14.5%)"  },
      { label: "Q+E (vertical)",  value: "1,276 (39.2%)" },
    ],
  },
  {
    id: 17,
    color: "border-l-red-400",
    dot: "bg-red-400",
    tag: "Quality Issue",
    title: "72% of all errors come from 3 fixable bugs",
    metric: "15,401 of 21,350 errors traceable to specific root causes",
    implication:
      "Fix in priority order: (1) Patch API CORS on technology-names endpoint. (2) Audit KG Explorer CDN paths for icon assets. (3) Add null guard in EUI's getLastPickedObject before index [0].",
    data: [
      { label: "KG Explorer error rate", value: "35% (7,034 errors)" },
      { label: "EUI error rate",         value: "28% (2,846 errors)" },
      { label: "RUI error rate",         value: "0.2% (16 errors) ✓" },
    ],
  },
  {
    id: 12,
    color: "border-l-fuchsia-500",
    dot: "bg-fuchsia-500",
    tag: "UX Insight",
    title: "43% of CDE users skip the landing page entirely",
    metric: "70 of 163 uploads bypassed the landing CTA",
    implication:
      "The upload page itself needs to be fully self-explanatory. Add in-page guidance, accepted file format info, and a quick-start template directly on the upload screen.",
    data: [
      { label: "Landing CTA clicks",    value: "93"                    },
      { label: "Total uploads",         value: "163"                   },
      { label: "Direct-to-upload rate", value: "43% bypassed landing"  },
    ],
  },

  // ── PORTAL & ECOSYSTEM ────────────────────────────────────────────────────
  {
    id: 18,
    color: "border-l-teal-500",
    dot: "bg-teal-500",
    tag: "External Integration",
    title: "GTEx Portal is HRA's largest external API consumer — 1.73M requests",
    metric: "GTEx 1.73M · HubMAP 1.47M · SenNet 103K · EBI 97K",
    implication:
      "HRA is foundational API infrastructure for at least 4 major genomics platforms. Any breaking API changes need careful deprecation periods and partner notifications.",
    data: [
      { label: "GTEx Portal",    value: "1.73M API requests" },
      { label: "HubMAP",        value: "1.47M API requests" },
      { label: "EBI + SenNet",  value: "200K combined"      },
    ],
  },
  {
    id: 13,
    color: "border-l-sky-500",
    dot: "bg-sky-500",
    tag: "Discovery Path",
    title: "The HRA portal is the primary tool discovery mechanism",
    metric: "6,620 portal navigation interactions in top 20 UI elements",
    implication:
      "The portal's 'Applications' navigation link (1,442 interactions) is a critical funnel point. Ensure the tool listing page loads fast and is updated immediately when new tools launch.",
    data: [
      { label: "Portal nav interactions", value: "6,620"          },
      { label: "Applications link",       value: "1,442 clicks"   },
      { label: "Training link",           value: "882 clicks"     },
    ],
  },
  {
    id: 19,
    color: "border-l-sky-400",
    dot: "bg-sky-400",
    tag: "Discovery Path",
    title: "Users browse 'Data' 1.5× more than 'Apps' — data drives tool discovery",
    metric: "Data: 482 clicks · Apps: 262 · Development: 138",
    implication:
      "Embed tool launch points directly within data browsing pages. 'Explore this dataset in EUI' CTAs placed on data pages capture users already in research mode.",
    data: [
      { label: "'Data' nav clicks",        value: "482 (35%)" },
      { label: "'Apps' nav clicks",        value: "262 (23%)" },
      { label: "'Development' nav clicks", value: "138 (15%)" },
    ],
  },
  {
    id: 14,
    color: "border-l-teal-400",
    dot: "bg-teal-400",
    tag: "Feature Champion",
    title: "FTU Explorer's entire value is in one element",
    metric: "2,387 bar graph interactions from a single UI element",
    implication:
      "FTU Explorer has a very focused use case. Double down on the bar graph: add filtering, export, and comparison features. Consider it as a standalone embeddable widget.",
    data: [
      { label: "Bar graph interactions",       value: "2,387"    },
      { label: "Rank among all elements",      value: "#2 overall" },
      { label: "Other FTU elements in top 20", value: "None"     },
    ],
  },

  // ── TRAFFIC & GEOGRAPHY ───────────────────────────────────────────────────
  {
    id: 20,
    color: "border-l-orange-400",
    dot: "bg-orange-400",
    tag: "Engagement",
    title: "Engagement is bimodal — users either bounce immediately or go very deep",
    metric: "28% single-event bounces · 23% with 11+ events",
    implication:
      "Two distinct user archetypes exist. Design for both: add immediate value indicators on first load to hook bouncers, and invest in advanced features for power users who return.",
    data: [
      { label: "Single-event bounces",      value: "1,776 (28%)" },
      { label: "Sessions with 11+ events",  value: "1,449 (23%)" },
      { label: "Sessions with 20+ events",  value: "741 (12%)"   },
    ],
  },
  {
    id: 15,
    color: "border-l-rose-400",
    dot: "bg-rose-400",
    tag: "Global Reach",
    title: "Asia-Pacific accounts for nearly 1 in 4 visits",
    metric: "10,341 visits (23.8%) from Asia-Pacific",
    implication:
      "Asia-Pacific is the #2 market by region. Ensure HRA tools are geographically distributed to minimize latency for Asian users, and consider outreach to HK, SG, and JP institutions.",
    data: [
      { label: "Asia-Pacific total",  value: "10,341 visits (23.8%)" },
      { label: "Hong Kong rank",      value: "#2 globally"           },
      { label: "Singapore rank",      value: "#3 globally"           },
    ],
  },
  {
    id: 16,
    color: "border-l-yellow-500",
    dot: "bg-yellow-500",
    tag: "Anomaly",
    title: "Ecuador, Bulgaria, and Seychelles show suspicious traffic volume",
    metric: "EC: 769 · BG: 246 · SC: 108",
    implication:
      "Cross-reference CloudFront IP addresses for Ecuador and Seychelles traffic against known CDN ranges. If confirmed as CDN artifacts, exclude from geographic analyses.",
    data: [
      { label: "Ecuador rank",           value: "#9 globally (769)" },
      { label: "Bulgaria",               value: "246 visits"        },
      { label: "Seychelles (pop 100K)",  value: "108 visits"        },
    ],
  },
];

const gridItems = SECTION_GROUPS.flatMap(({ name, ids }, sectionIdx) => [
  { kind: "header" as const, name, sectionIdx },
  ...ids.map((id) => ({ kind: "card" as const, id })),
]);

const byId = Object.fromEntries(insights.map((i) => [i.id, i]));

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
        <StatCard label="Total Insights" value="20" sub="Across 5 categories"           accent="text-blue-400"   />
        <StatCard label="Event Patterns"  value="4"  sub="Systemic academic cycle"       accent="text-amber-400"  />
        <StatCard label="Hidden Features" value="2"  sub="Opacity controls, CDE export" accent="text-violet-400" />
        <StatCard label="Quality Issues"  value="3"  sub="Errors, declining KG, anomalies" accent="text-red-400" />
      </div>

      {/* Bento grid — uniform col-span-1 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {gridItems.map((item) => {
          if (item.kind === "header") {
            return (
              <div
                key={`h-${item.name}`}
                className={`col-span-full flex items-center gap-3 ${item.sectionIdx > 0 ? "mt-4" : ""}`}
              >
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-2">
                  {item.name}
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
            );
          }

          const insight = byId[item.id];
          const chart   = INSIGHT_CHARTS[item.id];

          return (
            <div
              key={item.id}
              className={`bg-zinc-900 border border-zinc-800 border-l-4 ${insight.color} rounded-xl p-4 flex flex-col gap-3`}
            >
              {/* Tag */}
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${insight.dot}`} />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  #{insight.id} · {insight.tag}
                </span>
              </div>

              {/* Title + metric */}
              <div>
                <h2 className="text-sm font-bold text-zinc-100 leading-snug">{insight.title}</h2>
                <p className="text-xs font-medium text-zinc-500 mt-1">{insight.metric}</p>
              </div>

              {/* Chart or data chips */}
              {chart ? (
                <div className="border-t border-zinc-800/50 pt-2">
                  {chart}
                </div>
              ) : (
                <div className="flex flex-col gap-1 border-t border-zinc-800/50 pt-2">
                  {insight.data.map((d) => (
                    <div key={d.label} className="flex justify-between items-baseline gap-2 bg-zinc-800/40 rounded px-2.5 py-1.5">
                      <span className="text-[10px] text-zinc-500 leading-tight">{d.label}</span>
                      <span className="text-xs font-semibold text-zinc-200 tabular-nums shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Implication */}
              <div className="flex items-start gap-1.5 bg-zinc-800/30 rounded-lg p-2.5 mt-auto">
                <span className="text-[10px] text-zinc-600 mt-0.5 shrink-0">→</span>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{insight.implication}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
