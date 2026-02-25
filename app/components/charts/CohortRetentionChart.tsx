"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface RetentionRow {
  cohort_month: string;
  months_since_first: number;
  retained_sessions: number;
  cohort_size: number;
  retention_pct: number;
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#f43f5e"];

function shortMonth(ym: string): string {
  const [year, m] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[Number(m) - 1]} '${year.slice(2)}`;
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CohortRetentionChart({ data }: { data: RetentionRow[] }) {
  if (!data.length) return <p className="text-sm text-zinc-500">No cohort data available.</p>;

  // Last observed month in the dataset (truncation boundary)
  const lastMonth = data.reduce((max, r) => {
    const active = addMonths(r.cohort_month, r.months_since_first);
    return active > max ? active : max;
  }, "");

  // Only show cohorts with meaningful size and at least one follow-up month
  const cohortSizes = new Map<string, number>();
  data.forEach((r) => cohortSizes.set(r.cohort_month, r.cohort_size));

  const cohorts = Array.from(cohortSizes.entries())
    .filter(([month, size]) => {
      const hasFollowUp = data.some(
        (r) => r.cohort_month === month && r.months_since_first >= 1
      );
      return size >= 10 && hasFollowUp;
    })
    .map(([month]) => month)
    .sort();

  const maxLag = Math.max(
    ...data
      .filter((r) => cohorts.includes(r.cohort_month))
      .map((r) => r.months_since_first)
  );

  const series = cohorts.map((cohort, idx) => {
    const color = COLORS[idx % COLORS.length];
    const rowMap = new Map(
      data
        .filter((r) => r.cohort_month === cohort)
        .map((r) => [r.months_since_first, r])
    );

    const points = Array.from({ length: maxLag + 1 }, (_, xi) => {
      const row = rowMap.get(xi);
      if (!row) return { value: null as number | null };
      const isTruncated = addMonths(cohort, xi) >= lastMonth;
      return {
        value: row.retention_pct,
        symbol: isTruncated ? "emptyCircle" : "circle",
        symbolSize: isTruncated ? 7 : 5,
        itemStyle: isTruncated
          ? { color: "transparent", borderColor: color, borderWidth: 2 }
          : { color },
      };
    });

    return {
      name: shortMonth(cohort),
      type: "line" as const,
      data: points,
      connectNulls: false,
      lineStyle: { color, width: 2.5 },
      itemStyle: { color },
      emphasis: { lineStyle: { width: 3.5 } },
    };
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 12 },
      formatter: (params: Array<{ seriesName: string; data: { value: number | null }; color: string; axisValue: string }>) => {
        const lagStr = params[0]?.axisValue ?? "";
        const lag = parseInt(lagStr.replace("+", "").replace("m", ""), 10);
        const lines = params
          .filter((p) => p.data.value !== null)
          .map((p) => {
            const cohort = cohorts[cohorts.map(shortMonth).indexOf(p.seriesName)];
            const row = cohort
              ? data.find((r) => r.cohort_month === cohort && r.months_since_first === lag)
              : undefined;
            const isTruncated = cohort ? addMonths(cohort, lag) >= lastMonth : false;
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
              <span style="color:#a1a1aa">${p.seriesName}:</span>
              <strong style="color:#fafafa">${(p.data.value as number).toFixed(1)}%</strong>
              ${row ? `<span style="color:#71717a;font-size:10px">&nbsp;(${row.retained_sessions}/${row.cohort_size}${isTruncated ? " · partial month" : ""})</span>` : ""}
            </div>`;
          });
        return `<div style="font-size:12px">
          <div style="color:#71717a;margin-bottom:6px">${lagStr} after first visit</div>
          ${lines.join("")}
        </div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: "#a1a1aa", fontSize: 11 },
      itemWidth: 16,
      itemHeight: 3,
    },
    grid: { top: 36, left: 12, right: 16, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: Array.from({ length: maxLag + 1 }, (_, i) => `+${i}m`),
      axisLine: { lineStyle: { color: "#3f3f46" } },
      axisTick: { show: false },
      axisLabel: { color: "#71717a", fontSize: 11 },
      name: "Months since first visit",
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: "#71717a", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      interval: 25,
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: "#27272a" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series,
  };

  return (
    <>
      <ReactECharts
        option={option}
        style={{ height: "280px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <p className="text-xs text-zinc-600 mt-1">
        Hollow circles = {shortMonth(lastMonth)} data (partial month, undercounts real retention).
      </p>
    </>
  );
}
