"use client";

import ThemedEChart from "../ThemedEChart";
import { axisStyle, tooltipStyle } from "../../lib/chartTheme";


export interface RuleRow {
  antecedents: string[];
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
  leverage?: number;
}

function shortToken(token: string): string {
  return token
    .replace("feature:", "")
    .replace("event:", "")
    .replace("tool:", "")
    .replaceAll("_", " ");
}

function labelForRule(rule: RuleRow): string {
  const lhs = rule.antecedents.map(shortToken).join(" + ");
  return `${lhs} -> ${shortToken(rule.consequent)}`;
}

export default function MLRuleLiftChart({ data }: { data: RuleRow[] }) {
  const top = [...data]
    .filter((r) => r.support >= 0.005)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 12)
    .reverse();

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const idx = params[0]?.dataIndex ?? 0;
        const rule = top[idx];
        if (!rule) return "";
        return `<div>
          <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${labelForRule(rule)}</div>
          <div style="color:#a1a1aa">If the left-side behavior happens, the right-side behavior appears ${(rule.confidence * 100).toFixed(1)}% of the time.</div>
          <div style="color:#71717a;font-size:11px">Support: ${(rule.support * 100).toFixed(2)}% of all sessions · Lift: ${rule.lift.toFixed(2)}</div>
        </div>`;
      },
    },
    grid: { top: 8, left: 8, right: 72, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      ...axisStyle,
      max: 100,
      axisLabel: { color: "#71717a", fontSize: 11, formatter: (v: number) => `${v}%` },
    },
    yAxis: {
      type: "category",
      ...axisStyle,
      axisLabel: { color: "#a1a1aa", fontSize: 10.5 },
      data: top.map(labelForRule),
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: top.map((rule) => ({
          value: +(rule.confidence * 100).toFixed(2),
          itemStyle: {
            color: "#14b8a6",
            borderRadius: [0, 4, 4, 0],
            opacity: 0.55 + Math.min(0.4, rule.confidence),
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

  return <ThemedEChart option={option} style={{ height: "420px", width: "100%" }} opts={{ renderer: "canvas" }} />;
}
