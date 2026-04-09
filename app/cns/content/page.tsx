import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/charts/DonutChart";
import PDFDownloadsChart from "../../components/charts/PDFDownloadsChart";
import PDFTrendChart from "../../components/charts/PDFTrendChart";
import CNSWorkshopChart from "../../components/charts/CNSWorkshopChart";
import CNSTeamChart from "../../components/charts/CNSTeamChart";
import CNSNewsByYearChart from "../../components/charts/CNSNewsByYearChart";

import topPdfs from "../../../public/data/cns/cns_top_pdfs.json";
import pdfMonthly from "../../../public/data/cns/cns_pdf_monthly.json";
import contentBreakdown from "../../../public/data/cns/cns_content_breakdown.json";
import workshopPages from "../../../public/data/cns/cns_workshop_pages.json";
import teamPages from "../../../public/data/cns/cns_team_pages.json";
import cnsNews from "../../../public/data/cns/cns_news.json";

// --- Derived stats ---
const totalPdfDownloads = topPdfs.reduce((s, d) => s + d.downloads, 0);
const topPdf = [...topPdfs].sort((a, b) => b.downloads - a.downloads)[0];
const topPdfName = topPdf
  ? decodeURIComponent(
      topPdf.pdf
        .replace(/^\/+/, "")
        .split("/")
        .pop() ?? topPdf.pdf
    ).replace(/\.pdf$/i, "")
  : "N/A";
const workshopCount = workshopPages.length;
const teamTotalViews = teamPages.reduce((s, d) => s + d.visits, 0);

// News stats
const newsCount = cnsNews.length;
const sortedNews = [...cnsNews].sort((a, b) => b.date.localeCompare(a.date));
const latestNewsDate = sortedNews.length > 0 ? sortedNews[0].date : "";
const latestNewsLabel = latestNewsDate
  ? (() => {
      const [y, m, d] = latestNewsDate.split("-");
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
    })()
  : "N/A";
const recentNews = sortedNews.slice(0, 20);
const newsYearSpan = sortedNews.length > 0
  ? `${sortedNews[sortedNews.length - 1].date.slice(0, 4)}-${sortedNews[0].date.slice(0, 4)}`
  : "N/A";

// Content donut colors
const CONTENT_COLORS: Record<string, string> = {
  "Team Photos": "#ec4899",
  "Other PDFs": "#a1a1aa",
  Presentations: "#3b82f6",
  Publications: "#8b5cf6",
  "Team Pages": "#f43f5e",
  Workshops: "#10b981",
  "Publications Page": "#7c3aed",
  News: "#f59e0b",
  Contact: "#06b6d4",
  Jobs: "#14b8a6",
  "Presentations Page": "#60a5fa",
  Homepage: "#6366f1",
  "Dead Link Redirects": "#ef4444",
  "Scanner/Probe Traffic": "#78716c",
};

const contentDonutData = contentBreakdown.map((d) => ({
  name: d.type,
  value: d.count,
  color: CONTENT_COLORS[d.type] ?? "#71717a",
}));

// Category legend for PDF chart
const pdfCategories = Array.from(new Set(topPdfs.map((d) => d.category)));
const PDF_CATEGORY_COLORS: Record<string, string> = {
  Publications: "#8b5cf6",
  Presentations: "#3b82f6",
  News: "#f59e0b",
  Workshops: "#10b981",
  Team: "#ec4899",
  "Other PDFs": "#71717a",
};

// Monthly trend stats
const sortedMonthly = [...pdfMonthly].sort(
  (a, b) => a.month_year.localeCompare(b.month_year)
);
const peakMonth = [...pdfMonthly].sort((a, b) => b.downloads - a.downloads)[0];
const peakMonthLabel = peakMonth
  ? (() => {
      const [y, mo] = peakMonth.month_year.split("-");
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return `${months[parseInt(mo) - 1]} ${y}`;
    })()
  : "N/A";
