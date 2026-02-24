"use client";

import dynamic from "next/dynamic";
import { tooltipStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface GeoItem {
  c_country: string;
  visits: number;
}

const REGION: Record<string, string> = {
  US: "Americas", CA: "Americas", MX: "Americas", BR: "Americas", EC: "Americas",
  AR: "Americas", CO: "Americas", CL: "Americas", VE: "Americas", PE: "Americas",
  UY: "Americas", BO: "Americas", PY: "Americas", CR: "Americas", GT: "Americas",
  PA: "Americas", DO: "Americas", NI: "Americas", JM: "Americas", BS: "Americas",
  BZ: "Americas", GD: "Americas", VG: "Americas",
  GB: "Europe", DE: "Europe", FR: "Europe", NL: "Europe", IE: "Europe",
  AT: "Europe", CH: "Europe", SE: "Europe", FI: "Europe", BG: "Europe",
  HU: "Europe", ES: "Europe", PL: "Europe", IT: "Europe", SC: "Europe",
  RO: "Europe", BE: "Europe", NO: "Europe", PT: "Europe", HR: "Europe",
  CZ: "Europe", RS: "Europe", GR: "Europe", LT: "Europe", EE: "Europe",
  LV: "Europe", LU: "Europe", IS: "Europe", BY: "Europe", UA: "Europe",
  AL: "Europe", BA: "Europe", SI: "Europe", XK: "Europe",
  JP: "Asia-Pacific", KR: "Asia-Pacific", CN: "Asia-Pacific", HK: "Asia-Pacific",
  SG: "Asia-Pacific", AU: "Asia-Pacific", IN: "Asia-Pacific", VN: "Asia-Pacific",
  TW: "Asia-Pacific", PH: "Asia-Pacific", ID: "Asia-Pacific", MY: "Asia-Pacific",
  TH: "Asia-Pacific", BD: "Asia-Pacific", NP: "Asia-Pacific", NZ: "Asia-Pacific",
  PK: "Asia-Pacific", LK: "Asia-Pacific", KH: "Asia-Pacific", MM: "Asia-Pacific",
  MN: "Asia-Pacific", KI: "Asia-Pacific",
  IR: "Middle East & Africa", TR: "Middle East & Africa", SA: "Middle East & Africa",
  AE: "Middle East & Africa", IQ: "Middle East & Africa", IL: "Middle East & Africa",
  JO: "Middle East & Africa", OM: "Middle East & Africa", KW: "Middle East & Africa",
  BH: "Middle East & Africa", PS: "Middle East & Africa", AM: "Middle East & Africa",
  AZ: "Middle East & Africa", GE: "Middle East & Africa", UZ: "Middle East & Africa",
  KZ: "Middle East & Africa", KG: "Middle East & Africa", SY: "Middle East & Africa",
  LB: "Middle East & Africa", LY: "Middle East & Africa", DZ: "Middle East & Africa",
  MA: "Middle East & Africa", TN: "Middle East & Africa", EG: "Middle East & Africa",
  KE: "Middle East & Africa", ZA: "Middle East & Africa", NG: "Middle East & Africa",
  SN: "Middle East & Africa", UG: "Middle East & Africa", SD: "Middle East & Africa",
  GA: "Middle East & Africa", CD: "Middle East & Africa", CG: "Middle East & Africa",
  CI: "Middle East & Africa", CM: "Middle East & Africa",
  RU: "Other",
};

const REGION_COLORS: Record<string, string> = {
  "Americas": "#3b82f6",
  "Europe": "#8b5cf6",
  "Asia-Pacific": "#f43f5e",
  "Middle East & Africa": "#f59e0b",
  "Other": "#52525b",
};

export default function GeoRegionDonut({ data }: { data: GeoItem[] }) {
  const regionTotals: Record<string, number> = {};
  data.filter((d) => d.c_country !== "-").forEach((d) => {
    const region = REGION[d.c_country] ?? "Other";
    regionTotals[region] = (regionTotals[region] ?? 0) + d.visits;
  });

  const total = Object.values(regionTotals).reduce((s, v) => s + v, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      ...tooltipStyle,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name}</div>
          <div style="color:#a1a1aa">${p.value.toLocaleString()} visits</div>
          <div style="color:#71717a">${p.percent.toFixed(1)}% of total</div>
        </div>`,
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "middle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      formatter: (name: string) => {
        const count = regionTotals[name] ?? 0;
        const pct = ((count / total) * 100).toFixed(1);
        return `${name}  ${pct}%`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["48%", "70%"],
        center: ["38%", "50%"],
        label: { show: false },
        emphasis: { scaleSize: 5, label: { show: false } },
        data: Object.entries(regionTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({
            name,
            value,
            itemStyle: { color: REGION_COLORS[name] ?? "#52525b", borderWidth: 0 },
          })),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
