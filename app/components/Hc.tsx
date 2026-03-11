"use client";

const TOOLTIP = "Hardcoded value — update manually when new data is ingested";

/**
 * <Hc> — Hardcoded value marker.
 * Highlights the value with an amber background + dashed underline + [HC] badge.
 * Very visible. Find all in code: grep -r "<Hc>\|hc: true" app/
 *
 * Usage: <Hc>171 → 7,140</Hc>
 */
export function Hc({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-baseline gap-1 bg-amber-400/20 border border-amber-400/50 border-dashed rounded px-1 py-0.5 cursor-help"
      title={TOOLTIP}
    >
      <span className="underline decoration-amber-400 decoration-dashed underline-offset-2">
        {children}
      </span>
      <span className="text-[9px] font-bold text-amber-400 leading-none select-none tracking-wide">
        HC
      </span>
    </span>
  );
}

/**
 * HcMark — used inside chip renderers where the value is a plain string.
 * Renders a bright [HC] badge inline after the value.
 */
export function HcMark() {
  return (
    <span
      className="ml-1 inline-flex items-center px-1 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 border-dashed text-[9px] font-bold text-amber-400 leading-none cursor-help select-none tracking-wide"
      title={TOOLTIP}
    >
      HC
    </span>
  );
}
