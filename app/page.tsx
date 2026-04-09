import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          CloudFront Log Analytics
        </h1>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Interactive dashboards for analyzing web traffic, user behavior, and research impact
          across Indiana University platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* HRA Card */}
        <Link
          href="/hra"
          className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col gap-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/5"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-500 transition-colors">
              HRA Portal
            </h2>
            <p className="text-sm text-zinc-500 mt-1">humanatlas.io</p>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Human Reference Atlas tool analytics — EUI, RUI, CDE, FTU Explorer, KG Explorer.
            Traffic trends, error analysis, geographic reach, ML insights.
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">5 Tools</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">7 Pages</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">ML Pipeline</span>
          </div>
        </Link>

        {/* CNS Card */}
        <Link
          href="/cns"
          className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col gap-4 hover:border-amber-400 dark:hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-amber-500 transition-colors">
              CNS Center
            </h2>
            <p className="text-sm text-zinc-500 mt-1">cns.iu.edu</p>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Cyberinfrastructure for Network Science website analytics — traffic, content, PDFs,
            referrers, errors, funding, and 405+ publications.
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">18 Years</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">6 Pages</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">405+ Publications</span>
          </div>
        </Link>
      </div>

      <p className="text-xs text-zinc-500">
        Indiana University · Cyberinfrastructure for Network Science Center
      </p>
    </div>
  );
}
