"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOL_COLORS } from "../../lib/chartTheme";


interface HeatmapRow {
  tool: string;
  hour_utc: number;
  events: number;
}

function toEasternHourInt(utcHour: number, utcOffset: number): number {
  return (utcHour + utcOffset + 24) % 24;
}

function toEasternHourFromLocal(localHour: number): string {
  const period = localHour >= 12 ? "pm" : "am";
  const display = localHour === 0 ? 12 : localHour > 12 ? localHour - 12 : localHour;
  return `${display}${period}`;
}

const TOOL_ORDER = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"];

export default function ToolHourlyHeatmap({ data }: { data: HeatmapRow[] }) {
  const tools = TOOL_ORDER.filter((t) => data.some((d) => d.tool === t));
  const estHours = Array.from({ length: 24 }, (_, i) => i);

  // Build matrix in EST hour space: [x=hour_est, y=tool_idx, value=events]
  const map = new Map(
    data.map((d) => [`${d.tool}|${toEasternHourInt(d.hour_utc, -5)}`, d.events]),
  );
  const matrixData: [number, number, number][] = [];
  for (let yi = 0; yi < tools.length; yi++) {
    for (const h of estHours) {
      matrixData.push([h, yi, map.get(`${tools[yi]}|${h}`) ?? 0]);
    }
  }

  const globalMax = Math.max(...matrixData.map((d) => d[2]), 1);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      formatter: (p: { data: [number, number, number] }) => {
        const [h, yi, v] = p.data;
        const tool = tools[yi];
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${tool}</div>
          <div style="color:#a1a1aa">${toEasternHourFromLocal(h)} EST · ${toEasternHourFromLocal((h + 1) % 24)} EDT</div>
          <div style="color:#fafafa;font-weight:600">${v.toLocaleString()} events</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 48, containLabel: true },
    xAxis: {
      type: "category",
      data: estHours.map((h) => toEasternHourFromLocal(h)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#71717a", fontSize: 9, interval: 1 },
      splitArea: { show: true, areaStyle: { color: ["#18181b", "#1c1c1f"] } },
    },
    yAxis: {
      type: "category",
      data: tools,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: "bold" as const },
      splitArea: { show: true, areaStyle: { color: ["#18181b", "#1c1c1f"] } },
    },
    visualMap: {
      min: 0,
      max: globalMax,
      show: true,
      right: 0,
      top: "center",
      orient: "vertical",
      itemWidth: 12,
      itemHeight: 100,
      text: ["High", "Low"],
      textStyle: { color: "#71717a", fontSize: 10 },
      inRange: { color: ["#18181b", "#1e3a5f", "#1d4ed8", "#60a5fa"] },
    },
    series: [
      {
        type: "heatmap",
        data: matrixData,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: "rgba(96,165,250,0.4)" } },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <ThemedEChart
        option={option}
        style={{ height: `${tools.length * 44 + 80}px`, width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <div className="flex flex-wrap gap-3 justify-center">
        {tools.map((tool) => {
          const peak = matrixData
            .filter(([, yi]) => tools[yi] === tool)
            .reduce((best, cur) => (cur[2] > best[2] ? cur : best), [0, 0, 0]);
          const color = TOOL_COLORS[tool] ?? "#a1a1aa";
          return (
            <div key={tool} className="flex items-center gap-2 text-xs">
              <span className="font-semibold" style={{ color }}>{tool}</span>
              <span className="text-zinc-500">
                peaks at {toEasternHourFromLocal(peak[0])} EST ({toEasternHourFromLocal((peak[0] + 1) % 24)} EDT)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
