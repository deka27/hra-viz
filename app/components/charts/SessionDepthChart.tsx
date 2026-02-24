"use client";

import dynamic from "next/dynamic";
import sessionData from "../../../public/data/session_depth.json";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

const total = sessionData.reduce((s, d) => s + d.sessions, 0);

export default function SessionDepthChart() {
  const option = {
    backgroundColor: "transparent",
    grid: { top: 8, left: 4, right: 72, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const pct = ((p[0].value / total) * 100).toFixed(1);
        return `<span style="color:#a1a1aa">${p[0].name} events/session</span><br/>
          <strong>${p[0].value.toLocaleString()} sessions (${pct}%)</strong>`;
      },
    },
    xAxis: { type: "value", show: false, max: Math.max(...sessionData.map(d => d.sessions)) * 1.15 },
    yAxis: {
      type: "category",
      data: sessionData.map((d) => d.depth),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 20,
        data: sessionData.map((d) => ({
          value: d.sessions,
          itemStyle: {
            // Bounce = red, power users (20+) = emerald, middle = blue
            color: d.depth === "1" ? "#ef4444"
                 : d.depth === "20+" ? "#10b981"
                 : "#3b82f6",
            opacity: d.depth === "1" ? 0.8
                   : d.depth === "20+" ? 0.85
                   : 0.5 + sessionData.indexOf(d) * 0.06,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => `${((p.value / total) * 100).toFixed(0)}%`,
          color: "#71717a",
          fontSize: 10,
        },
      },
    ],
  };

  return (
    <div>
      <ReactECharts option={option} style={{ height: "160px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <div className="flex gap-4 mt-2 px-1 text-xs text-zinc-600">
        <span><span className="text-red-400 font-semibold">Red</span> = single-event bounces</span>
        <span><span className="text-emerald-400 font-semibold">Green</span> = power users (20+ events)</span>
      </div>
    </div>
  );
}
