"use client";

interface ErrorRow {
  message: string;
  count: number;
  bucket: string;
}

interface ToolErrors {
  tool: string;
  errors: ErrorRow[];
}

const BUCKET_COLORS: Record<string, string> = {
  "CDN icon failure":           "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "CDN / HTTP failure":         "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "API failure":                "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "CORS: technology list API":  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "Null-ref error":             "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "Angular DI error":           "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "Runtime type error":         "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Content fetch failure":      "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  "Dev noise":                  "bg-zinc-600/10 text-zinc-500 border-zinc-600/20",
  "Other":                      "bg-zinc-600/10 text-zinc-500 border-zinc-600/20",
};

export default function ToolErrorDrilldown({
  data,
  tool,
}: {
  data: ToolErrors[];
  tool: string;
}) {
  const entry = data.find((d) => d.tool === tool);
  if (!entry || entry.errors.length === 0) return null;

  const total = entry.errors.reduce((s, e) => s + e.count, 0);
  const max = entry.errors[0].count;

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
        Top error sources — {total.toLocaleString()} total logged
      </p>
      <div className="flex flex-col gap-1.5">
        {entry.errors.map((e, i) => {
          const pct = Math.round((e.count / max) * 100);
          const badgeCls = BUCKET_COLORS[e.bucket] ?? BUCKET_COLORS["Other"];
          return (
            <div key={i} className="group flex items-center gap-3">
              {/* bar track */}
              <div className="relative flex-1 min-w-0">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-zinc-700/40"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2 px-2 py-1.5">
                  <span
                    className="text-xs text-zinc-300 truncate leading-tight"
                    title={e.message}
                  >
                    {e.message}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono shrink-0">
                    {e.count.toLocaleString()}
                  </span>
                </div>
              </div>
              {/* bucket badge */}
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 hidden sm:inline-block ${badgeCls}`}
              >
                {e.bucket}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
