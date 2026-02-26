#!/usr/bin/env python3
"""
DuckDB-native data pipeline for HRA Analytics Dashboard.

Reads the CloudFront parquet directly — no full pandas load.
All aggregations run as SQL on the columnar file, then results are
written to public/data/*.json for Next.js to import at build time.

New outputs vs the pandas version:
  cohort_retention.json    — monthly cohort × months-since-first-visit retention
  tool_hourly_heatmap.json — per-tool event counts by hour of day (UTC)
"""

import json
import os
import argparse
from pathlib import Path

import duckdb

PARQUET_DEFAULT = "data/2026-01-13_hra-logs.parquet"
OUT_DEFAULT = "public/data"

TOOL_STEMS = "('/eui/','/rui/','/cde/','/ftu-explorer/','/kg-explorer/')"
TOOL_CASE = """CASE cs_uri_stem
    WHEN '/eui/'          THEN 'EUI'
    WHEN '/rui/'          THEN 'RUI'
    WHEN '/cde/'          THEN 'CDE'
    WHEN '/ftu-explorer/' THEN 'FTU Explorer'
    WHEN '/kg-explorer/'  THEN 'KG Explorer'
END"""

APP_TOOL_CASE = """CASE query['app']
    WHEN 'ccf-eui'          THEN 'EUI'
    WHEN 'ccf-rui'          THEN 'RUI'
    WHEN 'cde-ui'           THEN 'CDE'
    WHEN 'ftu-ui'           THEN 'FTU Explorer'
    WHEN 'ftu-ui-small-wc'  THEN 'FTU Explorer'
    WHEN 'kg-explorer'      THEN 'KG Explorer'
END"""

STATIC_FILTER = r"NOT regexp_matches(cs_uri_stem, '\.(js|css|svg|png|ico|woff2?|ttf|jpe?g|webp)$')"

SESSION_FILTER = """
    query['sessionId'] IS NOT NULL
    AND query['sessionId'] NOT IN ('', '-', 'TODO', 'null', 'None', 'nan')
    AND length(query['sessionId']) >= 4
"""


def write_json(path: str, data: object) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=True)
    print(f"✓ {os.path.basename(path)}")


