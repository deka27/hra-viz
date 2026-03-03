"use client";

import ThemedEChart from "../ThemedEChart";
import { TOOLS, TOOL_COLORS, axisStyle, tooltipStyle } from "../../lib/chartTheme";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", HK: "Hong Kong", SG: "Singapore", JP: "Japan", CN: "China",
  IE: "Ireland", KR: "South Korea", DE: "Germany", EC: "Ecuador", GB: "United Kingdom",
  NL: "Netherlands", IN: "India", CA: "Canada", IR: "Iran", FR: "France",
  AT: "Austria", BR: "Brazil", BG: "Bulgaria", FI: "Finland", CH: "Switzerland",
  AU: "Australia", HU: "Hungary", SE: "Sweden", ES: "Spain", RU: "Russia",
  SC: "Seychelles", MX: "Mexico", PL: "Poland", VN: "Vietnam", IT: "Italy",
};

type ToolKey = (typeof TOOLS)[number];
type ToolBreakdownRow = { c_country: string; total: number } & Record<ToolKey, number>;

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

function topCountriesForTool(data: ToolBreakdownRow[], tool: ToolKey): Array<{ code: string; visits: number }> {
  return [...data]
    .filter((row) => row.c_country !== "-" && row[tool] > 0)
    .sort((a, b) => b[tool] - a[tool])
    .slice(0, 10)
    .map((row) => ({ code: row.c_country, visits: row[tool] }));
}

export default function GeoTopCountryByToolChart({ data }: { data: ToolBreakdownRow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {TOOLS.map((tool) => {
        const top = topCountriesForTool(data, tool);
        const total = data.reduce((sum, row) => sum + row[tool], 0);
        const color = TOOL_COLORS[tool] ?? "#52525b";

        const option = {
          backgroundColor: "transparent",
          tooltip: {
            trigger: "item",
            ...tooltipStyle,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
              const idx = params?.dataIndex ?? 0;
              const row = top[idx];
              if (!row) return "";
              const share = total > 0 ? ((row.visits / total) * 100).toFixed(1) : "0.0";
              return `<div>
                <div style="font-weight:600;color:#fafafa;margin-bottom:4px">${tool}</div>
                <div style="color:#a1a1aa">${countryName(row.code)} (${row.code})</div>
                <div style="color:#a1a1aa">Visits: ${row.visits.toLocaleString()}</div>
                <div style="color:#71717a;font-size:11px">${share}% of ${tool} visits</div>
              </div>`;
            },
          },
          grid: { top: 10, left: 8, right: 8, bottom: 40, containLabel: true },
          xAxis: {
            type: "category",
            data: top.map((row) => row.code),
            ...axisStyle,
            axisLabel: {
              color: "#a1a1aa",
              fontSize: 10,
              interval: 0,
            },
          },
          yAxis: {
            type: "value",
            ...axisStyle,
            axisLabel: {
              color: "#71717a",
              fontSize: 10,
              formatter: (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`),
            },
          },
          series: [
            {
              type: "bar",
              data: top.map((row) => ({
                value: row.visits,
                itemStyle: {
                  color,
                  opacity: row.code === "US" ? 0.95 : 0.82,
                  borderRadius: [4, 4, 0, 0],
                },
              })),
              barMaxWidth: 24,
              label: {
                show: true,
                position: "top",
                color: "#71717a",
                fontSize: 9.5,
                formatter: ({ value }: { value: number }) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`,
              },
            },
          ],
        };

        return (
          <div
            key={tool}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-100/70 dark:bg-zinc-900/40"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {tool}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                Top 10 countries
              </span>
            </div>

            <ThemedEChart option={option} style={{ height: "280px", width: "100%" }} opts={{ renderer: "canvas" }} />
          </div>
        );
      })}
    </div>
  );
}
