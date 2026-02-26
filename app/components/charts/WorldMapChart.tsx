"use client";

import ThemedEChart from "../ThemedEChart";
import { useEffect, useState } from "react";
import * as echarts from "echarts";


// ISO alpha-2 → echarts world GeoJSON name
const CODE_TO_NAME: Record<string, string> = {
  US: "United States",   HK: "Hong Kong",        SG: "Singapore",
  JP: "Japan",           CN: "China",             IE: "Ireland",
  KR: "Korea",           DE: "Germany",           EC: "Ecuador",
  GB: "United Kingdom",  NL: "Netherlands",       IN: "India",
  CA: "Canada",          IR: "Iran",              FR: "France",
  AT: "Austria",         BR: "Brazil",            BG: "Bulgaria",
  FI: "Finland",         CH: "Switzerland",       AU: "Australia",
  HU: "Hungary",         SE: "Sweden",            ES: "Spain",
  RU: "Russia",          SC: "Seychelles",        MX: "Mexico",
  PL: "Poland",          VN: "Vietnam",           IT: "Italy",
  ID: "Indonesia",       TR: "Turkey",            AR: "Argentina",
  PK: "Pakistan",        TW: "Taiwan",            BE: "Belgium",
  RO: "Romania",         NO: "Norway",            PT: "Portugal",
  BD: "Bangladesh",      SA: "Saudi Arabia",      CZ: "Czech Rep.",
  DZ: "Algeria",         PH: "Philippines",       IQ: "Iraq",
  EG: "Egypt",           NZ: "New Zealand",       TH: "Thailand",
  HR: "Croatia",         UY: "Uruguay",           MY: "Malaysia",
  UA: "Ukraine",         IL: "Israel",            CO: "Colombia",
  DK: "Denmark",         MA: "Morocco",           ZA: "South Africa",
  GR: "Greece",          CL: "Chile",             RS: "Serbia",
  BO: "Bolivia",         AE: "United Arab Emirates", NG: "Nigeria",
  LT: "Lithuania",       JO: "Jordan",            LV: "Latvia",
  LK: "Sri Lanka",       DO: "Dominican Rep.",    MM: "Myanmar",
  KH: "Cambodia",        MN: "Mongolia",          BY: "Belarus",
  UZ: "Uzbekistan",      AZ: "Azerbaijan",        GE: "Georgia",
  AM: "Armenia",         SD: "Sudan",             UG: "Uganda",
  VE: "Venezuela",       PE: "Peru",              KE: "Kenya",
  LB: "Lebanon",         SN: "Senegal",           NP: "Nepal",
  PS: "Palestine",       KW: "Kuwait",            BH: "Bahrain",
  OM: "Oman",            TN: "Tunisia",           SY: "Syria",
  KZ: "Kazakhstan",      KG: "Kyrgyzstan",        SI: "Slovenia",
  LU: "Luxembourg",      IS: "Iceland",           LY: "Libya",
  GT: "Guatemala",       PA: "Panama",            NI: "Nicaragua",
  CR: "Costa Rica",      PY: "Paraguay",          BS: "Bahamas",
  JM: "Jamaica",         EE: "Estonia",           CD: "Dem. Rep. Congo",
  CG: "Congo",           GA: "Gabon",             CM: "Cameroon",
};


const TOOL_COLORS: Record<string, string> = {
  "KG Explorer":  "#f43f5e",
  "EUI":          "#3b82f6",
  "RUI":          "#8b5cf6",
  "CDE":          "#f59e0b",
  "FTU Explorer": "#10b981",
};

interface GeoItem     { c_country: string; visits: number; }
interface ToolPrefItem { c_country: string; top_tool: string; top_tool_visits: number; total_visits: number; }
interface BotItem     { c_country: string; bot_pct: number; }

interface Props {
  data:     GeoItem[];
  toolPref: ToolPrefItem[];
  botData:  BotItem[];
}

