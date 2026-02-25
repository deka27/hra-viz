"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const COUNTRY_NAMES: Record<string, string> = {
  US: "US", SG: "SG", FR: "FR", DE: "DE", RU: "RU",
  GB: "GB", CN: "CN", FI: "FI", HK: "HK", CA: "CA",
  VN: "VN", IE: "IE", JP: "JP", KR: "KR", NL: "NL",
  IN: "IN", AU: "AU", BR: "BR", AT: "AT", EC: "EC",
  IR: "IR", BG: "BG",
};

const REGION_COLORS: Record<string, string> = {
  US: "#3b82f6", CA: "#3b82f6", BR: "#3b82f6", EC: "#3b82f6",
  GB: "#8b5cf6", DE: "#8b5cf6", FR: "#8b5cf6", NL: "#8b5cf6",
  FI: "#8b5cf6", IE: "#8b5cf6", AT: "#8b5cf6", BG: "#8b5cf6", RU: "#8b5cf6",
  SG: "#f43f5e", HK: "#f43f5e", JP: "#f43f5e", CN: "#f43f5e",
  KR: "#f43f5e", VN: "#f43f5e", IN: "#f43f5e", AU: "#f43f5e",
  IR: "#f59e0b",
};

interface Row {
  c_country: string;
  bot_visits: number;
  total_requests: number;
  bot_pct: number;
}

export default function GeoBotChart({ data }: { data: Row[] }) {
  // Sort by bot_visits desc for vertical bar chart
  const sorted = [...data].sort((a, b) => b.bot_visits - a.bot_visits);
  const labels = sorted.map((d) => COUNTRY_NAMES[d.c_country] ?? d.c_country);

  const fmtVol = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M`
    : v >= 1000 ? `${(v / 1000).toFixed(0)}K`
    : `${v}`;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      formatter: (params: Array<{ dataIndex: number }>) => {
        const d = sorted[params[0].dataIndex];
        return `<div style="font-weight:700;margin-bottom:4px">${d.c_country}</div>
          <div style="color:#a1a1aa">Bot requests: <strong style="color:#ef4444">${fmtVol(d.bot_visits)}</strong></div>
          <div style="color:#a1a1aa">Bot rate: <strong style="color:#f87171">${d.bot_pct}%</strong> of all traffic</div>
          <div style="color:#a1a1aa">Total requests: ${d.total_requests.toLocaleString()}</div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      data: ["Bot volume", "Bot rate %"],
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { top: 28, left: 8, right: 56, bottom: 48, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, interval: 0 },
    },
    yAxis: [
      {
        type: "value",
        name: "Bot requests",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        axisLabel: {
          color: "#71717a",
          fontSize: 10,
          formatter: (v: number) => fmtVol(v),
        },
        splitLine: { lineStyle: { color: "#27272a" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: "value",
        name: "Bot %",
        nameTextStyle: { color: "#71717a", fontSize: 10 },
        min: 0,
        max: 40,
        axisLabel: {
          color: "#71717a",
          fontSize: 10,
          formatter: (v: number) => `${v}%`,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Bot volume",
        type: "bar",
        yAxisIndex: 0,
        barMaxWidth: 32,
        data: sorted.map((d) => ({
          value: d.bot_visits,
          itemStyle: {
            color: REGION_COLORS[d.c_country] ?? "#52525b",
            opacity: 0.78,
            borderRadius: [3, 3, 0, 0],
          },
        })),
        emphasis: { itemStyle: { opacity: 1 } },
      },
      {
        name: "Bot rate %",
        type: "line",
        yAxisIndex: 1,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#f87171", width: 2 },
        itemStyle: { color: "#f87171" },
        label: {
          show: true,
          position: "top",
          color: "#f87171",
          fontSize: 9,
          fontWeight: "bold" as const,
          formatter: (p: { value: number }) => `${p.value}%`,
        },
        data: sorted.map((d) => d.bot_pct),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "340px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
