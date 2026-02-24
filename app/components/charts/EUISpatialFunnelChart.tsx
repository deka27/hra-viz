"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// From spatial_search.json — starting from users who opened the panel
// 13,366 total EUI visits but only 101 opened the spatial search button
const FUNNEL = [
  { name: "Opened Spatial Search",  value: 101, raw: 101,  pct: "100%",    drop: null },
  { name: "Configured Organ + Sex", value: 37,  raw: 37,   pct: "37%",     drop: "−63%" },
  { name: "Explored Results",       value: 68,  raw: 68,   pct: "67%",     drop: null },
  { name: "Applied as Data Filter", value: 5,   raw: 5,    pct: "5%",      drop: "−95%" },
];

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#ef4444"];

export default function EUISpatialFunnelChart() {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 13 },
      extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const d = FUNNEL.find((f) => f.name === p.name)!;
        return `<div>
          <div style="font-weight:700;color:#fafafa;margin-bottom:4px">${d.name}</div>
          <div style="color:#a1a1aa">${d.raw} users · <span style="color:${p.color};font-weight:600">${d.pct} of openers</span></div>
          ${d.drop ? `<div style="color:#ef4444;font-size:11px;margin-top:4px">${d.drop} drop from previous step</div>` : ""}
        </div>`;
      },
    },
    series: [
      {
        type: "funnel",
        left: "8%",
        right: "8%",
        top: 20,
        bottom: 20,
        width: "84%",
        min: 0,
        max: 101,
        minSize: "8%",
        maxSize: "100%",
        sort: "none",
        gap: 6,
        orient: "vertical",
        data: FUNNEL.map((f, i) => ({
          name: f.name,
          value: f.value,
          itemStyle: {
            color: COLORS[i],
            borderWidth: 0,
            opacity: 0.88,
          },
          emphasis: {
            itemStyle: { opacity: 1 },
          },
        })),
        label: {
          show: true,
          position: "inside",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => {
            const d = FUNNEL.find((f) => f.name === p.name)!;
            return `{name|${d.name}}\n{val|${d.raw} users · ${d.pct}}`;
          },
          rich: {
            name: { color: "#fafafa", fontWeight: 700, fontSize: 12, lineHeight: 18 },
            val: { color: "rgba(255,255,255,0.7)", fontSize: 11, lineHeight: 16 },
          },
        },
        labelLine: { show: false },
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
