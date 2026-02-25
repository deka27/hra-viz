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

function toEasternHour(utcHour: number, utcOffset: number): string {
  const h = (utcHour + utcOffset + 24) % 24;
  const period = h >= 12 ? "pm" : "am";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
}

export default function HourlyTrafficChart() {
  const hours   = hourlyData.map((d) => `${String(d.hour).padStart(2, "0")}:00`);
  const estLabels = hourlyData.map((d) => toEasternHour(d.hour, -5));
  const edtLabels = hourlyData.map((d) => toEasternHour(d.hour, -4));
  const pcts    = hourlyData.map((d) => +((d.count / total) * 100).toFixed(2));

  // Peak zone in UTC; Eastern local-time equivalent shifts by DST.
  const isPeak = (h: number) => h >= 13 && h <= 21;

  const option = {
    backgroundColor: "transparent",
    grid: { top: 32, left: 8, right: 16, bottom: 56, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: "#3f3f46" } },
      ...TOOLTIP,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any) => {
        const i = p[0].dataIndex;
        const d = hourlyData[i];
        const pct = pcts[i];
        return `<span style="color:#a1a1aa">${p[0].name} UTC</span>
          <span style="color:#52525b"> · ${estLabels[i]} EST / ${edtLabels[i]} EDT</span><br/>
          <strong>${d.count.toLocaleString()} requests</strong>
          <span style="color:#71717a"> (${pct}% of daily)</span>`;
      },
    },
    xAxis: [
      {
        // Primary: UTC hours
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
      {
        // Secondary: ET hours below
        type: "category",
        data: estLabels,
        position: "bottom",
        offset: 18,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#52525b",
          fontSize: 9,
          interval: 2,
        },
      },
    ],
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "bar",
        xAxisIndex: 0,
        barWidth: "70%",
        data: pcts.map((v, i) => ({
          value: v,
          itemStyle: {
            color: isPeak(hourlyData[i].hour) ? "#3b82f6" : "#27272a",
            opacity: isPeak(hourlyData[i].hour) ? 0.85 : 0.6,
            borderRadius: [2, 2, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          fontSize: 9,
          color: "#e4e4e7",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => p.value >= 3.5 ? `${p.value}%` : "",
        },
      },
      {
        type: "line",
        xAxisIndex: 0,
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
      <ReactECharts option={option} style={{ height: "200px", width: "100%" }} opts={{ renderer: "canvas" }} />
      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-xs text-zinc-600">
          <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1.5 align-middle" />
          Peak 13–21 UTC · <span className="text-zinc-500">8 AM–4 PM EST (9 AM–5 PM EDT)</span>
          <span className="text-zinc-700 ml-2">(top row UTC · bottom row EST)</span>
        </p>
        <p className="text-xs text-zinc-600">
          14:00 UTC · <span className="text-zinc-500">9 AM EST (10 AM EDT)</span> = <span className="text-zinc-400 font-medium">single-hour peak</span>
        </p>
      </div>
    </div>
  );
}
