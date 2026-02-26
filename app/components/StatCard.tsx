interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export default function StatCard({ label, value, sub, accent = "text-zinc-900 dark:text-zinc-50" }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</span>
      {sub && <span className="text-zinc-500 text-sm">{sub}</span>}
    </div>
  );
}
