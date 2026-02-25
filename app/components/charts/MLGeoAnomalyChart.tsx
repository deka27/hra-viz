"use client";

import dynamic from "next/dynamic";
import { axisStyle, tooltipStyle } from "../../lib/chartTheme";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export interface GeoAnomalyRow {
  c_country: string;
  anomaly_score: number;
  total_requests: number;
  human_requests: number;
  bot_requests: number;
  ai_bot_requests: number;
  bot_ratio: number;
  session_count: number;
  avg_session_depth: number;
  likely_artifact: boolean;
}

const COUNTRY_NAMES: Record<string, string> = {
  AF:"Afghanistan",AL:"Albania",DZ:"Algeria",AR:"Argentina",AU:"Australia",AT:"Austria",
  BE:"Belgium",BR:"Brazil",CA:"Canada",CL:"Chile",CN:"China",CO:"Colombia",HR:"Croatia",
  CZ:"Czech Republic",DK:"Denmark",EG:"Egypt",FI:"Finland",FR:"France",DE:"Germany",
  GH:"Ghana",GR:"Greece",HK:"Hong Kong",HU:"Hungary",IN:"India",ID:"Indonesia",
  IE:"Ireland",IL:"Israel",IT:"Italy",JP:"Japan",JM:"Jamaica",KE:"Kenya",KR:"South Korea",
  MX:"Mexico",NL:"Netherlands",NZ:"New Zealand",NG:"Nigeria",NO:"Norway",PK:"Pakistan",
  PE:"Peru",PH:"Philippines",PL:"Poland",PT:"Portugal",RO:"Romania",RU:"Russia",
  SA:"Saudi Arabia",ZA:"South Africa",ES:"Spain",SD:"Sudan",SE:"Sweden",CH:"Switzerland",
  TW:"Taiwan",TH:"Thailand",TR:"Turkey",UA:"Ukraine",GB:"United Kingdom",US:"United States",
  VN:"Vietnam",
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

export default function MLGeoAnomalyChart({ data }: { data: GeoAnomalyRow[] }) {
  const top = [...data].sort((a, b) => b.anomaly_score - a.anomaly_score).slice(0, 12).reverse();

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const idx = params[0]?.dataIndex ?? 0;
        const row = top[idx];
        if (!row) return "";
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${countryName(row.c_country)}</div>
          <div style="color:#a1a1aa">Bot-like traffic share: ${(row.bot_ratio * 100).toFixed(1)}%</div>
          <div style="color:#a1a1aa">Oddness score: ${row.anomaly_score.toFixed(3)}</div>
          <div style="color:#a1a1aa">Requests: ${row.total_requests.toLocaleString()} · Sessions: ${Math.round(row.session_count).toLocaleString()}</div>
          <div style="color:#71717a;font-size:11px">Likely artifact: ${row.likely_artifact ? "yes" : "no"}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { color: "#71717a", fontSize: 11, formatter: (v: number) => `${v.toFixed(0)}%` },
    },
    yAxis: {
      type: "category",
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
      data: top.map((d) => countryName(d.c_country)),
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: top.map((d) => ({
          value: +(d.bot_ratio * 100).toFixed(2),
          itemStyle: {
            color: d.likely_artifact ? "#f59e0b" : "#3b82f6",
            borderRadius: [0, 4, 4, 0],
            opacity: d.likely_artifact ? 0.95 : 0.75,
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 10,
          formatter: ({ value }: { value: number }) => `${value.toFixed(1)}%`,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "360px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}
