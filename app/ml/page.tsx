import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import DonutChart from "../components/charts/DonutChart";
import MLForecastChart, { ForecastRow } from "../components/charts/MLForecastChart";
import MLSpikeEventsChart, { SpikeRow } from "../components/charts/MLSpikeEventsChart";
import MLChurnBucketsChart, { ChurnBucket } from "../components/charts/MLChurnBucketsChart";
import MLTransitionHeatmap, { TransitionRow } from "../components/charts/MLTransitionHeatmap";
import MLRuleLiftChart, { RuleRow } from "../components/charts/MLRuleLiftChart";
import MLErrorClustersChart, { ErrorClusterRow } from "../components/charts/MLErrorClustersChart";
import MLGeoAnomalyChart, { GeoAnomalyRow } from "../components/charts/MLGeoAnomalyChart";
import CohortRetentionChart from "../components/charts/CohortRetentionChart";

import forecastData from "../../public/data/forecast_tool_visits.json";
import detectedEvents from "../../public/data/detected_events.json";
import userSegments from "../../public/data/user_segments.json";
import returnProbability from "../../public/data/return_probability.json";
import transitionMatrix from "../../public/data/transition_matrix.json";
import featureCooccurrence from "../../public/data/feature_cooccurrence.json";
import botScores from "../../public/data/bot_scores.json";
import errorClusters from "../../public/data/error_clusters.json";
import suspiciousCountries from "../../public/data/suspicious_countries.json";
import crossToolRecommendations from "../../public/data/cross_tool_recommendations.json";
import pipelineMetadata from "../../public/data/ml_pipeline_metadata.json";
import cohortRetention from "../../public/data/cohort_retention.json";

type Segment = {
  cluster_id: number;
  size: number;
  pct: number;
  avg_depth: number;
  bounce_rate: number;
  error_rate: number;
  top_tool?: string;
  name: string;
};

type ChurnMetrics = {
  sessions_used: number;
  positive_rate: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
};

type BotMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  positive_rate: number;
  rows_train: number;
  rows_test: number;
};

type Recommendation = {
  source_tool: string;
  recommended_tool: string;
  support: number;
  confidence: number;
  lift: number;
  co_sessions: number;
  basis: string;
};

type PipelineRows = {
  monthly_points: number;
  event_rows: number;
  sessions: number;
  transactions: number;
};

const SEGMENT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#22c55e"];

const COUNTRY_NAMES: Record<string, string> = {
  AU:"Australia", BR:"Brazil", CA:"Canada", CN:"China", FI:"Finland", FR:"France",
  DE:"Germany", IN:"India", IE:"Ireland", IT:"Italy", JP:"Japan", JM:"Jamaica",
  KR:"South Korea", MX:"Mexico", NL:"Netherlands", NZ:"New Zealand", NG:"Nigeria",
  PL:"Poland", PT:"Portugal", RU:"Russia", ES:"Spain", SD:"Sudan", SE:"Sweden",
  CH:"Switzerland", TW:"Taiwan", TR:"Turkey", UA:"Ukraine", GB:"United Kingdom",
  US:"United States", VN:"Vietnam", ZA:"South Africa",
};
const FEATURE_LABELS: Record<string, string> = {
  early_pageView: "early page views",
  start_hour_utc: "session start time",
  unique_tools: "number of different tools used",
  early_error: "early error events",
  duration_min: "long session duration",
  is_weekend: "weekend usage",
  early_click: "early click activity",
  early_hover: "early hover activity",
  early_keyboard: "early keyboard usage",
  events: "total events in the session",
  ua_bot_hint: "bot-like user-agent text",
  ua_len: "user-agent string length",
  referer_len: "referrer string length",
  uri_len: "URL path length",
  cs_bytes: "request payload size",
};

