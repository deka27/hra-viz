"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import type { EChartsReactProps } from "echarts-for-react/lib/types";

const EChart = dynamic(() => import("echarts-for-react"), { ssr: false });

const LIGHT_REPLACEMENTS: Record<string, string> = {
  "#fafafa": "#111827",
  "#d4d4d8": "#27272a",
  "#a1a1aa": "#3f3f46",
  "#71717a": "#52525b",
  "#52525b": "#3f3f46",
  "#3f3f46": "#a1a1aa",
  "#27272a": "#e4e4e7",
  "#1c1c1f": "#f4f4f5",
  "#18181b": "#ffffff",
  "#09090b": "#ffffff",
};

function replaceColorTokens(input: string): string {
  const keys = Object.keys(LIGHT_REPLACEMENTS).map((k) => k.replace("#", "\\#"));
  const tokenRegex = new RegExp(`(${keys.join("|")})`, "gi");
  return input.replace(tokenRegex, (match) => LIGHT_REPLACEMENTS[match.toLowerCase()] ?? match);
}

function transformThemeValue(value: unknown, isDark: boolean): unknown {
  if (isDark || value == null) return value;

  if (typeof value === "string") {
    return replaceColorTokens(value);
  }

  if (typeof value === "function") {
    return function wrapped(this: unknown, ...args: unknown[]) {
      const result = value.apply(this, args);
      return transformThemeValue(result, isDark);
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformThemeValue(item, isDark));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = transformThemeValue(v, isDark);
    }
    return out;
  }

  return value;
}

export default function ThemedEChart(props: EChartsReactProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const themedOption = useMemo(
    () => transformThemeValue(props.option, isDark),
    [props.option, isDark],
  );

  return <EChart {...props} option={themedOption} />;
}
