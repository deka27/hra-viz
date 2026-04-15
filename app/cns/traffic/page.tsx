import StatCard from "../../components/StatCard";
import ChartCard from "../../components/ChartCard";
import CNSMonthlyTrendChart from "../../components/charts/CNSMonthlyTrendChart";
import BotTrendChart from "../../components/charts/BotTrendChart";
import CNSHourlyChart from "../../components/charts/CNSHourlyChart";
import CNSDowChart from "../../components/charts/CNSDowChart";

import monthlyVisits from "../../../public/data/cns/cns_monthly_visits.json";
import botTrend from "../../../public/data/cns/cns_bot_trend.json";
import trafficTypes from "../../../public/data/cns/cns_traffic_types.json";
import hourlyTraffic from "../../../public/data/cns/cns_hourly_traffic.json";
import dowTraffic from "../../../public/data/cns/cns_traffic_by_dow.json";

/* ── Derived stats ──────────────────────────────────────────────────────────── */

function fmtMonth(ym: string): string {
  const [y, mo] = ym.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

// Exclude partial months (first and last if small) from peak/avg computation
const fullMonths = monthlyVisits.filter((d) => d.total > 1000);

// Peak month by human traffic
const peakMonth = fullMonths.reduce((mx, d) => (d.human > mx.human ? d : mx), fullMonths[0]);
const peakLabel = fmtMonth(peakMonth.month_year);

// Average monthly human traffic (full months only)
const avgMonthly = Math.round(
  fullMonths.reduce((s, d) => s + d.human, 0) / fullMonths.length
);

// Recent (trailing 12 full months) average for the "Sustained Growth" callout
const last12Months = fullMonths.slice(-12);
const avgRecent = Math.round(
  last12Months.reduce((s, d) => s + d.human, 0) / last12Months.length
);

// Traffic type percentages
const totalRequests = trafficTypes.reduce((s, d) => s + d.count, 0);
const botCount = trafficTypes.find((d) => d.type === "Bot")?.count ?? 0;
const aiCount = trafficTypes.find((d) => d.type === "AI-Assistant / Bot")?.count ?? 0;
const botPct = ((botCount / totalRequests) * 100).toFixed(1);
const aiPct = ((aiCount / totalRequests) * 100).toFixed(1);

// Hourly insights
const peakHour = hourlyTraffic.reduce((mx, d) => (d.count > mx.count ? d : mx), hourlyTraffic[0]);
const peakHourLabel = peakHour.hour === 0 ? "12 AM" : peakHour.hour === 12 ? "12 PM" : peakHour.hour < 12 ? `${peakHour.hour} AM` : `${peakHour.hour - 12} PM`;

// DOW insights
const peakDow = dowTraffic.reduce((mx, d) => (d.visits > mx.visits ? d : mx), dowTraffic[0]);
const weekdayTotal = dowTraffic.filter((d) => d.dow_num >= 1 && d.dow_num <= 5).reduce((s, d) => s + d.visits, 0);
const weekendTotal = dowTraffic.filter((d) => d.dow_num === 0 || d.dow_num === 6).reduce((s, d) => s + d.visits, 0);
const dowTotal = dowTraffic.reduce((s, d) => s + d.visits, 0);
const weekdayPct = ((weekdayTotal / dowTotal) * 100).toFixed(1);

// Bot trend: first appearance of AI bots
const firstAi = botTrend.find((d) => d.ai_bot > 0);
const firstAiLabel = firstAi ? fmtMonth(firstAi.month_year) : "N/A";

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function CNSTrafficPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Traffic Trends
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Monthly and hourly traffic patterns for cns.iu.edu, including bot/human breakdowns, day-of-week profiles,
          and the emergence of AI-assistant crawlers.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Peak Month"
          value={peakLabel}
          sub={`${fmtCompact(peakMonth.human)} human requests`}
          accent="text-blue-400"
        />
        <StatCard
          label="Avg Monthly (Human)"
          value={fmtCompact(avgMonthly)}
          sub={`Across ${fullMonths.length} full months`}
        />
        <StatCard
          label="Bot Rate"
          value={`${botPct}%`}
          sub={`${fmtCompact(botCount)} bot requests`}
          accent="text-rose-400"
        />
        <StatCard
          label="AI Bot Rate"
          value={`${aiPct}%`}
          sub={`First seen ${firstAiLabel}`}
          accent="text-amber-400"
        />
      </div>

      {/* Monthly trend (stacked area) */}
      <ChartCard
        title="Monthly Traffic Volume"
        subtitle="Human, bot, and AI-bot requests per month (stacked area). Drag the slider to zoom."
        badge="Monthly"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      >
        <CNSMonthlyTrendChart data={monthlyVisits} />
      </ChartCard>

      {/* Bot trend (from 2018+) */}
      <ChartCard
        title="Bot vs Human Trend"
        subtitle="Traffic composition over time showing the rise of traditional bots and AI crawlers since 2018"
        badge="Since 2018"
        badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
      >
        <BotTrendChart data={botTrend} />
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
          <span>
            AI crawlers first appeared{" "}
            <span className="text-amber-400 font-medium">{firstAiLabel}</span>
          </span>
          <span>
            Peak AI month:{" "}
            <span className="text-amber-400 font-medium">
              {fmtMonth(
                botTrend.reduce((mx, d) => (d.ai_bot > mx.ai_bot ? d : mx), botTrend[0]).month_year
              )}
            </span>
          </span>
        </div>
      </ChartCard>

      {/* Hourly + DOW side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Traffic by Hour (UTC)"
          subtitle={`Peak hour: ${peakHourLabel} UTC (${fmtCompact(peakHour.count)} requests)`}
          badge="UTC"
          badgeColor="bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
        >
          <CNSHourlyChart data={hourlyTraffic} />
          <div className="mt-2 px-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-blue-500" />
            <span className="text-xs text-zinc-500">Peak zone (8 AM - 4 PM EST)</span>
          </div>
        </ChartCard>

        <ChartCard
          title="Traffic by Day of Week"
          subtitle={`${weekdayPct}% of traffic falls on weekdays (Mon-Fri)`}
        >
          <CNSDowChart data={dowTraffic} />
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-500">Peak day</span>
              <span className="text-sm font-semibold text-blue-400">{peakDow.day_name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-500">Weekend share</span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{fmtCompact(weekendTotal)} ({((weekendTotal / dowTotal) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Traffic insight cards */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Traffic Insights</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Weekday Dominance</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{weekdayPct}%</span> of all traffic arrives Monday through Friday,
            consistent with an academic/research audience. Weekend traffic drops significantly, confirming work-hour usage patterns.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Bot Pressure</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Traditional bots account for{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{botPct}%</span> of all requests ({fmtCompact(botCount)} total).
            Combined with AI crawlers ({aiPct}%), non-human traffic represents{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{(parseFloat(botPct) + parseFloat(aiPct)).toFixed(1)}%</span> of all requests.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Sustained Growth</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Monthly human traffic has grown from{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">~44K in Aug 2018</span> to a peak of{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(peakMonth.human)} in {peakLabel}</span>.
            The site averages{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{fmtCompact(avgRecent)} human requests/month</span>{" "}
            over the last {last12Months.length} months.
          </p>
        </div>
      </div>
    </div>
  );
}