def run(parquet: str, out: str) -> None:
    os.makedirs(out, exist_ok=True)
    P = f"read_parquet('{parquet}')"
    con = duckdb.connect()
    con.execute("PRAGMA threads=4")

    def q(sql: str):
        return con.execute(sql).df().to_dict(orient="records")

    # ─── 1. Tool visits by year (wide format) ────────────────────────────────
    write_json(f"{out}/tool_visits_by_year.json", q(f"""
        SELECT
            year,
            SUM(CASE WHEN cs_uri_stem='/eui/'          THEN 1 ELSE 0 END)::BIGINT AS EUI,
            SUM(CASE WHEN cs_uri_stem='/rui/'          THEN 1 ELSE 0 END)::BIGINT AS RUI,
            SUM(CASE WHEN cs_uri_stem='/cde/'          THEN 1 ELSE 0 END)::BIGINT AS CDE,
            SUM(CASE WHEN cs_uri_stem='/ftu-explorer/' THEN 1 ELSE 0 END)::BIGINT AS "FTU Explorer",
            SUM(CASE WHEN cs_uri_stem='/kg-explorer/'  THEN 1 ELSE 0 END)::BIGINT AS "KG Explorer"
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND site='Apps'
          AND cs_uri_stem IN {TOOL_STEMS}
        GROUP BY year ORDER BY year
    """))

    # ─── 2. Tool visits by month (wide format) ────────────────────────────────
    write_json(f"{out}/tool_visits_by_month.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            SUM(CASE WHEN cs_uri_stem='/eui/'          THEN 1 ELSE 0 END)::BIGINT AS EUI,
            SUM(CASE WHEN cs_uri_stem='/rui/'          THEN 1 ELSE 0 END)::BIGINT AS RUI,
            SUM(CASE WHEN cs_uri_stem='/cde/'          THEN 1 ELSE 0 END)::BIGINT AS CDE,
            SUM(CASE WHEN cs_uri_stem='/ftu-explorer/' THEN 1 ELSE 0 END)::BIGINT AS "FTU Explorer",
            SUM(CASE WHEN cs_uri_stem='/kg-explorer/'  THEN 1 ELSE 0 END)::BIGINT AS "KG Explorer"
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND site='Apps'
          AND cs_uri_stem IN {TOOL_STEMS}
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 3. Total tool visits ─────────────────────────────────────────────────
    write_json(f"{out}/total_tool_visits.json", q(f"""
        SELECT {TOOL_CASE} AS tool, count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND site='Apps'
          AND cs_uri_stem IN {TOOL_STEMS}
        GROUP BY tool ORDER BY visits DESC
    """))

    # ─── 4. Event types distribution ──────────────────────────────────────────
    write_json(f"{out}/event_types.json", q(f"""
        SELECT query['event'] AS event, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['event'] IS NOT NULL
        GROUP BY event ORDER BY count DESC
    """))

    # ─── 5. Top 20 UI paths ───────────────────────────────────────────────────
    write_json(f"{out}/top_ui_paths.json", q(f"""
        SELECT query['path'] AS path, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['path'] IS NOT NULL
        GROUP BY path ORDER BY count DESC LIMIT 20
    """))

    # ─── 6. Opacity interactions ──────────────────────────────────────────────
    write_json(f"{out}/opacity_interactions.json", q(f"""
        SELECT query['path'] AS path, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND lower(query['path']) LIKE '%opaci%'
        GROUP BY path ORDER BY count DESC
    """))

    # ─── 7. Spatial search interactions ───────────────────────────────────────
    write_json(f"{out}/spatial_search.json", q(f"""
        SELECT query['path'] AS path, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND lower(query['path']) LIKE '%spatial%'
        GROUP BY path ORDER BY count DESC
    """))

    # ─── 8. Geographic distribution ───────────────────────────────────────────
    # Count tool page visits per country (not CDN hops, not event pings)
    write_json(f"{out}/geo_distribution.json", q(f"""
        SELECT c_country, count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND site='Apps'
          AND cs_uri_stem IN {TOOL_STEMS}
          AND c_country IS NOT NULL AND c_country <> '-'
        GROUP BY c_country ORDER BY visits DESC
    """))

    # ─── 9. Traffic type breakdown (all rows) ─────────────────────────────────
    write_json(f"{out}/traffic_types.json", q(f"""
        SELECT traffic_type AS type, count(*)::BIGINT AS count
        FROM {P}
        WHERE traffic_type IS NOT NULL
        GROUP BY traffic_type ORDER BY count DESC
    """))

    # ─── 10. CDE workflow funnel ──────────────────────────────────────────────
    write_json(f"{out}/cde_workflow.json", q(f"""
        SELECT query['path'] AS path, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['app'] = 'cde-ui'
          AND query['path'] IS NOT NULL
        GROUP BY path ORDER BY count DESC LIMIT 15
    """))

    # ─── 11. External referrer ecosystem ──────────────────────────────────────
    write_json(f"{out}/referrers.json", q(f"""
        SELECT name, sum(n)::BIGINT AS value
        FROM (
            SELECT
                CASE
                    WHEN cs_referer LIKE '%gtexportal.org%'              THEN 'GTEx Portal'
                    WHEN cs_referer LIKE '%hubmapconsortium.org%'
                      OR cs_referer LIKE '%hubmapconsortium.github.io%'  THEN 'HubMAP'
                    WHEN cs_referer LIKE '%ebi.ac.uk%'                   THEN 'EBI'
                    WHEN cs_referer LIKE '%sennetconsortium.org%'        THEN 'SenNet'
                    WHEN cs_referer LIKE '%vitessce.io%'                 THEN 'Vitessce'
                    WHEN cs_referer LIKE '%google.com%'                  THEN 'Google'
                END AS name,
                count(*) AS n
            FROM {P}
            WHERE cs_referer IS NOT NULL
              AND cs_referer NOT IN ('', '-')
              AND cs_referer NOT LIKE '%humanatlas.io%'
              AND cs_referer NOT LIKE '%localhost%'
              AND cs_referer NOT LIKE '%cloudfront.net%'
            GROUP BY name
        )
        WHERE name IS NOT NULL
        GROUP BY name ORDER BY value DESC
    """))

    # ─── 12. Portal navigation clicks (e.label) ───────────────────────────────
    write_json(f"{out}/nav_clicks.json", q(f"""
        SELECT query['e.label'] AS label, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['e.label'] IS NOT NULL
        GROUP BY label ORDER BY count DESC LIMIT 15
    """))

    # ─── 13. CDE tab usage (e.tab) ────────────────────────────────────────────
    write_json(f"{out}/cde_tabs.json", q(f"""
        SELECT query['e.tab'] AS tab, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['e.tab'] IS NOT NULL
        GROUP BY tab ORDER BY count DESC
    """))

    # ─── 14. Sidebar / panel actions (e.action) ───────────────────────────────
    write_json(f"{out}/sidebar_actions.json", q(f"""
        SELECT query['e.action'] AS action, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['e.action'] IS NOT NULL
        GROUP BY action ORDER BY count DESC
    """))

    # ─── 15. Organ / view selections (e.value) ────────────────────────────────
    # Exclude coordinate strings (CenterY_global_px style) and long UUIDs
    write_json(f"{out}/organ_selections.json", q(f"""
        SELECT query['e.value'] AS selection, count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['e.value'] IS NOT NULL
          AND length(query['e.value']) < 60
          AND NOT regexp_matches(query['e.value'], '^[A-Z][a-zA-Z]+_')
        GROUP BY selection ORDER BY count DESC LIMIT 20
    """))

    # ─── 16. Hourly traffic distribution (UTC) ────────────────────────────────
    write_json(f"{out}/hourly_traffic.json", q(f"""
        SELECT
            try_cast(split_part(time, ':', 1) AS INTEGER) AS hour,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND time IS NOT NULL
        GROUP BY hour
        HAVING hour IS NOT NULL
        ORDER BY hour
    """))

    # ─── 17. Monthly unique sessions ──────────────────────────────────────────
    write_json(f"{out}/monthly_unique_users.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            count(DISTINCT query['sessionId'])::BIGINT AS unique_sessions
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND {SESSION_FILTER}
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 18. Session depth distribution ───────────────────────────────────────
    depth_raw = q(f"""
        WITH session_depths AS (
            SELECT query['sessionId'] AS sid, count(*)::BIGINT AS n
            FROM {P}
            WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
              AND {SESSION_FILTER}
            GROUP BY sid
        )
        SELECT
            CASE
                WHEN n = 1    THEN '1'
                WHEN n = 2    THEN '2'
                WHEN n <= 5   THEN '3–5'
                WHEN n <= 10  THEN '6–10'
                WHEN n <= 20  THEN '11–20'
                ELSE '20+'
            END AS depth,
            count(*)::BIGINT AS sessions
        FROM session_depths
        GROUP BY depth
    """)
    order = ['1', '2', '3–5', '6–10', '11–20', '20+']
    depth_map = {d['depth']: d['sessions'] for d in depth_raw}
    write_json(f"{out}/session_depth.json", [
        {'depth': k, 'sessions': depth_map.get(k, 0)} for k in order if k in depth_map
    ])

    # ─── 19. Error breakdown (source + root cause) ────────────────────────────
    # Uses the same data that powers the Features page error charts.
    # Source = which app; root cause = top error message patterns.
    write_json(f"{out}/error_breakdown.json", {
        "by_source": q(f"""
            SELECT {APP_TOOL_CASE} AS tool, count(*)::BIGINT AS errors
            FROM {P}
            WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
              AND query['event'] = 'error'
              AND query['app'] IS NOT NULL
            GROUP BY tool
            HAVING tool IS NOT NULL
            ORDER BY errors DESC
        """),
        "by_message": q(f"""
            SELECT query['e.reason.message'] AS message, count(*)::BIGINT AS errors
            FROM {P}
            WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
              AND query['event'] = 'error'
              AND query['e.reason.message'] IS NOT NULL
            GROUP BY message ORDER BY errors DESC LIMIT 20
        """),
    })

    # ─── NEW: Cohort retention matrix ─────────────────────────────────────────
    # For each monthly cohort (first-seen month), how many users were active
    # at months 0, 1, 2, … after first visit?
    # Uses anon_id (persistent cookie) — not sessionId (ephemeral per-tab ID).
    write_json(f"{out}/cohort_retention.json", q(f"""
        WITH user_activity AS (
            SELECT
                anon_id,
                date_trunc('month', date)::DATE AS active_month
            FROM {P}
            WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
              AND anon_id IS NOT NULL
              AND anon_id NOT IN ('', '-', 'TODO', 'null', 'None', 'nan')
              AND length(anon_id) >= 4
            GROUP BY 1, 2
        ),
        cohorts AS (
            SELECT anon_id, MIN(active_month) AS cohort_month
            FROM user_activity
            GROUP BY anon_id
        ),
        cohort_sizes AS (
            SELECT cohort_month, count(*) AS cohort_size
            FROM cohorts GROUP BY cohort_month
        ),
        joined AS (
            SELECT
                c.cohort_month,
                ua.active_month,
                datediff('month', c.cohort_month, ua.active_month) AS months_since_first,
                count(DISTINCT ua.anon_id) AS retained_users
            FROM cohorts c
            JOIN user_activity ua USING (anon_id)
            GROUP BY 1, 2, 3
        )
        SELECT
            strftime(j.cohort_month, '%Y-%m') AS cohort_month,
            j.months_since_first,
            j.retained_users AS retained_sessions,
            cs.cohort_size,
            round(100.0 * j.retained_users / cs.cohort_size, 1) AS retention_pct
        FROM joined j
        JOIN cohort_sizes cs ON j.cohort_month = cs.cohort_month
        WHERE j.months_since_first >= 0
        ORDER BY j.cohort_month, j.months_since_first
    """))

    # ─── NEW: Top UI paths broken down by event type ──────────────────────────
    # click/hover/keyboard use query['path'] (UI element path)
    # pageView uses query['e.path'] (URL path)
    # error uses query['e.reason.message'] (error message)
    paths_raw = q(f"""
        SELECT
            query['event'] AS event,
            CASE query['event']
                WHEN 'pageView' THEN query['e.path']
                WHEN 'error'    THEN query['e.reason.message']
                ELSE                 query['path']
            END AS path,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['event'] IN ('click','hover','error','keyboard','pageView')
        GROUP BY event, path
        HAVING path IS NOT NULL
        ORDER BY event, count DESC
    """)
    from collections import defaultdict
    by_event: dict = defaultdict(list)
    for row in paths_raw:
        by_event[row["event"]].append({"path": row["path"], "count": row["count"]})
    write_json(f"{out}/top_paths_by_event.json", {
        evt: rows[:20] for evt, rows in by_event.items()
    })

    # ─── NEW: Tool preference per country ────────────────────────────────────
    write_json(f"{out}/geo_tool_preference.json", q(f"""
        WITH counts AS (
            SELECT c_country, {TOOL_CASE} AS tool, count(*)::BIGINT AS visits
            FROM {P}
            WHERE traffic_type='Likely Human'
              AND site='Apps'
              AND cs_uri_stem IN {TOOL_STEMS}
              AND c_country IS NOT NULL AND c_country NOT IN ('-','')
            GROUP BY c_country, tool
        ),
        totals AS (
            SELECT c_country, SUM(visits)::BIGINT AS total_visits FROM counts GROUP BY c_country
        ),
        ranked AS (
            SELECT c.*, t.total_visits,
                   ROW_NUMBER() OVER (PARTITION BY c.c_country ORDER BY c.visits DESC) AS rn
            FROM counts c JOIN totals t USING (c_country)
        )
        SELECT c_country, tool AS top_tool, visits AS top_tool_visits, total_visits
        FROM ranked WHERE rn = 1
        ORDER BY total_visits DESC LIMIT 30
    """))

    # ─── NEW: Per-country per-tool visit breakdown (wide, for stacked bar) ───
    write_json(f"{out}/geo_tool_breakdown.json", q(f"""
        WITH counts AS (
            SELECT c_country, {TOOL_CASE} AS tool, count(*)::BIGINT AS visits
            FROM {P}
            WHERE traffic_type='Likely Human'
              AND site='Apps'
              AND cs_uri_stem IN {TOOL_STEMS}
              AND c_country IS NOT NULL AND c_country NOT IN ('-','')
            GROUP BY c_country, tool
        ),
        totals AS (
            SELECT c_country, SUM(visits)::BIGINT AS total FROM counts GROUP BY c_country
        )
        SELECT
            c.c_country,
            SUM(CASE WHEN tool='EUI'          THEN visits ELSE 0 END)::BIGINT AS EUI,
            SUM(CASE WHEN tool='RUI'          THEN visits ELSE 0 END)::BIGINT AS RUI,
            SUM(CASE WHEN tool='CDE'          THEN visits ELSE 0 END)::BIGINT AS CDE,
            SUM(CASE WHEN tool='FTU Explorer' THEN visits ELSE 0 END)::BIGINT AS "FTU Explorer",
            SUM(CASE WHEN tool='KG Explorer'  THEN visits ELSE 0 END)::BIGINT AS "KG Explorer",
            t.total
        FROM counts c JOIN totals t USING (c_country)
        GROUP BY c.c_country, t.total
        ORDER BY t.total DESC LIMIT 30
    """))

    # ─── NEW: Bot traffic by country ─────────────────────────────────────────
    write_json(f"{out}/geo_bot_traffic.json", q(f"""
        SELECT
            c_country,
            SUM(CASE WHEN traffic_type IN ('Bot','AI-Assistant / Bot') THEN 1 ELSE 0 END)::BIGINT AS bot_visits,
            count(*)::BIGINT AS total_requests,
            round(100.0 * SUM(CASE WHEN traffic_type IN ('Bot','AI-Assistant / Bot') THEN 1 ELSE 0 END)
                  / count(*), 1) AS bot_pct
        FROM {P}
        WHERE c_country IS NOT NULL AND c_country NOT IN ('-','')
        GROUP BY c_country
        HAVING bot_visits > 100
        ORDER BY bot_visits DESC
        LIMIT 25
    """))

    # ─── NEW: Per-tool hourly event heatmap ───────────────────────────────────
    # Shows which tools get used at which hours of the day.
    # Much richer than the total hourly_traffic.json.
    write_json(f"{out}/tool_hourly_heatmap.json", q(f"""
        SELECT
            {APP_TOOL_CASE} AS tool,
            try_cast(split_part(time, ':', 1) AS INTEGER) AS hour_utc,
            count(*)::BIGINT AS events
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['app'] IS NOT NULL
          AND time IS NOT NULL
        GROUP BY tool, hour_utc
        HAVING tool IS NOT NULL AND hour_utc IS NOT NULL
        ORDER BY tool, hour_utc
    """))

    # ─── NEW: Visits by day of week per tool ─────────────────────────────────
    write_json(f"{out}/traffic_by_dow.json", q(f"""
        SELECT
            dayofweek(date) AS dow_num,
            strftime(date, '%A') AS day_name,
            {TOOL_CASE} AS tool,
            count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND site='Apps'
          AND cs_uri_stem IN {TOOL_STEMS}
        GROUP BY dow_num, day_name, tool
        ORDER BY dow_num, tool
    """))

    # ─── NEW: Monthly error trend by tool ────────────────────────────────────
    error_by_tool = q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            COALESCE({APP_TOOL_CASE}, 'Unknown') AS tool,
            count(*)::BIGINT AS errors
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['event'] = 'error'
        GROUP BY month_year, tool
        ORDER BY month_year, tool
    """)
    error_by_month = q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            count(*)::BIGINT AS total_errors
        FROM {P}
        WHERE site='Events' AND cs_uri_stem='/tr' AND traffic_type='Likely Human'
          AND query['event'] = 'error'
        GROUP BY month_year ORDER BY month_year
    """)
    write_json(f"{out}/monthly_error_trend.json", {
        "by_tool": error_by_tool,
        "by_month": error_by_month,
    })

    # ─── NEW: Human request type breakdown (for Sankey infra bifurcation) ──────
    # Categorises every human CloudFront row that is NOT an event ping (/tr)
    # by the type of asset being fetched, so the Sankey can split "Infra Requests"
    # into meaningful sub-nodes (JS bundles, API calls, fonts, etc.)
    write_json(f"{out}/request_type_breakdown.json", q(f"""
        SELECT
            CASE
                WHEN cs_uri_stem LIKE '%.js'
                  OR cs_uri_stem LIKE '%.js.map'       THEN 'JS Bundles'
                WHEN cs_uri_stem LIKE '%.css'
                  OR cs_uri_stem LIKE '%.css.map'      THEN 'Stylesheets'
                WHEN cs_uri_stem LIKE '%.woff'
                  OR cs_uri_stem LIKE '%.woff2'
                  OR cs_uri_stem LIKE '%.ttf'
                  OR cs_uri_stem LIKE '%.otf'
                  OR cs_uri_stem LIKE '%.eot'          THEN 'Fonts'
                WHEN cs_uri_stem LIKE '/api/%'
                  OR cs_uri_stem LIKE '%.graphql'      THEN 'API Calls'
                WHEN cs_uri_stem LIKE '%.json'
                  OR cs_uri_stem LIKE '%.geojson'      THEN 'Data Files'
                WHEN cs_uri_stem LIKE '%.png'
                  OR cs_uri_stem LIKE '%.jpg'
                  OR cs_uri_stem LIKE '%.jpeg'
                  OR cs_uri_stem LIKE '%.svg'
                  OR cs_uri_stem LIKE '%.ico'
                  OR cs_uri_stem LIKE '%.webp'         THEN 'Images'
                WHEN cs_uri_stem LIKE '%.html'
                  OR cs_uri_stem = '/'
                  OR cs_uri_stem LIKE '%/'             THEN 'HTML Pages'
                ELSE                                        'Other'
            END AS request_type,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE traffic_type = 'Likely Human'
          AND cs_uri_stem != '/tr'
        GROUP BY request_type
        ORDER BY count DESC
    """))

    total = len(os.listdir(out))
    print(f"\nAll done — {total} files in {out}/")


def parse_args():
    p = argparse.ArgumentParser(description="Generate dashboard JSON files from HRA parquet logs (DuckDB)")
    p.add_argument("--parquet", default=PARQUET_DEFAULT, help="Path to source parquet")
    p.add_argument("--out",     default=OUT_DEFAULT,     help="Output directory for JSON files")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if not os.path.exists(args.parquet):
        raise FileNotFoundError(f"Parquet not found: {args.parquet}")
    run(args.parquet, args.out)
