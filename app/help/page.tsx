import dictionary from "../../public/data/hra/parquet_field_dictionary.json";
import hraMetadata from "../../public/data/hra/data_metadata.json";
import cnsMetadata from "../../public/data/cns/cns_data_metadata.json";

type Dictionary = {
  generated_at_utc: string;
  parquet_path: string;
  row_count: number;
  fields: FieldRow[];
};

type FieldRow = {
  field: string;
  type?: string | null;
  nullable?: boolean | null;
  meaning?: string;
  usage?: string;
};

const data = dictionary as Dictionary;
const fieldRows = data.fields;

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Help</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Parquet Field Dictionary</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-3xl">
          Both HRA and CNS dashboards share the same CloudFront log schema (40 fields). This page documents all fields.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">HRA (humanatlas.io)</span>
          </div>
          <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Parquet:</span> <span className="font-mono text-xs">data/2026-04-06_hra-logs.parquet</span></div>
          <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Date range:</span> <span className="font-mono text-xs">{hraMetadata.first_date} – {hraMetadata.last_date}</span></div>
          <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Sites:</span> <span className="text-xs">Apps, Portal, KG, API, CDN, Events</span></div>
        </div>
        <div className="bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">CNS (cns.iu.edu)</span>
          </div>
          <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Parquet:</span> <span className="font-mono text-xs">data/2026-04-06_cns-logs.parquet</span></div>
          <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Date range:</span> <span className="font-mono text-xs">{cnsMetadata.first_date} – {cnsMetadata.last_date}</span></div>
          <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Sites:</span> <span className="text-xs">CNS</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Top-Level Parquet Fields</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                <th className="py-2 pr-4 text-zinc-500 font-medium">Field</th>
                <th className="py-2 pr-4 text-zinc-500 font-medium">Type</th>
                <th className="py-2 pr-4 text-zinc-500 font-medium">Information</th>
                <th className="py-2 text-zinc-500 font-medium">Used For</th>
              </tr>
            </thead>
            <tbody>
              {fieldRows.map((row) => (
                <tr key={row.field} className="border-b border-zinc-200/70 dark:border-zinc-800/70 align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{row.field}</td>
                  <td className="py-2 pr-4 text-zinc-500 font-mono text-xs whitespace-nowrap">
                    {row.type ?? "n/a"}
                    {row.nullable === true && " · nullable"}
                    {row.nullable === false && " · not null"}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.meaning ?? ""}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{row.usage ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