const dateRange = (() => {
  if (sortedMonthly.length === 0) return "N/A";
  const first = sortedMonthly[0].month_year;
  const last = sortedMonthly[sortedMonthly.length - 1].month_year;
  const fmt = (m: string) => {
    const [y, mo] = m.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[parseInt(mo) - 1]} ${y}`;
  };
  return `${fmt(first)} - ${fmt(last)}`;
})();

export default function CNSContentPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          CNS Content Analysis
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Content & Document Analytics
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
          Analysis of PDF downloads, content types, workshop pages, and team member page views
          on cns.iu.edu. Data covers {dateRange}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total PDF Downloads"
          value={totalPdfDownloads.toLocaleString()}
          sub={`Across ${topPdfs.length} tracked PDFs`}
          accent="text-violet-400"
        />
        <StatCard
          label="Top PDF"
          value={topPdfName.length > 20 ? topPdfName.slice(0, 18) + "..." : topPdfName}
          sub={`${topPdf?.downloads.toLocaleString() ?? 0} downloads`}
          accent="text-blue-400"
        />
        <StatCard
          label="Workshop Pages"
          value={workshopCount.toString()}
          sub="Tracked workshop/event pages"
          accent="text-emerald-400"
        />
        <StatCard
          label="Team Page Views"
          value={teamTotalViews.toLocaleString()}
          sub={`Across ${teamPages.length} team entries`}
          accent="text-pink-400"
        />
        <StatCard
          label="News Articles"
          value={newsCount.toString()}
          sub={`Latest: ${latestNewsLabel}`}
          accent="text-cyan-400"
        />
      </div>

      {/* PDF Downloads chart */}
      <ChartCard
        title="Top 15 PDF Downloads"
        subtitle="Color by category: violet = Publications, blue = Presentations, amber = News, gray = Other"
        badge={`${topPdfs.length} PDFs`}
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      >
        <PDFDownloadsChart data={topPdfs} />
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-x-5 gap-y-1.5">
          {pdfCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PDF_CATEGORY_COLORS[cat] ?? "#71717a" }}
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{cat}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* PDF monthly trend */}
      <ChartCard
        title="Monthly PDF Download Trend"
        subtitle={`Peak: ${peakMonthLabel} (${peakMonth?.downloads.toLocaleString() ?? 0} downloads) -- Use slider to zoom`}
        badge={`${sortedMonthly.length} months`}
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      >
        <PDFTrendChart data={pdfMonthly} />
      </ChartCard>

      {/* Content breakdown donut + Workshop pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="Content Type Breakdown"
          subtitle="Distribution of all request types across cns.iu.edu"
        >
          <DonutChart data={contentDonutData} unit="requests" />
        </ChartCard>

        <ChartCard
          title="Workshop & Event Pages"
          subtitle={`Top ${Math.min(15, workshopCount)} workshop pages by visits`}
          badge="Workshops"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <CNSWorkshopChart data={workshopPages} />
        </ChartCard>
      </div>

      {/* Team page views */}
      <ChartCard
        title="Team Member Page Views"
        subtitle={`Top 20 team member pages by visits -- ${teamTotalViews.toLocaleString()} total views`}
        badge="Team"
        badgeColor="bg-pink-500/10 text-pink-400 border-pink-500/20"
      >
        <CNSTeamChart data={teamPages} />
      </ChartCard>

      {/* News section divider */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">News Coverage</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* News by year chart */}
      <ChartCard
        title="News Articles by Year"
        subtitle={`${newsCount} articles spanning ${newsYearSpan}`}
        badge="News"
        badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      >
        <CNSNewsByYearChart data={cnsNews.map((d) => ({ date: d.date, title: d.title }))} />
      </ChartCard>

      {/* Recent news list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Recent News</h2>
            <p className="text-xs text-zinc-500">20 most recent news articles and media mentions</p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            {newsCount} total
          </span>
        </div>
        <div className="max-h-[520px] overflow-y-auto pr-1 space-y-2">
          {recentNews.map((article) => {
            const [y, m, d] = article.date.split("-");
            const months = [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];
            const dateLabel = `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
            const truncTitle =
              article.title.length > 80
                ? article.title.slice(0, 77) + "..."
                : article.title;
            return (
              <div
                key={article.slug}
                className="flex items-start gap-3 p-3 rounded-lg border-l-2 border-cyan-500/40 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                      {dateLabel}
                    </span>
                    {article.publisher && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 truncate max-w-[160px]">
                        {article.publisher}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
                    {article.link ? (
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-500 transition-colors"
                      >
                        {truncTitle}
                        <svg
                          className="inline-block ml-1 w-3 h-3 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ) : (
                      truncTitle
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
