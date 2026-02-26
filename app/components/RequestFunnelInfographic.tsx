"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface TrafficType  { type: string; count: number; }
interface ToolVisit    { tool: string; visits: number; }
interface RequestType  { request_type: string; count: number; }

interface Props {
  trafficTypes: TrafficType[];
  totalVisits:  number;
  toolVisits:   ToolVisit[];
  requestTypes: RequestType[];
}

const INFRA_COLORS: Record<string, string> = {
  "Images":      "#6366f1",
  "Stylesheets": "#0ea5e9",
  "API Calls":   "#a855f7",
  "HTML Pages":  "#64748b",
  "JS Bundles":  "#eab308",
  "Fonts":       "#ec4899",
  "Data Files":  "#14b8a6",
  "Other":       "#52525b",
};

const TOOL_COLORS: Record<string, string> = {
  "KG Explorer":  "#f43f5e",
  "EUI":          "#3b82f6",
  "RUI":          "#8b5cf6",
  "CDE":          "#f59e0b",
  "FTU Explorer": "#10b981",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function splitScaled(parentScaled: number, childrenActual: number[]): number[] {
  const weights = childrenActual.map((v) => Math.sqrt(Math.max(v, 0)));
  const weightTotal = weights.reduce((s, w) => s + w, 0);
  if (weightTotal <= 0) return childrenActual.map(() => 0);
  return weights.map((w) => (parentScaled * w) / weightTotal);
}

export default function RequestFunnelInfographic({ trafficTypes, totalVisits, toolVisits, requestTypes }: Props) {
  const total  = trafficTypes.reduce((s, d) => s + d.count, 0);
  const human  = trafficTypes.find((d) => d.type === "Likely Human")!;
  const bot    = trafficTypes.find((d) => d.type === "Bot")!;
  const ai     = trafficTypes.find((d) => d.type === "AI-Assistant / Bot")!;
  const nonHumanTotal = bot.count + ai.count;
  const infraActual = Math.max(human.count - totalVisits, 0);

  // ── branch-consistent sqrt-normalized values ───────────────────────────
  const allScaled = Math.sqrt(Math.max(total, 0));
  const humanScaled = total > 0 ? (allScaled * human.count) / total : 0;
  const nonHumanScaled = Math.max(allScaled - humanScaled, 0);
  const [infraScaled, visitsScaled] = splitScaled(humanScaled, [infraActual, totalVisits]);
  const [botScaled, aiScaled] = splitScaled(nonHumanScaled, [bot.count, ai.count]);

  // Infra sub-links (depth 2 → depth 3)
  const infraTotal = requestTypes.reduce((s, r) => s + r.count, 0);
  const infraLinks = requestTypes.map((r) => ({
    source:  "Infra Requests",
    target:  r.request_type,
    value:   infraTotal > 0 ? infraScaled * (r.count / infraTotal) : 0,
    _actual: r.count,
  }));

  // Tool sub-links (depth 2 → depth 3)
  const toolLinks = toolVisits.map((t) => ({
    source:  "Tool Visits",
    target:  t.tool,
    value:   totalVisits > 0 ? visitsScaled * (t.visits / totalVisits) : 0,
    _actual: t.visits,
  }));

  const ACTUALS: Record<string, number> = {
    "All Requests":     total,
    "Likely Human":     human.count,
    "Non-Human":        bot.count + ai.count,
    "Bot Crawlers":     bot.count,
    "AI-Assistant Bot": ai.count,
    "Tool Visits":      totalVisits,
    "Infra Requests":   human.count - totalVisits,
    ...Object.fromEntries(toolVisits.map((t) => [t.tool, t.visits])),
    ...Object.fromEntries(requestTypes.map((r) => [r.request_type, r.count])),
  };

  // ── layout:"none" with explicit depth gives full control ───────────────
  //
  //  depth 0 │ depth 1      │ depth 2              │ depth 3
  //  ────────┼──────────────┼──────────────────────┼──────────────────────────
  //  All Req │ Likely Human │ Tool Visits          │ KG Explorer · EUI · RUI
  //          │ Non-Human    │ Infra Requests       │ CDE · FTU Explorer
  //          │              │ Bot Crawlers         │ Images · Stylesheets
  //          │              │ AI-Assistant Bot     │ API Calls · HTML Pages
  //          │              │                      │ JS Bundles · Fonts
  //          │              │                      │ Data Files · Other
  //
  //  Cols 0–2 each sum to the same total → no wasted space.
  //  Col 3 covers infra types (large) + tool nodes (small but visible).
  const TOOL_LEAF_GROUP_TOP = 0.84;
  const TOOL_LEAF_GROUP_SPAN = 0.11;
  const TOOL_LEAF_GAP = 0.004;

  const nodes = [
    { name: "All Requests",      depth: 0, itemStyle: { color: "#52525b" } },
    { name: "Likely Human",      depth: 1, itemStyle: { color: "#10b981" } },
    { name: "Non-Human",         depth: 1, itemStyle: { color: "#78716c" } },
    { name: "Infra Requests",    depth: 2, itemStyle: { color: "#27272a" } },
    { name: "Tool Visits",       depth: 2, itemStyle: { color: "#3b82f6" } },
    { name: "Bot Crawlers",      depth: 2, itemStyle: { color: "#f59e0b" } },
    { name: "AI-Assistant Bot",  depth: 2, itemStyle: { color: "#f43f5e" } },
    ...requestTypes.map((r) => ({
      name:      r.request_type,
      depth:     3,
      itemStyle: { color: INFRA_COLORS[r.request_type] ?? "#52525b" },
    })),
    ...toolVisits.map((t, i) => {
      const priorVisits = toolVisits.slice(0, i).reduce((s, d) => s + d.visits, 0);
      const priorShare = totalVisits > 0 ? priorVisits / totalVisits : 0;
      const localY = TOOL_LEAF_GROUP_TOP + priorShare * TOOL_LEAF_GROUP_SPAN + i * TOOL_LEAF_GAP;
      return {
      name:      t.tool,
      depth:     3,
      localY,
      itemStyle: { color: TOOL_COLORS[t.tool] ?? "#52525b" },
      };
    }),
  ];

  const links = [
    { source: "All Requests", target: "Likely Human",     value: humanScaled,         _actual: human.count          },
    { source: "All Requests", target: "Non-Human",        value: nonHumanScaled,      _actual: nonHumanTotal       },
    { source: "Non-Human",    target: "Bot Crawlers",     value: botScaled,           _actual: bot.count            },
    { source: "Non-Human",    target: "AI-Assistant Bot", value: aiScaled,            _actual: ai.count             },
    { source: "Likely Human", target: "Tool Visits",      value: visitsScaled,        _actual: totalVisits          },
    { source: "Likely Human", target: "Infra Requests",   value: infraScaled,         _actual: infraActual          },
    ...infraLinks,
    ...toolLinks,
  ];

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor:     "#3f3f46",
      borderWidth:      1,
      textStyle:       { color: "#fafafa", fontSize: 12 },
      extraCssText:    "box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;padding:12px 16px;",
      formatter: (p: { dataType: string; name?: string; data?: { _actual?: number; source?: string; target?: string } }) => {
        if (p.dataType === "node") {
          const actual = ACTUALS[p.name!];
          if (!actual) return p.name!;
          const pct = ((actual / total) * 100).toFixed(1);
          const row = (label: string, val: string, color = "#d4d4d8") =>
            `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:3px">
               <span style="color:#71717a;font-size:11px">${label}</span>
               <span style="color:${color};font-weight:600;font-size:11px">${val}</span>
             </div>`;
          const extra = "";
          return `<div style="min-width:190px">
            <div style="font-weight:700;color:#fafafa;margin-bottom:6px;font-size:13px">${p.name}</div>
            ${row("Count", actual.toLocaleString(), "#fafafa")}
            ${row("% of all requests", pct + "%")}
            ${extra}
          </div>`;
        }
        const actual = p.data?._actual;
        const src = p.data?.source ?? "";
        const tgt = p.data?.target ?? "";
        if (!actual) return `${src} → ${tgt}`;
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:5px">${src} → ${tgt}</div>
          <div style="color:#a1a1aa;font-size:11px">${actual.toLocaleString()} (${((actual / total) * 100).toFixed(2)}% of all requests)</div>
        </div>`;
      },
    },
    series: [
      {
        type:      "sankey",
        layout:    "none",
        orient:    "horizontal",
        layoutIterations: 0,
        nodeAlign: "left",
        emphasis:  { focus: "adjacency" },
        nodeWidth: 14,
        nodeGap:   10,
        left:      "1%",
        right:     "10%",
        top:       "3%",
        bottom:    "3%",
        data:      nodes,
        links:     links,
        lineStyle: {
          color:     "gradient",
          opacity:   0.24,
          curveness: 0.4,
        },
        label: {
          color:      "#d4d4d8",
          fontSize:   10,
          lineHeight: 12,
          fontWeight: 600,
          formatter: (p: { name: string }) => {
            const actual = ACTUALS[p.name];
            if (!actual) return p.name;
            if (INFRA_COLORS[p.name] || TOOL_COLORS[p.name]) return `${p.name}  ${fmt(actual)}`;
            if (p.name === "Tool Visits") return `${p.name}\n${fmt(actual)}`;
            if (actual < 100_000) return p.name;
            return `${p.name}\n${fmt(actual)}`;
          },
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <ReactECharts
        option={option}
        style={{ height: "720px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <p className="text-xs text-zinc-600 border-t border-zinc-800 pt-3 leading-relaxed">
        Flow widths use sqrt-normalized scaling so thin links remain visible.
        Hover any node or link for exact counts.
        Tool Visits tooltip shows per-tool breakdown.
        &ldquo;Infra Requests&rdquo; = images, JS, CSS, fonts &amp; API calls —
        the {Math.round(human.count / totalVisits)}× overhead behind every tracked visit.
      </p>
    </div>
  );
}
