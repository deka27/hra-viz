import StatCard from "../components/StatCard";
import SessionDepthChart from "../components/charts/SessionDepthChart";

import totalToolVisits from "../../public/data/total_tool_visits.json";
import opacityData from "../../public/data/opacity_interactions.json";
import cdeWorkflowData from "../../public/data/cde_workflow.json";
import spatialSearch from "../../public/data/spatial_search.json";
import geoData from "../../public/data/geo_distribution.json";
import sessionDepth from "../../public/data/session_depth.json";
import navClicks from "../../public/data/nav_clicks.json";
import monthlyData from "../../public/data/tool_visits_by_month.json";
import errorBreakdown from "../../public/data/error_breakdown.json";

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

// ── Derived values (re-computed at build from JSON, safe to add new parquet runs) ──────────────
type MonthRow = { month_year: string; EUI: number; RUI: number; CDE: number; "FTU Explorer": number; "KG Explorer": number };
const monthly = monthlyData as MonthRow[];
const monthCount = monthly.length;
function fmtMY(ym: string) {
  const [y, m] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m) - 1]} '${y.slice(2)}`;
}
const dataRange = monthCount > 0 ? `${fmtMY(monthly[0].month_year)} – ${fmtMY(monthly[monthly.length - 1].month_year)}` : "";

// ID 4: October seasonal pattern
const monthTot = (r: MonthRow) => r.EUI + r.RUI + r.CDE + r["FTU Explorer"] + r["KG Explorer"];
const octMonths = monthly.filter(d => d.month_year.endsWith("-10"));
const octAvg = octMonths.length ? Math.round(octMonths.reduce((s, d) => s + monthTot(d), 0) / octMonths.length) : 0;
const peakOctRow = octMonths.reduce((mx, d) => monthTot(d) > monthTot(mx) ? d : mx, octMonths[0]);
const peakOctTotal = peakOctRow ? monthTot(peakOctRow) : 0;
const peakOctYear = peakOctRow?.month_year?.slice(0, 4) ?? "";
const mayMonths = monthly.filter(d => d.month_year.endsWith("-05"));
const mayAvg = mayMonths.length ? Math.round(mayMonths.reduce((s, d) => s + monthTot(d), 0) / mayMonths.length) : 0;

// ID 8: Opacity usage
const opacityTotal = opacityData.reduce((s, d) => s + d.count, 0);
const ruiVisitsN = (totalToolVisits as { tool: string; visits: number }[]).find(d => d.tool === "RUI")?.visits ?? 1;
const opacityRate = ((opacityTotal / ruiVisitsN) * 100).toFixed(1);
const topOpacity = [...opacityData].sort((a, b) => b.count - a.count)[0];

// IDs 9 & 12: CDE workflow
const cdeUploadsN = cdeWorkflowData.find(d => d.path.includes("file-upload.upload"))?.count ?? 0;
const cdeVizN = cdeWorkflowData.find(d => d.path.includes("visualize-data.submit"))?.count ?? 0;
const cdeLandingN = cdeWorkflowData.find(d => d.path.includes("landing-page") && d.path.includes("create-a-visualization"))?.count ?? 0;
const cdeCompPct = cdeUploadsN > 0 ? Math.round((cdeVizN / cdeUploadsN) * 100) : 0;
const cdeBypassPct = cdeUploadsN > 0 ? Math.round(((cdeUploadsN - cdeLandingN) / cdeUploadsN) * 100) : 0;

// ID 11: Spatial search
const spatialBtnN = (spatialSearch as { path: string; count: number }[]).find(d => d.path === "eui.body-ui.spatial-search-button")?.count ?? 0;
const spatialSceneN = (spatialSearch as { path: string; count: number }[]).find(d => d.path === "eui.body-ui.spatial-search.scene")?.count ?? 0;
const spatialContN = (spatialSearch as { path: string; count: number }[]).find(d => d.path.includes("continue"))?.count ?? 0;
const spatialRatioN = spatialBtnN > 0 ? (spatialSceneN / spatialBtnN).toFixed(1) : "?";
const spatialContRate = spatialBtnN > 0 ? Math.round((spatialContN / spatialBtnN) * 100) : 0;

// IDs 15 & 16: Geography
const APAC = new Set(["CN","HK","SG","JP","KR","TW","AU","IN","NZ","TH","MY","PH","ID","VN","MM","KH","MN","LK","NP","BD","PK"]);
const geoArr = geoData as { c_country: string; visits: number }[];
const geoTotVisits = geoArr.reduce((s, d) => s + d.visits, 0);
const apacVisits = geoArr.filter(d => APAC.has(d.c_country)).reduce((s, d) => s + d.visits, 0);
const apacPct = ((apacVisits / geoTotVisits) * 100).toFixed(1);
const geoSorted = [...geoArr].sort((a, b) => b.visits - a.visits);
const hkRank = geoSorted.findIndex(d => d.c_country === "HK") + 1;
const sgRank = geoSorted.findIndex(d => d.c_country === "SG") + 1;
const ecVisits = geoArr.find(d => d.c_country === "EC")?.visits ?? 0;
const bgVisits = geoArr.find(d => d.c_country === "BG")?.visits ?? 0;
const scVisits = geoArr.find(d => d.c_country === "SC")?.visits ?? 0;
const ecRank = geoSorted.findIndex(d => d.c_country === "EC") + 1;

