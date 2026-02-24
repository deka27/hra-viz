"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import * as echarts from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// ISO alpha-2 → exact name used in echarts world GeoJSON (from echarts 4.9 dataset)
const CODE_TO_NAME: Record<string, string> = {
  US: "United States",   SG: "Singapore",       JP: "Japan",
  CN: "China",           IE: "Ireland",         KR: "Korea",
  DE: "Germany",         EC: "Ecuador",         GB: "United Kingdom",
  NL: "Netherlands",     IN: "India",           CA: "Canada",
  IR: "Iran",            FR: "France",          AT: "Austria",
  BR: "Brazil",          BG: "Bulgaria",        FI: "Finland",
  CH: "Switzerland",     AU: "Australia",       HU: "Hungary",
  SE: "Sweden",          ES: "Spain",           RU: "Russia",
  MX: "Mexico",          PL: "Poland",          VN: "Vietnam",
  IT: "Italy",           ID: "Indonesia",       TR: "Turkey",
  AR: "Argentina",       PK: "Pakistan",        RO: "Romania",
  BE: "Belgium",         NO: "Norway",          PT: "Portugal",
  BD: "Bangladesh",      SA: "Saudi Arabia",    CZ: "Czech Rep.",
  DZ: "Algeria",         PH: "Philippines",     IQ: "Iraq",
  EG: "Egypt",           NZ: "New Zealand",     TH: "Thailand",
  HR: "Croatia",         UY: "Uruguay",         MY: "Malaysia",
  UA: "Ukraine",         IL: "Israel",          CO: "Colombia",
  DK: "Denmark",         MA: "Morocco",         ZA: "South Africa",
  GR: "Greece",          CL: "Chile",           RS: "Serbia",
  BO: "Bolivia",         AE: "United Arab Emirates", NG: "Nigeria",
  LT: "Lithuania",       JO: "Jordan",          LV: "Latvia",
  LK: "Sri Lanka",       DO: "Dominican Rep.",  MM: "Myanmar",
  KH: "Cambodia",        MN: "Mongolia",        BY: "Belarus",
  UZ: "Uzbekistan",      AZ: "Azerbaijan",      GE: "Georgia",
  AM: "Armenia",         SD: "Sudan",           UG: "Uganda",
  VE: "Venezuela",       PE: "Peru",            KE: "Kenya",
  LB: "Lebanon",         SN: "Senegal",         NP: "Nepal",
  PS: "Palestine",       KW: "Kuwait",          BH: "Bahrain",
  OM: "Oman",            TN: "Tunisia",         SY: "Syria",
  KZ: "Kazakhstan",      KG: "Kyrgyzstan",      SI: "Slovenia",
  LU: "Luxembourg",      IS: "Iceland",         LY: "Libya",
  KE2: "Kenya",          GT: "Guatemala",       PA: "Panama",
  NI: "Nicaragua",       CR: "Costa Rica",      PY: "Paraguay",
  BS: "Bahamas",         JM: "Jamaica",         EE: "Estonia",
  CD: "Dem. Rep. Congo", CG: "Congo",           GA: "Gabon",
  CM: "Cameroon",        SC: "Seychelles",
};

interface GeoItem {
  c_country: string;
  visits: number;
}

export default function WorldMapChart({ data }: { data: GeoItem[] }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (echarts.getMap("world")) {
      setReady(true);
      return;
    }
    fetch("/world.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((geoJson) => {
        echarts.registerMap("world", geoJson);
        setReady(true);
      })
      .catch(() => setError(true));
  }, []);

  const mapData = data
    .filter((d) => d.c_country !== "-" && CODE_TO_NAME[d.c_country])
    .map((d) => ({ name: CODE_TO_NAME[d.c_country], value: d.visits }));

  const maxValue = Math.max(...mapData.map((d) => d.value));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 13 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      formatter: (p: { name: string; value: number | string }) => {
        if (typeof p.value !== "number")
          return `<div><div style="font-weight:600;color:#fafafa">${p.name}</div><div style="color:#52525b;font-size:12px;margin-top:2px">No data</div></div>`;
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} visits</div>
        </div>`;
      },
    },
    visualMap: {
      type: "continuous",
      min: 1,
      max: maxValue,
      show: false,
      inRange: { color: ["#14291a", "#166534", "#16a34a", "#22c55e", "#86efac"] },
    },
    series: [
      {
        type: "map",
        map: "world",
        roam: true,
        scaleLimit: { min: 0.9, max: 10 },
        itemStyle: {
          areaColor: "#1e293b",
          borderColor: "#2d3f55",
          borderWidth: 0.5,
        },
        emphasis: {
          label: { show: true, color: "#fafafa", fontSize: 11, fontWeight: 600 },
          itemStyle: { areaColor: "#f59e0b", borderColor: "#fbbf24", borderWidth: 1 },
        },
        select: { disabled: true },
        data: mapData,
      },
    ],
  };

  if (error) {
    return (
      <div style={{ height: 460 }} className="flex items-center justify-center flex-col gap-2">
        <p className="text-zinc-500 text-sm">Could not load world map.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ height: 460 }} className="flex items-center justify-center">
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

  return (
    <ReactECharts
      option={option}
      style={{ height: "460px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