function asNum(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function forecastPeak(rows: ForecastRow[]): ForecastRow | null {
  if (!rows.length) return null;
  return rows.reduce((best, row) => (row.predicted > best.predicted ? row : best), rows[0]);
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = Number.parseInt(m, 10) - 1;
  return `${months[idx]} ${year}`;
}

function friendlyFeatureName(name: string | undefined): string {
  if (!name) return "n/a";
  return FEATURE_LABELS[name] ?? name.replaceAll("_", " ");
}

function friendlyRuleText(rule: RuleRow | undefined): string {
  if (!rule) return "n/a";
  const left = rule.antecedents
    .map((s) => s.replace("feature:", "").replace("event:", "").replace("tool:", "").replaceAll("_", " "))
    .join(" + ");
  const right = rule.consequent
    .replace("feature:", "")
    .replace("event:", "")
    .replace("tool:", "")
    .replaceAll("_", " ");
  return `${left} -> ${right}`;
}

export default function MLPage() {
  const forecast = forecastData as ForecastRow[];
  const spikes = detectedEvents as SpikeRow[];
  const segments = ((userSegments as { segments?: Segment[] }).segments ?? []) as Segment[];
  const churn = (returnProbability as { metrics?: ChurnMetrics; probability_buckets?: ChurnBucket[]; top_positive_features?: Array<{ feature: string; weight: number }>; top_negative_features?: Array<{ feature: string; weight: number }> });
  const transitions = ((transitionMatrix as { transitions?: TransitionRow[] }).transitions ?? []) as TransitionRow[];
  const rules = ((featureCooccurrence as { rules?: RuleRow[] }).rules ?? []) as RuleRow[];
  const bot = (botScores as { metrics?: BotMetrics; feature_importance?: Array<{ feature: string; importance: number }> });
  const clusters = ((errorClusters as { clusters?: ErrorClusterRow[] }).clusters ?? []) as ErrorClusterRow[];
  const geo = ((suspiciousCountries as { suspicious_countries?: GeoAnomalyRow[] }).suspicious_countries ?? []) as GeoAnomalyRow[];
  const recs = ((crossToolRecommendations as { recommendations?: Recommendation[] }).recommendations ?? []) as Recommendation[];
  const metadataRows = ((pipelineMetadata as { rows?: PipelineRows }).rows ?? {
    monthly_points: 0,
    event_rows: 0,
    sessions: 0,
    transactions: 0,
  }) as PipelineRows;

  const dominantSegment = segments[0];
  const topSpike = spikes[0];
  const topTransition = transitions[0];
  const topRule = rules[0];
  const topError = clusters[0];
  const topGeo = geo[0];
  const topBotFeature = bot.feature_importance?.[0];
  const peak = forecastPeak(forecast);
  const modelScore = Math.round(asNum(churn.metrics?.roc_auc) * 100);
  const artifactCount = geo.filter((d) => d.likely_artifact).length;

  const segmentDonut = segments.map((s, idx) => ({
    name: s.name,
    value: s.size,
    color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
  }));

  const strongestRecommendations = [...recs]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Machine Learning View</div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">What the Models Suggest (Plain Language)</h1>
        <p className="text-zinc-400 text-sm max-w-3xl">
          This page translates model output into practical answers: expected traffic, unusual surges, who returns,
          where people go next, recurring error themes, and countries with unusual traffic patterns.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">How To Read This Page</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-zinc-400">
          <div>
            <span className="text-zinc-300 font-medium">Forecasts:</span> directional estimates, not exact counts.
          </div>
          <div>
            <span className="text-zinc-300 font-medium">Behavior charts:</span> percentages are easier to trust than raw scores.
          </div>
          <div>
            <span className="text-zinc-300 font-medium">Anomalies:</span> these are review candidates, not confirmed issues.
          </div>
          <div>
            <span className="text-zinc-300 font-medium">Recommendations:</span> treat as hints for UI prompts and cross-links.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Sessions Analyzed"
          value={metadataRows.sessions.toLocaleString()}
          sub={`${metadataRows.event_rows.toLocaleString()} tracked events`}
          accent="text-blue-400"
        />
        <StatCard
          label="Return Model Score"
          value={`${modelScore}/100`}
          sub="50 = random guess, 100 = perfect"
          accent="text-emerald-400"
        />
        <StatCard
          label="Unusual Traffic Surges"
          value={spikes.length.toString()}
          sub={topSpike ? `${topSpike.tool} has the biggest jump` : "No surges detected"}
          accent="text-amber-400"
        />
        <StatCard
          label="Error Themes"
          value={clusters.length.toString()}
          sub={`${asNum((errorClusters as { total_error_rows?: number }).total_error_rows).toLocaleString()} error rows clustered`}
          accent="text-red-400"
        />
        <StatCard
          label="Countries To Review"
          value={geo.length.toString()}
          sub={`${artifactCount} look likely automated`}
          accent="text-violet-400"
        />
      </div>

      <ChartCard
        title="Expected Visits Over The Next 6 Months"
        subtitle="Each line is a tool. Hover to see likely low/high range."
        badge="Forecast"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      >
        <MLForecastChart data={forecast} />
        {peak && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
            Biggest projected month in this run:{" "}
            <span className="text-zinc-300 font-medium">
              {peak.tool} at {peak.predicted.toLocaleString()} visits in {monthLabel(peak.month)}
            </span>{" "}
            (likely range {peak.lower.toLocaleString()} - {peak.upper.toLocaleString()}).
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="Big Traffic Jumps We Should Explain"
          subtitle="Bars show extra visits compared with the previous month."
          badge="Surges"
          badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
        >
          <MLSpikeEventsChart data={spikes} />
          {topSpike && (
            <p className="mt-3 text-xs text-zinc-500">
              Largest jump in this run:{" "}
              <span className="text-zinc-300 font-medium">
                {topSpike.tool} in {monthLabel(topSpike.month)}
              </span>.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Who Comes Back After A Session?"
          subtitle="Blue bars = number of sessions. Orange line = real return rate."
          badge="Return Behavior"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <MLChurnBucketsChart data={(churn.probability_buckets ?? []) as ChurnBucket[]} />
          <div className="mt-3 text-xs text-zinc-500">
            Strongest return signal:{" "}
            <span className="text-zinc-300 font-medium">{friendlyFeatureName(churn.top_positive_features?.[0]?.feature)}</span> ·
            strongest drop-off signal:{" "}
            <span className="text-zinc-300 font-medium">{friendlyFeatureName(churn.top_negative_features?.[0]?.feature)}</span>.
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Cohort Retention — Do Users Come Back?"
        subtitle="Each line is a monthly cohort. Drops show how retention decays over time."
        badge="Cohort Analysis"
        badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      >
        <CohortRetentionChart data={cohortRetention} />
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-500">
          <div>
            <span className="text-zinc-300 font-medium">Reading the chart:</span> Row = cohort month, Column = months after first visit.
            Darker blue = more users returned. Tracked via persistent cookie (anon_id).
          </div>
          <div>
            <span className="text-zinc-300 font-medium">Month 0 = 100%</span> by definition — these are the users that define the cohort.
            Watch for how quickly each row fades.
          </div>
          <div>
            <span className="text-zinc-300 font-medium">Cookie tracking</span> started Oct 2025, so only recent cohorts appear.
            Older visits lack persistent IDs for user-level retention measurement.
          </div>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ChartCard
          title="Session Types (Simple Grouping)"
          subtitle="The model groups sessions by depth, duration, and interaction style."
          className="lg:col-span-2"
          badge="Audience Types"
          badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
        >
          <DonutChart data={segmentDonut} unit="sessions" height={300} />
          {dominantSegment && (
            <p className="mt-2 text-xs text-zinc-500">
              Largest group:{" "}
              <span className="text-zinc-300 font-medium">
                {dominantSegment.name} ({dominantSegment.pct.toFixed(1)}%)
              </span>.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Where People Go Next Between Tools"
          subtitle="Rows are current tool, columns are next tool in the same session."
          className="lg:col-span-3"
          badge="User Journeys"
          badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/20"
        >
          <MLTransitionHeatmap data={transitions} />
          {topTransition && (
            <p className="mt-2 text-xs text-zinc-500">
              Most common next-step path:{" "}
              <span className="text-zinc-300 font-medium">
                {topTransition.from_tool} → {topTransition.to_tool}
              </span>{" "}
              ({(topTransition.probability * 100).toFixed(1)}%, {topTransition.count} transitions).
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="Behaviors That Happen Together"
          subtitle="How often the right-side action happens after the left-side action."
          badge="Behavior Pairings"
          badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20"
        >
          <MLRuleLiftChart data={rules} />
          {topRule && (
            <p className="mt-3 text-xs text-zinc-500">
              Strongest pairing right now:{" "}
              <span className="text-zinc-300 font-medium">
                {friendlyRuleText(topRule)}
              </span>{" "}
              (confidence {(topRule.confidence * 100).toFixed(1)}%).
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Main Error Themes"
          subtitle="~55% are uncontrollable network failures · ~25% are fixable KG Explorer icon bugs · ~3% is dev noise"
          badge="Errors"
          badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
        >
          <MLErrorClustersChart data={clusters} />
          {topError && (
            <p className="mt-3 text-xs text-zinc-500">
              Largest cluster contributes{" "}
              <span className="text-zinc-300 font-medium">{topError.pct.toFixed(1)}%</span> of error rows.
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ChartCard
          title="Countries With Unusual Traffic Patterns"
          subtitle="Bar = bot-like traffic share. Use as a review list, not a final verdict."
          className="lg:col-span-3"
          badge="Geo Review"
          badgeColor="bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"
        >
          <MLGeoAnomalyChart data={geo} />
          {topGeo && (
            <p className="mt-2 text-xs text-zinc-500">
              Highest-priority review country in this run:{" "}
              <span className="text-zinc-300 font-medium">
                {COUNTRY_NAMES[topGeo.c_country] ?? topGeo.c_country}
              </span>.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Cross-Tool Usage"
          subtitle="Do users move between tools in the same session?"
          className="lg:col-span-2"
          badge="Tool Loyalty"
          badgeColor="bg-zinc-800 text-zinc-400 border-zinc-700"
        >
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Users strongly prefer <span className="text-zinc-100 font-medium">staying in one tool</span> per session.
              All cross-tool pairings have lift &lt; 1 — meaning switching tools is{" "}
              <span className="text-zinc-100 font-medium">less likely than random chance</span>.
            </p>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {[...recs]
                .sort((a, b) => b.co_sessions - a.co_sessions)
                .slice(0, 4)
                .map((r) => (
                  <div key={`${r.source_tool}-${r.recommended_tool}`} className="flex items-center justify-between bg-zinc-800/40 rounded-lg px-3 py-2">
                    <span className="text-xs text-zinc-400">
                      {r.source_tool} → {r.recommended_tool}
                    </span>
                    <span className="text-xs text-zinc-500">{r.co_sessions} shared sessions</span>
                  </div>
                ))}
            </div>
            <p className="text-xs text-zinc-600">
              Most cross-tool sessions involve KG Explorer + CDE ({recs.find(r => r.source_tool === "CDE" && r.recommended_tool === "KG Explorer")?.co_sessions ?? 0} sessions). Consider surface-level cross-links rather than active suggestions.
            </p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Confidence Note</div>
          <p className="text-sm text-zinc-400">
            Return model score is <span className="text-zinc-200 font-medium">{modelScore}/100</span>, which is useful for
            ranking risk but not perfect for exact individual prediction.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Bot Signal Driver</div>
          <p className="text-sm text-zinc-400">
            Most influential bot feature is{" "}
            <span className="text-zinc-200 font-medium">{friendlyFeatureName(topBotFeature?.feature)}</span> in this run.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Journey Coverage</div>
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-200 font-medium">
              {asNum((transitionMatrix as { sessions_with_sequences?: number }).sessions_with_sequences).toLocaleString()}
            </span>{" "}
            sessions contained multi-step tool journeys we could model.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Data Coverage</div>
          <p className="text-sm text-zinc-400">
            Last ML run processed <span className="text-zinc-200 font-medium">{metadataRows.monthly_points}</span> monthly
            tool points and <span className="text-zinc-200 font-medium">{metadataRows.transactions.toLocaleString()}</span> session-level transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