// ID 17: Errors by source
const errSrc = (errorBreakdown as { by_source: { tool: string; errors: number }[] }).by_source;
const totalSrcErrors = errSrc.reduce((s, d) => s + d.errors, 0);
const kgErrors = errSrc.find(d => d.tool === "KG Explorer")?.errors ?? 0;
const euiErrors = errSrc.find(d => d.tool === "EUI")?.errors ?? 0;
const ruiErrors = errSrc.find(d => d.tool === "RUI")?.errors ?? 0;
const kgErrPct = Math.round((kgErrors / totalSrcErrors) * 100);
const euiErrPct = Math.round((euiErrors / totalSrcErrors) * 100);

// ID 19: Nav clicks
const navArr = navClicks as { label: string; count: number }[];
const dataClicks = navArr.find(d => d.label === "Data")?.count ?? 0;
const appsClicks = navArr.find(d => d.label === "Apps")?.count ?? 0;
const devClicks = navArr.find(d => d.label === "Development")?.count ?? 0;
const totalNavClicks = navArr.reduce((s, d) => s + d.count, 0);
const dataPct = Math.round((dataClicks / totalNavClicks) * 100);
const appsPct = Math.round((appsClicks / totalNavClicks) * 100);
const devPct = Math.round((devClicks / totalNavClicks) * 100);
const dataToAppsRatio = appsClicks > 0 ? (dataClicks / appsClicks).toFixed(1) : "?";

