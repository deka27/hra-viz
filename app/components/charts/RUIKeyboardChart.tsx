"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// RUI directional keyboard controls from top_ui_paths.json
const KEY_DATA = [
  { key: "A", count: 974, action: "Strafe Left", x: 0,   y: 0 },
  { key: "E", count: 645, action: "Move Up",     x: 2,   y: 1 },
  { key: "Q", count: 631, action: "Move Down",   x: 0,   y: 1 },
  { key: "W", count: 528, action: "Forward",     x: 1,   y: 1 },
  { key: "D", count: 473, action: "Strafe Right",x: 2.3, y: 0 },
];

const TOTAL = KEY_DATA.reduce((s, k) => s + k.count, 0);

// Map count to bubble size
const MAX_COUNT = Math.max(...KEY_DATA.map((k) => k.count));
const scaleSize = (count: number) => 28 + (count / MAX_COUNT) * 52;

export default function RUIKeyboardChart() {
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
        const d = KEY_DATA[p.dataIndex];
        return `<div>
          <div style="font-weight:700;color:#fafafa;font-size:18px;margin-bottom:4px">${d.key}</div>
          <div style="color:#a1a1aa">${d.action}</div>
          <div style="color:#8b5cf6;font-weight:600;margin-top:4px">${d.count.toLocaleString()} interactions</div>
          <div style="color:#71717a;font-size:11px">${((d.count / TOTAL) * 100).toFixed(1)}% of keyboard usage</div>
        </div>`;
      },
    },
    xAxis: {
      type: "value",
      min: -0.6,
      max: 3.2,
      show: false,
    },
    yAxis: {
      type: "value",
      min: -0.7,
      max: 1.8,
      show: false,
    },
    series: [
      {
        type: "scatter",
        data: KEY_DATA.map((k) => [k.x, k.y]),
        symbolSize: (val: number[], params: { dataIndex: number }) =>
          scaleSize(KEY_DATA[params.dataIndex].count),
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const count = KEY_DATA[params.dataIndex].count;
            const intensity = count / MAX_COUNT;
            // violet scale: low → high
            const r = Math.round(80 + intensity * 59);
            const g = Math.round(40 + intensity * 51);
            const b = Math.round(160 + intensity * 86);
            return `rgb(${r},${g},${b})`;
          },
          shadowBlur: 20,
          shadowColor: "rgba(139,92,246,0.4)",
        },
        emphasis: {
          itemStyle: { shadowBlur: 30, shadowColor: "rgba(139,92,246,0.6)" },
          scale: 1.1,
        },
        label: {
          show: true,
          formatter: (params: { dataIndex: number }) => {
            const d = KEY_DATA[params.dataIndex];
            return `{key|${d.key}}\n{count|${d.count}}`;
          },
          rich: {
            key: { color: "#fafafa", fontWeight: 700, fontSize: 15, lineHeight: 20 },
            count: { color: "#c4b5fd", fontSize: 10, lineHeight: 14 },
          },
        },
      },
      // Invisible "S" key to show the gap
      {
        type: "scatter",
        data: [[1.3, 0]],
        symbolSize: 52,
        itemStyle: { color: "#27272a", borderColor: "#3f3f46", borderWidth: 1.5 },
        label: {
          show: true,
          formatter: "{key|S}\n{count|—}",
          rich: {
            key: { color: "#52525b", fontWeight: 700, fontSize: 15, lineHeight: 20 },
            count: { color: "#3f3f46", fontSize: 10, lineHeight: 14 },
          },
        },
        tooltip: { show: false },
        emphasis: { disabled: true },
      },
    ],
    graphic: [
      // Row labels
      {
        type: "text",
        left: 22,
        bottom: "35%",
        style: { text: "Middle row", fill: "#52525b", fontSize: 10 },
      },
      {
        type: "text",
        left: 22,
        bottom: "18%",
        style: { text: "Home row", fill: "#52525b", fontSize: 10 },
      },
    ],
  };

  return (
    <div>
      <ReactECharts
        option={option}
        style={{ height: "240px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      {/* Legend bar */}
      <div className="flex items-center justify-between mt-2 px-4">
        {KEY_DATA.sort((a, b) => b.count - a.count).map((k) => (
          <div key={k.key} className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-violet-300">{k.key}</span>
            <span className="text-xs text-zinc-500">{k.count.toLocaleString()}</span>
            <div
              className="h-1 rounded-full bg-violet-500"
              style={{ width: `${(k.count / MAX_COUNT) * 48 + 8}px`, opacity: 0.6 + (k.count / MAX_COUNT) * 0.4 }}
            />
            <span className="text-xs text-zinc-600">{((k.count / TOTAL) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
