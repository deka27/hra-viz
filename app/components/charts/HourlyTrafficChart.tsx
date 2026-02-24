"use client";

import dynamic from "next/dynamic";
import hourlyData from "../../../public/data/hourly_traffic.json";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 12 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;padding:8px 12px;",
};

const total = hourlyData.reduce((s, d) => s + d.count, 0);

export default function HourlyTrafficChart() {
  const hours = hourlyData.map((d) => `${String(d.hour).padStart(2, "0")}:00`);
  const pcts  = hourlyData.map((d) => +((d.count / total) * 100).toFixed(2));

  // Peak zone: 13–21 UTC (9 AM–5 PM US Eastern)
  const isPeak = (h: number) => h >= 13 && h <= 21;

  const option = {
    backgroundColor: "transparent",
    grid: { top: 24, left: 8, right: 16, bottom: 48, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: "#3f3f46" } },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const d = hourlyData[p[0].dataIndex];
        const pct = pcts[p[0].dataIndex];
        return `<span style="color:#a1a1aa">${p[0].name} UTC</span><br/>
          <strong>${d.count.toLocaleString()} requests</strong>
          <span style="color:#71717a"> (${pct}% of daily)</span>`;
      },
    },
    xAxis: {
      type: "category",
      data: hours,
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        interval: 2,
        formatter: (v: string) => v.replace(":00", "h"),
      },
    },
    yAxis: {
      type: "value",
      show: false,
    },
    visualMap: {
      show: false,
      dimension: 0,
      pieces: [
        { min: 13, max: 21, color: "#3b82f6" },
        { min: 0, max: 12, color: "#27272a" },
        { min: 22, max: 23, color: "#27272a" },
      ],
    },
    series: [
      {
        type: "bar",
        barWidth: "70%",
        data: pcts.map((v, i) => ({
          value: v,
          itemStyle: {
            color: isPeak(hourlyData[i].hour) ? "#3b82f6" : "#27272a",
            opacity: isPeak(hourlyData[i].hour) ? 0.85 : 0.6,
            borderRadius: [2, 2, 0, 0],
          },
        })),
      },
      // Invisible line for smooth tooltip
      {
        type: "line",
        data: pcts,
        lineStyle: { opacity: 0 },
        itemStyle: { opacity: 0 },
        smooth: true,
        symbol: "none",
      },
    ],
  };

  return (
    <div>
      <ReactECharts option={option} style={{ height: "160px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-xs text-zinc-600">
          <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1.5 align-middle" />
          Peak 13–21 UTC &nbsp;(US Eastern 9 AM–5 PM)
        </p>
        <p className="text-xs text-zinc-600">
          14:00 UTC = <span className="text-zinc-400 font-medium">single-hour peak</span>
        </p>
      </div>
    </div>
  );
}