// ID 20: Session depth
const sesArr = sessionDepth as { depth: string; sessions: number }[];
const totalSessions = sesArr.reduce((s, d) => s + d.sessions, 0);
const singleBounce = sesArr.find(d => d.depth === "1")?.sessions ?? 0;
const deep11 = sesArr.filter(d => d.depth === "11–20" || d.depth === "20+").reduce((s, d) => s + d.sessions, 0);
const deep20 = sesArr.find(d => d.depth === "20+")?.sessions ?? 0;
const bouncePct = Math.round((singleBounce / totalSessions) * 100);
const deep11Pct = Math.round((deep11 / totalSessions) * 100);
const deep20Pct = Math.round((deep20 / totalSessions) * 100);

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
    metric: `Oct avg: ${octAvg.toLocaleString()} visits · Oct ${peakOctYear}: ${peakOctTotal.toLocaleString()} (all-time peak)`,
    implication:
      "Plan major feature releases and outreach campaigns for September so they're polished before the October peak. Ensure server infrastructure can handle 4–5× normal traffic.",
    data: [
      { label: "Oct avg (all years)",              value: `${octAvg.toLocaleString()} visits`         },
      { label: `Oct ${peakOctYear} (all-time peak)`, value: `${peakOctTotal.toLocaleString()} visits` },
      { label: "May avg (summer lull)",            value: `${mayAvg.toLocaleString()} visits`         },
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
    metric: `${opacityTotal} total opacity toggles across ${ruiVisitsN.toLocaleString()} RUI visits (${opacityRate}%)`,
    implication:
      "Surface opacity controls with an onboarding tooltip on first RUI load. A simple 'Tip: You can toggle organ visibility' prompt could dramatically increase this metric.",
    data: [
      { label: "Total opacity toggles", value: opacityTotal.toString()                    },
      { label: "Usage rate",           value: `${opacityRate}% of RUI visits`            },
      { label: "Most-used toggle",     value: `All Structures (${topOpacity?.count ?? 0}×)` },
    ],
  },
  {
    id: 9,
    color: "border-l-amber-400",
    dot: "bg-amber-400",
    tag: "Instrumentation Gap",
    title: "CDE export/download usage cannot be measured yet",
    metric: `${cdeVizN} visualizations created · download events not yet tracked in app`,
    implication:
      "Add an explicit CDE download/export analytics event first. After instrumentation is in place, audit the post-visualization screen and add a more prominent CTA if measured usage remains low.",
    data: [
      { label: "Visualizations submitted", value: cdeVizN.toString()                         },
      { label: "Download tracking",        value: "Not yet tracked in app"                  },
      { label: "Completion rate",          value: `${cdeCompPct}% of uploads`               },
    ],
  },
  {
    id: 11,
    color: "border-l-emerald-400",
    dot: "bg-emerald-400",
    tag: "High Engagement",
    title: "EUI spatial search users are deeply engaged once inside",
    metric: `${spatialSceneN} scene navigation events vs ${spatialBtnN} button clicks (${spatialRatioN}×)`,
    implication:
      "The spatial search onboarding has a 37% continuation rate. Simplifying organ selection or adding 'Quick Search' presets for common organs (kidney, heart) could significantly increase completion.",
    data: [
      { label: "Button clicks",           value: spatialBtnN.toString()                            },
      { label: "Scene navigation events", value: `${spatialSceneN} (${spatialRatioN}×)`           },
      { label: "Continue to search",      value: `${spatialContN} (${spatialContRate}% of clicks)` },
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
    metric: `${kgErrors.toLocaleString()} KG + ${euiErrors.toLocaleString()} EUI errors traceable to specific root causes`,
    implication:
      "Fix in priority order: (1) Patch API CORS on technology-names endpoint. (2) Audit KG Explorer CDN paths for icon assets. (3) Add null guard in EUI's getLastPickedObject before index [0].",
    data: [
      { label: "KG Explorer errors", value: `${kgErrPct}% (${kgErrors.toLocaleString()} errors)` },
      { label: "EUI errors",         value: `${euiErrPct}% (${euiErrors.toLocaleString()} errors)` },
      { label: "RUI errors",         value: `${ruiErrors} errors ✓`                               },
    ],
  },
  {
    id: 12,
    color: "border-l-fuchsia-500",
    dot: "bg-fuchsia-500",
    tag: "UX Insight",
    title: "43% of CDE users skip the landing page entirely",
    metric: `${cdeUploadsN - cdeLandingN} of ${cdeUploadsN} uploads bypassed the landing CTA`,
    implication:
      "The upload page itself needs to be fully self-explanatory. Add in-page guidance, accepted file format info, and a quick-start template directly on the upload screen.",
    data: [
      { label: "Landing CTA clicks",    value: cdeLandingN.toString()              },
      { label: "Total uploads",         value: cdeUploadsN.toString()              },
      { label: "Direct-to-upload rate", value: `${cdeBypassPct}% bypassed landing` },
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
    title: `Users browse 'Data' ${dataToAppsRatio}× more than 'Apps' — data drives tool discovery`,
    metric: `Data: ${dataClicks} clicks · Apps: ${appsClicks} · Development: ${devClicks}`,
    implication:
      "Embed tool launch points directly within data browsing pages. 'Explore this dataset in EUI' CTAs placed on data pages capture users already in research mode.",
    data: [
      { label: "'Data' nav clicks",        value: `${dataClicks} (${dataPct}%)` },
      { label: "'Apps' nav clicks",        value: `${appsClicks} (${appsPct}%)` },
      { label: "'Development' nav clicks", value: `${devClicks} (${devPct}%)`   },
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
    metric: `${bouncePct}% single-event bounces · ${deep11Pct}% with 11+ events`,
    implication:
      "Two distinct user archetypes exist. Design for both: add immediate value indicators on first load to hook bouncers, and invest in advanced features for power users who return.",
    data: [
      { label: "Single-event bounces",     value: `${singleBounce.toLocaleString()} (${bouncePct}%)` },
      { label: "Sessions with 11+ events", value: `${deep11.toLocaleString()} (${deep11Pct}%)`        },
      { label: "Sessions with 20+ events", value: `${deep20.toLocaleString()} (${deep20Pct}%)`        },
    ],
  },
  {
    id: 15,
    color: "border-l-rose-400",
    dot: "bg-rose-400",
    tag: "Global Reach",
    title: "Asia-Pacific accounts for nearly 1 in 4 visits",
    metric: `${apacVisits.toLocaleString()} visits (${apacPct}%) from Asia-Pacific`,
    implication:
      "Asia-Pacific is the #2 market by region. Ensure HRA tools are geographically distributed to minimize latency for Asian users, and consider outreach to HK, SG, and JP institutions.",
    data: [
      { label: "Asia-Pacific total", value: `${apacVisits.toLocaleString()} visits (${apacPct}%)` },
      { label: "Hong Kong rank",     value: `#${hkRank} globally`                                },
      { label: "Singapore rank",     value: `#${sgRank} globally`                                },
    ],
  },
  {
    id: 16,
    color: "border-l-yellow-500",
    dot: "bg-yellow-500",
    tag: "Anomaly",
    title: "Ecuador, Bulgaria, and Seychelles show suspicious traffic volume",
    metric: `EC: ${ecVisits} · BG: ${bgVisits} · SC: ${scVisits}`,
    implication:
      "Cross-reference CloudFront IP addresses for Ecuador and Seychelles traffic against known CDN ranges. If confirmed as CDN artifacts, exclude from geographic analyses.",
    data: [
      { label: "Ecuador rank",          value: `#${ecRank} globally (${ecVisits.toLocaleString()})` },
      { label: "Bulgaria",              value: `${bgVisits.toLocaleString()} visits`               },
      { label: "Seychelles (pop 100K)", value: `${scVisits.toLocaleString()} visits`              },
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
          <span className="text-zinc-300 font-medium">{monthCount} months</span> ({dataRange}) of HRA tool usage data, covering
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
