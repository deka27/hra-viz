interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
  badgeColor?: string;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  badge,
  badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/20",
}: ChartCardProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
