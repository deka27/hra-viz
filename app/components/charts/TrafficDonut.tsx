"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface TrafficType {
  type: string;
  count: number;
}

const TYPE_COLORS: Record<string, string> = {
  "Likely Human": "#3b82f6",
  "Bot": "#f59e0b",
  "AI-Assistant / Bot": "#8b5cf6",
};

export default function TrafficDonut({ data }: { data: TrafficType[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      textStyle: { color: "#fafafa", fontSize: 13 },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<div style="font-weight:500">${p.name}</div><div style="color:#a1a1aa">${p.value.toLocaleString()} requests</div><div style="color:#71717a">${p.percent.toFixed(1)}%</div>`,
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "middle",
      itemWidth: 10,
      itemHeight: 10,
      borderRadius: 3,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
      formatter: (name: string) => {
        const item = data.find((d) => d.type === name);
        const pct = item ? ((item.count / total) * 100).toFixed(1) : "0";
        return `${name}  ${pct}%`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "75%"],
        center: ["38%", "50%"],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: false },
          scaleSize: 4,
        },
        data: data.map((d) => ({
          value: d.count,
          name: d.type,
          itemStyle: { color: TYPE_COLORS[d.type] ?? "#3b82f6", borderWidth: 0 },
        })),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "280px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
