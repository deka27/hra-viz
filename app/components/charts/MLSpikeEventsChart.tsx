"use client";

import ThemedEChart from "../ThemedEChart";
import { axisStyle, tooltipStyle } from "../../lib/chartTheme";


export interface SpikeRow {
  tool: string;
  month: string;
  event_type: "mom_spike" | "new_baseline_jump" | "level_shift";
  magnitude_pct?: number;
  absolute_jump?: number;
  from_value?: number;
  to_value?: number;
}

const TOOL_COLORS: Record<string, string> = {
  "KG Explorer": "#f43f5e",
  EUI: "#3b82f6",
  RUI: "#8b5cf6",
  CDE: "#f59e0b",
  "FTU Explorer": "#10b981",
};

function visitJump(event: SpikeRow): number {
  if (typeof event.to_value === "number" && typeof event.from_value === "number") {
    return Math.max(0, event.to_value - event.from_value);
  }
  return Math.max(0, event.absolute_jump ?? 0);
}

function eventLabel(event: SpikeRow): string {
  if (event.event_type === "new_baseline_jump") return "New baseline";
  if (event.event_type === "level_shift") return "Level shift";
  return "Spike";
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number.parseInt(m, 10) - 1]} '${year.slice(2)}`;
}

export default function MLSpikeEventsChart({ data }: { data: SpikeRow[] }) {
  const top = [...data].sort((a, b) => visitJump(b) - visitJump(a)).slice(0, 10).reverse();

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const idx = params[0]?.dataIndex ?? 0;
        const event = top[idx];
        if (!event) return "";
        const jump = visitJump(event);
        const pctGrow = typeof event.magnitude_pct === "number" ? `${event.magnitude_pct.toFixed(1)}%` : "n/a";
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${event.tool} · ${monthLabel(event.month)}</div>
          <div style="color:#a1a1aa">Extra visits in that month: <strong>${jump.toLocaleString()}</strong></div>
          <div style="color:#71717a;font-size:11px">From ${(event.from_value ?? 0).toLocaleString()} to ${(event.to_value ?? 0).toLocaleString()}</div>
          <div style="color:#71717a;font-size:11px">Pattern: ${eventLabel(event)} · Growth: ${pctGrow}</div>
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
        formatter: (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${Math.round(v)}`),
      },
    },
    yAxis: {
      type: "category",
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 11 },
      data: top.map((d) => `${monthLabel(d.month)} · ${d.tool}`),
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: top.map((d) => ({
          value: visitJump(d),
          itemStyle: {
            color: TOOL_COLORS[d.tool] ?? "#52525b",
            borderRadius: [0, 4, 4, 0],
            opacity: d.event_type === "new_baseline_jump" ? 0.65 : 0.9,
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#71717a",
          fontSize: 10,
          formatter: ({ value }: { value: number }) => `+${Math.round(value).toLocaleString()}`,
        },
      },
    ],
  };

  return <ThemedEChart option={option} style={{ height: "360px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}
