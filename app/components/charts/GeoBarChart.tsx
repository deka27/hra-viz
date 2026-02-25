"use client";

import dynamic from "next/dynamic";
import { tooltipStyle, axisStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface GeoItem {
  c_country: string;
  visits: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", HK: "Hong Kong", SG: "Singapore", JP: "Japan", CN: "China",
  IE: "Ireland", KR: "South Korea", DE: "Germany", EC: "Ecuador", GB: "United Kingdom",
  NL: "Netherlands", IN: "India", CA: "Canada", IR: "Iran", FR: "France",
  AT: "Austria", BR: "Brazil", BG: "Bulgaria", FI: "Finland", CH: "Switzerland",
  AU: "Australia", HU: "Hungary", SE: "Sweden", ES: "Spain", RU: "Russia",
  SC: "Seychelles", MX: "Mexico", PL: "Poland", VN: "Vietnam", IT: "Italy",
};

const REGION: Record<string, string> = {
  US: "Americas", CA: "Americas", MX: "Americas", BR: "Americas", EC: "Americas",
  GB: "Europe", DE: "Europe", FR: "Europe", NL: "Europe", IE: "Europe",
  AT: "Europe", CH: "Europe", SE: "Europe", FI: "Europe", BG: "Europe",
  HU: "Europe", ES: "Europe", PL: "Europe", IT: "Europe",
  JP: "Asia-Pacific", KR: "Asia-Pacific", CN: "Asia-Pacific", HK: "Asia-Pacific",
  SG: "Asia-Pacific", AU: "Asia-Pacific", IN: "Asia-Pacific", VN: "Asia-Pacific",
  IR: "Middle East & Africa", SC: "Middle East & Africa", RU: "Other",
};

const REGION_COLORS: Record<string, string> = {
  Americas: "#3b82f6",
  Europe: "#8b5cf6",
  "Asia-Pacific": "#f43f5e",
  "Middle East & Africa": "#f59e0b",
  Other: "#71717a",
};

export default function GeoBarChart({ data }: { data: GeoItem[] }) {
  const top20 = data
    .filter((d) => d.c_country !== "-")
    .slice(0, 20)
    .sort((a, b) => a.visits - b.visits);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        const code = top20.find((d) => (COUNTRY_NAMES[d.c_country] ?? d.c_country) === p.name)?.c_country ?? "";
        const region = REGION[code] ?? "Other";
        return `<div style="padding:2px 0">
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${p.name} (${code})</div>
          <div style="color:#a1a1aa">${Number(p.value).toLocaleString()} visits</div>
          <div style="color:#71717a;font-size:12px">Region: ${region}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
    },
    yAxis: {
      type: "category",
      data: top20.map((d) => COUNTRY_NAMES[d.c_country] ?? d.c_country),
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 12 },
    },
    series: [
      {
        type: "bar",
        data: top20.map((d) => {
          const region = REGION[d.c_country] ?? "Other";
          return {
            value: d.visits,
            itemStyle: {
              color: REGION_COLORS[region] ?? "#52525b",
              borderRadius: [0, 5, 5, 0],
              opacity: d.c_country === "US" ? 1 : 0.8,
            },
          };
        }),
        barMaxWidth: 24,
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 11,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "520px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
