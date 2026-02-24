export const TOOL_COLORS: Record<string, string> = {
  "KG Explorer": "#f43f5e",
  "EUI": "#3b82f6",
  "RUI": "#8b5cf6",
  "CDE": "#f59e0b",
  "FTU Explorer": "#10b981",
};

export const TOOLS = ["EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"] as const;
export type Tool = (typeof TOOLS)[number];

export const tooltipStyle = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  borderWidth: 1,
  textStyle: { color: "#fafafa", fontSize: 13 },
  extraCssText: "box-shadow:0 4px 20px rgba(0,0,0,0.5);border-radius:8px;",
};

export const axisStyle = {
  axisLine: { lineStyle: { color: "#3f3f46" } },
  axisLabel: { color: "#71717a", fontSize: 11 },
  splitLine: { lineStyle: { color: "#27272a", type: "dashed" as const } },
  axisTick: { show: false },
};

export function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
}

export function multiTooltip(params: { color: string; seriesName: string; value: number; axisValue?: string }[]) {
  const month = params[0]?.axisValue ?? "";
  const rows = [...params]
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(
      (p) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:3px 0">
          <span style="display:flex;align-items:center;gap:7px;color:#a1a1aa">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-block"></span>
            ${p.seriesName}
          </span>
          <span style="font-weight:600;color:#fafafa">${Number(p.value).toLocaleString()}</span>
        </div>`
    )
    .join("");
  return `<div style="padding:4px 2px"><div style="font-weight:600;color:#fafafa;margin-bottom:8px;font-size:13px">${month}</div>${rows}</div>`;
}