export default function WorldMapChart({ data, toolPref, botData }: Props) {
  const [ready, setReady] = useState(() => !!echarts.getMap("world"));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (ready) return;
    fetch("/world.json")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((geoJson) => { echarts.registerMap("world", geoJson); setReady(true); })
      .catch(() => setError(true));
  }, [ready]);

  const filtered = data.filter((d) => d.c_country !== "-");
  const total    = filtered.reduce((s, d) => s + d.visits, 0);

  const prefMap = Object.fromEntries(toolPref.map((d) => [d.c_country, d]));
  const botMap  = Object.fromEntries(botData.map((d)  => [d.c_country, d]));

  // Choropleth data — country shapes coloured by visit count
  const choroData = filtered
    .filter((d) => CODE_TO_NAME[d.c_country])
    .map((d, i) => ({
      name:  CODE_TO_NAME[d.c_country],
      value: d.visits,
      code:  d.c_country,
      rank:  i + 1,
    }));

  const tooltipFormatter = (p: {
    name?: string;
    value?: number | [number, number, number];
    data?: { code?: string; rank?: number; name?: string };
  }) => {
    const code   = p.data?.code;
    const name   = p.name || p.data?.name;
    const visits = Array.isArray(p.value) ? p.value[2] : (typeof p.value === "number" ? p.value : null);

    if (!visits || !name)
      return `<div style="color:#52525b;font-size:12px">${name ?? "No data"}</div>`;

    const pref    = code ? prefMap[code] : null;
    const bot     = code ? botMap[code]  : null;
    const rank    = p.data?.rank;
    const pct     = ((visits / total) * 100).toFixed(1);
    const tColor  = pref ? (TOOL_COLORS[pref.top_tool] ?? "#71717a") : "#71717a";
    const toolPct = pref ? ((pref.top_tool_visits / pref.total_visits) * 100).toFixed(0) : null;

    const row = (label: string, val: string, color = "#d4d4d8") =>
      `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:3px">
         <span style="color:#71717a;font-size:11px">${label}</span>
         <span style="color:${color};font-weight:600;font-size:11px">${val}</span>
       </div>`;

    return `<div style="min-width:170px;font-family:inherit">
      <div style="font-weight:700;color:#fafafa;font-size:13px;margin-bottom:7px;border-bottom:1px solid #3f3f46;padding-bottom:6px">
        ${rank ? `<span style="color:#52525b;font-weight:400;font-size:10px;margin-right:5px">#${rank}</span>` : ""}${name}
      </div>
      ${row("Visits", visits.toLocaleString(), "#fafafa")}
      ${row("Share of total", pct + "%")}
      ${pref ? row("Top tool", `${pref.top_tool} · ${toolPct}%`, tColor) : ""}
      ${bot  ? row("Bot rate", `${bot.bot_pct}%`, bot.bot_pct > 20 ? "#ef4444" : "#71717a") : ""}
    </div>`;
  };

  const option = {
    backgroundColor: "transparent",
    geo: {
      map: "world",
      roam: true,
      scaleLimit: { min: 0.8, max: 14 },
      layoutCenter: ["50%", "54%"],
      layoutSize:   "100%",
      itemStyle: {
        areaColor:   "#111215",
        borderColor: "#2f2f36",
        borderWidth:  0.4,
      },
      emphasis: {
        itemStyle: { areaColor: "#3f3f46" },
        label:     { show: false },
      },
    },
    visualMap: {
      type:       "continuous",
      min:        0,
      max:        2500,          // cap so mid-tier countries get visible colour
      show:       false,
      seriesIndex: 0,
      inRange:    { color: ["#1f1f23", "#3f3f46", "#71717a", "#a1a1aa", "#e4e4e7"] },
    },
    tooltip: {
      trigger:        "item",
      backgroundColor: "#18181b",
      borderColor:     "#3f3f46",
      borderWidth:      1,
      textStyle:       { color: "#fafafa", fontSize: 12 },
      extraCssText:    "box-shadow:0 8px 32px rgba(0,0,0,0.7);border-radius:10px;padding:12px 16px;",
      formatter:       tooltipFormatter,
    },
    series: [
      {
        type:     "map",
        map:      "world",
        geoIndex:  0,
        data:      choroData,
        itemStyle: {
          areaColor:   "#111215",
          borderColor: "#2f2f36",
          borderWidth:  0.4,
        },
        emphasis: {
          label:     { show: true, color: "#fafafa", fontSize: 11, fontWeight: 600 },
          itemStyle: { areaColor: "#52525b", borderColor: "#d4d4d8", borderWidth: 1 },
        },
        select: { disabled: true },
      },
    ],
  };

  if (error) {
    return (
      <div style={{ height: 500 }} className="flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Could not load world map.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ height: 500 }} className="flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading map…
        </div>
      </div>
    );
  }

  // Tool legend entries (only tools present in this dataset)
  const toolsPresent = [...new Set(toolPref.map((d) => d.top_tool))];

  return (
    <div className="flex flex-col gap-3">
      <ThemedEChart
        option={option}
        style={{ height: "500px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />

      {/* Tool colour legend + hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {toolsPresent.map((tool) => (
            <div key={tool} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: TOOL_COLORS[tool] ?? "#71717a" }}
              />
              <span className="text-xs text-zinc-400">{tool}</span>
            </div>
          ))}
        </div>
        <span className="text-xs text-zinc-600">
          Country fill intensity = visits · Dot color = dominant tool · Hover for details
        </span>
      </div>
    </div>
  );
}
