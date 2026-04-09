#!/usr/bin/env python3
"""
DuckDB-native data pipeline for CNS (cns.iu.edu) Analytics Dashboard.

Reads CloudFront parquet logs for the CNS research group website and generates
JSON aggregation files for the Next.js dashboard.

Usage:
    python data_processing/generate_cns_data.py
    python data_processing/generate_cns_data.py --parquet data/cns/2026-04-06_cns-logs.parquet --out public/data/cns
"""

import json
import os
import argparse
from pathlib import Path

import duckdb

def _latest_parquet(directory: str, pattern: str = "*.parquet") -> str:
    import glob
    files = sorted(glob.glob(os.path.join(directory, pattern)), key=os.path.getmtime, reverse=True)
    return files[0] if files else ""

PARQUET_DEFAULT = _latest_parquet("data/cns") or "data/cns/2026-04-06_cns-logs.parquet"
OUT_DEFAULT = "public/data/cns"

# Filter out static assets from page-level analysis
ASSET_FILTER = r"""
    AND NOT regexp_matches(cs_uri_stem, '\.(js|css|svg|png|ico|woff2?|ttf|jpe?g|gif|webp|xml|json|map|php|txt)$')
    AND cs_uri_stem != '/robots.txt'
    AND cs_uri_stem != '/favicon.ico'
    AND cs_uri_stem != '/'
    AND cs_uri_stem != '//'
    AND cs_uri_stem != ''
"""

# Categorize content by URI path
CONTENT_CASE = """CASE
    WHEN cs_uri_stem LIKE '/docs/publications/%.pdf' THEN 'Publications'
    WHEN cs_uri_stem LIKE '/docs/presentations/%.pdf' THEN 'Presentations'
    WHEN cs_uri_stem LIKE '/docs/news/%.pdf' THEN 'News'
    WHEN cs_uri_stem LIKE '/workshops/%' THEN 'Workshops'
    WHEN cs_uri_stem LIKE '/images/people/%' THEN 'Team Photos'
    WHEN cs_uri_stem = '/current_team.html' OR cs_uri_stem LIKE '%team%' OR cs_uri_stem LIKE '%member%' THEN 'Team Pages'
    WHEN cs_uri_stem = '/publications.html' THEN 'Publications Page'
    WHEN cs_uri_stem = '/presentations.html' THEN 'Presentations Page'
    WHEN cs_uri_stem = '/contact.html' THEN 'Contact'
    WHEN cs_uri_stem = '/jobs.html' THEN 'Jobs'
    WHEN cs_uri_stem LIKE '%.pdf' THEN 'Other PDFs'
    WHEN cs_uri_stem = '/' OR cs_uri_stem = '/index.php' OR cs_uri_stem = '/home.html' OR cs_uri_stem = '/home/panel' THEN 'Homepage'
    WHEN cs_uri_stem = '/deadlink.html' THEN 'Dead Link Redirects'
    WHEN cs_uri_stem LIKE '/+CSCOT+/%' OR cs_uri_stem = '/wp-login.php' OR cs_uri_stem LIKE '/cgi-bin/%' OR cs_uri_stem LIKE '/scripts/%' THEN 'Scanner/Probe Traffic'
    ELSE 'Other Pages'
END"""

# Referrer domain extraction
REFERRER_DOMAIN = """CASE
    WHEN referrer IS NULL OR referrer = '-' OR referrer = '' THEN 'Direct'
    WHEN referrer LIKE '%google.com%' AND referrer LIKE '%scholar%' THEN 'Google Scholar'
    WHEN referrer LIKE '%google.%' THEN 'Google'
    WHEN referrer LIKE '%bing.com%' THEN 'Bing'
    WHEN referrer LIKE '%duckduckgo%' THEN 'DuckDuckGo'
    WHEN referrer LIKE '%yandex%' THEN 'Yandex'
    WHEN referrer LIKE '%cns.iu.edu%' OR referrer LIKE '%cns.slis%' OR referrer LIKE '%cns.ils%' THEN 'Self (CNS)'
    WHEN referrer LIKE '%cns-iu.github.io%' THEN 'CNS GitHub'
    WHEN referrer LIKE '%humanatlas%' THEN 'HRA Portal'
    WHEN referrer LIKE '%hubmap%' THEN 'HuBMAP'
    WHEN referrer LIKE '%scimaps.org%' THEN 'Sci-Maps'
    WHEN referrer LIKE '%indiana.edu%' THEN 'IU (other)'
    WHEN referrer LIKE '%${jndi%' OR referrer LIKE '%<script%' THEN 'Attack/Injection'
    ELSE 'Other'
END"""

# Security signal detection
SECURITY_CASE = """CASE
    WHEN cs_uri_query LIKE '%jndi%' OR cs_Referer LIKE '%${jndi%' THEN 'Log4Shell (JNDI injection)'
    WHEN cs_uri_stem = '/wp-login.php' OR cs_uri_stem LIKE '/wp-admin%' OR cs_uri_stem LIKE '/wordpress%' THEN 'WordPress brute force'
    WHEN cs_uri_query LIKE '%sql%injection%' OR cs_uri_query LIKE '%SELECT%FROM%' OR cs_uri_query LIKE '%UNION%SELECT%' THEN 'SQL injection'
    WHEN cs_uri_query LIKE '%<script%' OR cs_uri_query LIKE '%alert(%' THEN 'XSS attempt'
    WHEN cs_uri_query LIKE '%/etc/passwd%' OR cs_uri_query LIKE '%boot.ini%' THEN 'Path traversal'
    WHEN cs_uri_stem LIKE '%/admin%' OR cs_uri_stem LIKE '%/manager%' OR cs_uri_stem LIKE '%/console%' THEN 'Admin panel probe'
    WHEN cs_uri_stem LIKE '%.env' OR cs_uri_stem LIKE '%config.php%' OR cs_uri_stem LIKE '%/debug%' THEN 'Config/debug probe'
    ELSE NULL
END"""


def write_json(path: str, data: object) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=True)
    print(f"  \u2713 {os.path.basename(path)}")


def run(parquet: str, out: str) -> None:
    os.makedirs(out, exist_ok=True)
    con = duckdb.connect()
    con.execute("PRAGMA threads=4")

    # Deduplicate parquet on load
    raw_count = con.execute(f"SELECT count(*) FROM read_parquet('{parquet}')").fetchone()[0]
    con.execute(f"CREATE TEMP VIEW logs AS SELECT DISTINCT * FROM read_parquet('{parquet}')")
    deduped_count = con.execute("SELECT count(*) FROM logs").fetchone()[0]
    dupes = raw_count - deduped_count
    if dupes > 0:
        print(f"\u26a0 Removed {dupes:,} duplicate rows ({dupes/raw_count*100:.2f}%) \u2014 {deduped_count:,} rows remain")
    P = "logs"

    def q(sql: str):
        return con.execute(sql).df().to_dict(orient="records")

    # ─── 0. Metadata ─────────────────────────────────────────────────────────
    date_range = con.execute(f"""
        SELECT
            MIN(date)::VARCHAR AS first_date,
            MAX(date)::VARCHAR AS last_date,
            count(*)::BIGINT AS total_rows
        FROM {P}
    """).fetchone()
    write_json(f"{out}/cns_data_metadata.json", {
        "first_date": date_range[0],
        "last_date": date_range[1],
        "total_rows": date_range[2],
    })

    # ─── 1. Traffic types ─────────────────────────────────────────────────────
    write_json(f"{out}/cns_traffic_types.json", q(f"""
        SELECT traffic_type AS type, count(*)::BIGINT AS count
        FROM {P}
        WHERE traffic_type IS NOT NULL
        GROUP BY traffic_type ORDER BY count DESC
    """))

    # ─── 2. Monthly visits (human/bot/AI) ─────────────────────────────────────
    write_json(f"{out}/cns_monthly_visits.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            SUM(CASE WHEN traffic_type='Likely Human' THEN 1 ELSE 0 END)::BIGINT AS human,
            SUM(CASE WHEN traffic_type='Bot' THEN 1 ELSE 0 END)::BIGINT AS bot,
            SUM(CASE WHEN traffic_type='AI-Assistant / Bot' THEN 1 ELSE 0 END)::BIGINT AS ai_bot,
            count(*)::BIGINT AS total
        FROM {P}
        WHERE date >= '2015-01-01'
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 3. Yearly visits ─────────────────────────────────────────────────────
    write_json(f"{out}/cns_yearly_visits.json", q(f"""
        SELECT
            year AS year,
            SUM(CASE WHEN traffic_type='Likely Human' THEN 1 ELSE 0 END)::BIGINT AS human,
            SUM(CASE WHEN traffic_type='Bot' THEN 1 ELSE 0 END)::BIGINT AS bot,
            SUM(CASE WHEN traffic_type='AI-Assistant / Bot' THEN 1 ELSE 0 END)::BIGINT AS ai_bot,
            count(*)::BIGINT AS total
        FROM {P}
        WHERE CAST(year AS INTEGER) >= 2015
        GROUP BY year ORDER BY year
    """))

    # ─── 4. Hourly traffic ────────────────────────────────────────────────────
    write_json(f"{out}/cns_hourly_traffic.json", q(f"""
        SELECT
            try_cast(split_part(time, ':', 1) AS INTEGER) AS hour,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE traffic_type='Likely Human' AND time IS NOT NULL
        GROUP BY hour
        HAVING hour IS NOT NULL
        ORDER BY hour
    """))

    # ─── 5. Day of week ──────────────────────────────────────────────────────
    write_json(f"{out}/cns_traffic_by_dow.json", q(f"""
        SELECT
            dayofweek(date) AS dow_num,
            dayname(date) AS day_name,
            count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
        GROUP BY dow_num, day_name
        ORDER BY dow_num
    """))

    # ─── 6. Geographic distribution ───────────────────────────────────────────
    write_json(f"{out}/cns_geo_distribution.json", q(f"""
        SELECT c_country, count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND c_country IS NOT NULL AND c_country NOT IN ('-', '')
        GROUP BY c_country ORDER BY visits DESC
    """))

    # ─── 7. Geo bot traffic ──────────────────────────────────────────────────
    write_json(f"{out}/cns_geo_bot_traffic.json", q(f"""
        SELECT
            c_country,
            SUM(CASE WHEN traffic_type IN ('Bot','AI-Assistant / Bot') THEN 1 ELSE 0 END)::BIGINT AS bot_visits,
            count(*)::BIGINT AS total_requests,
            round(100.0 * SUM(CASE WHEN traffic_type IN ('Bot','AI-Assistant / Bot') THEN 1 ELSE 0 END)
                  / count(*), 1) AS bot_pct
        FROM {P}
        WHERE c_country IS NOT NULL AND c_country NOT IN ('-', '')
        GROUP BY c_country
        HAVING total_requests > 100
        ORDER BY bot_visits DESC
        LIMIT 30
    """))

    # ─── 8. Top pages (no static assets, no probes/scanners) ──────────────────
    write_json(f"{out}/cns_top_pages.json", q(f"""
        SELECT cs_uri_stem AS page, count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
          {ASSET_FILTER}
          AND cs_uri_stem != '/deadlink.html'
          AND NOT cs_uri_stem LIKE '/+CSCOT+/%'
          AND cs_uri_stem != '/wp-login.php'
          AND NOT cs_uri_stem LIKE '/wp-admin%'
          AND NOT cs_uri_stem LIKE '/cgi-bin/%'
          AND NOT cs_uri_stem LIKE '/scripts/%'
          AND NOT cs_uri_stem LIKE '%@%'
        GROUP BY cs_uri_stem ORDER BY visits DESC LIMIT 30
    """))

    # ─── 9. Top PDF downloads ─────────────────────────────────────────────────
    write_json(f"{out}/cns_top_pdfs.json", q(f"""
        SELECT
            cs_uri_stem AS pdf,
            {CONTENT_CASE} AS category,
            count(*)::BIGINT AS downloads
        FROM {P}
        WHERE traffic_type='Likely Human' AND cs_uri_stem LIKE '%.pdf'
        GROUP BY pdf, category ORDER BY downloads DESC LIMIT 30
    """))

    # ─── 10. PDF downloads monthly trend ──────────────────────────────────────
    write_json(f"{out}/cns_pdf_monthly.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            count(*)::BIGINT AS downloads
        FROM {P}
        WHERE traffic_type='Likely Human' AND cs_uri_stem LIKE '%.pdf'
          AND date >= '2018-01-01'
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 11. Content type breakdown (exclude catch-all "Other Pages") ─────────
    write_json(f"{out}/cns_content_breakdown.json", q(f"""
        SELECT type, count
        FROM (
            SELECT
                {CONTENT_CASE} AS type,
                count(*)::BIGINT AS count
            FROM {P}
            WHERE traffic_type='Likely Human'
              AND cs_uri_stem != '/' AND cs_uri_stem != '//' AND cs_uri_stem != ''
            GROUP BY type
        )
        WHERE type != 'Other Pages'
        ORDER BY count DESC
    """))

    # ─── 12. Workshop pages (readable labels, no emails/php) ──────────────────
    write_json(f"{out}/cns_workshop_pages.json", q(f"""
        SELECT label AS page, SUM(visits)::BIGINT AS visits
        FROM (
            SELECT
                cs_uri_stem,
                count(*)::BIGINT AS visits,
                CASE
                    WHEN cs_uri_stem = '/workshops.html' THEN 'Workshops (index)'
                    WHEN cs_uri_stem = '/events_calendar.html' THEN 'Events Calendar'
                    WHEN regexp_matches(cs_uri_stem, '/workshops/event/\\d{{6}}\\.html')
                        THEN CASE CAST(substr(split_part(cs_uri_stem, '/', 4), 3, 2) AS INTEGER)
                            WHEN 1 THEN 'Jan'  WHEN 2 THEN 'Feb'  WHEN 3 THEN 'Mar'
                            WHEN 4 THEN 'Apr'  WHEN 5 THEN 'May'  WHEN 6 THEN 'Jun'
                            WHEN 7 THEN 'Jul'  WHEN 8 THEN 'Aug'  WHEN 9 THEN 'Sep'
                            WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
                            ELSE 'Unk'
                        END || ' 20' || substr(split_part(cs_uri_stem, '/', 4), 1, 2) || ' Workshop'
                    WHEN cs_uri_stem LIKE '/workshops/%' THEN replace(replace(cs_uri_stem, '/workshops/', ''), '.html', '')
                    ELSE cs_uri_stem
                END AS label
            FROM {P}
            WHERE traffic_type='Likely Human'
              AND (cs_uri_stem LIKE '/workshops/%' OR cs_uri_stem = '/workshops.html'
                   OR cs_uri_stem = '/events_calendar.html')
              AND NOT regexp_matches(cs_uri_stem, '\\.(png|jpg|gif|css|js|php)$')
              AND NOT cs_uri_stem LIKE '%@%'
            GROUP BY cs_uri_stem
        )
        GROUP BY label ORDER BY visits DESC LIMIT 20
    """))

    # ─── 13. Team page views ──────────────────────────────────────────────────
    write_json(f"{out}/cns_team_pages.json", q(f"""
        SELECT
            CASE
                WHEN cs_uri_stem = '/current_team.html' THEN 'Current Team (index)'
                WHEN cs_uri_stem LIKE '/images/people/%.png' OR cs_uri_stem LIKE '/images/people/%.jpg'
                    THEN regexp_replace(split_part(cs_uri_stem, '/', 4), '\\.(png|jpg)', '')
                ELSE cs_uri_stem
            END AS member,
            count(*)::BIGINT AS visits
        FROM {P}
        WHERE traffic_type='Likely Human'
          AND (cs_uri_stem LIKE '%team%' OR cs_uri_stem LIKE '/images/people/%'
               OR cs_uri_stem = '/current_team.html')
        GROUP BY member ORDER BY visits DESC LIMIT 25
    """))

    # ─── 14. Referrer domains ─────────────────────────────────────────────────
    write_json(f"{out}/cns_referrers.json", q(f"""
        SELECT
            {REFERRER_DOMAIN} AS domain,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE traffic_type='Likely Human'
        GROUP BY domain ORDER BY count DESC
    """))

    # ─── 15. Referrer trend (monthly, top sources) ────────────────────────────
    write_json(f"{out}/cns_referrer_trend.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            SUM(CASE WHEN {REFERRER_DOMAIN} = 'Google' THEN 1 ELSE 0 END)::BIGINT AS google,
            SUM(CASE WHEN {REFERRER_DOMAIN} = 'Google Scholar' THEN 1 ELSE 0 END)::BIGINT AS scholar,
            SUM(CASE WHEN {REFERRER_DOMAIN} = 'Bing' THEN 1 ELSE 0 END)::BIGINT AS bing,
            SUM(CASE WHEN {REFERRER_DOMAIN} = 'Direct' THEN 1 ELSE 0 END)::BIGINT AS direct,
            SUM(CASE WHEN {REFERRER_DOMAIN} NOT IN ('Google','Google Scholar','Bing','Direct','Self (CNS)','Attack/Injection') THEN 1 ELSE 0 END)::BIGINT AS other
        FROM {P}
        WHERE traffic_type='Likely Human' AND date >= '2018-01-01'
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 16. HTTP status codes ────────────────────────────────────────────────
    write_json(f"{out}/cns_http_status.json", q(f"""
        SELECT sc_status AS status, count(*)::BIGINT AS count
        FROM {P}
        GROUP BY sc_status ORDER BY count DESC
    """))

    # ─── 17. Monthly errors ──────────────────────────────────────────────────
    write_json(f"{out}/cns_monthly_errors.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            SUM(CASE WHEN sc_status = 404 THEN 1 ELSE 0 END)::BIGINT AS s404,
            SUM(CASE WHEN sc_status = 500 THEN 1 ELSE 0 END)::BIGINT AS s500,
            SUM(CASE WHEN sc_status = 403 THEN 1 ELSE 0 END)::BIGINT AS s403,
            SUM(CASE WHEN sc_status >= 400 THEN 1 ELSE 0 END)::BIGINT AS total_errors
        FROM {P}
        WHERE date >= '2018-01-01'
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 18. Top 404 paths ───────────────────────────────────────────────────
    write_json(f"{out}/cns_top_404s.json", q(f"""
        SELECT cs_uri_stem AS path, count(*)::BIGINT AS count
        FROM {P}
        WHERE sc_status = 404
          AND NOT regexp_matches(cs_uri_stem, '\\.(png|jpg|gif|css|js|ico|svg|woff2?|ttf)$')
        GROUP BY cs_uri_stem ORDER BY count DESC LIMIT 20
    """))

    # ─── 19. Top 500 error paths ──────────────────────────────────────────────
    write_json(f"{out}/cns_top_500s.json", q(f"""
        SELECT cs_uri_stem AS path, count(*)::BIGINT AS count
        FROM {P}
        WHERE sc_status >= 500
          AND NOT regexp_matches(cs_uri_stem, '\\.(png|jpg|gif|css|js|ico|svg|woff2?|ttf)$')
        GROUP BY cs_uri_stem ORDER BY count DESC LIMIT 20
    """))

    # ─── 20. Dead link targets ────────────────────────────────────────────────
    write_json(f"{out}/cns_dead_links.json", q(f"""
        SELECT
            cs_uri_query AS url,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE cs_uri_stem = '/deadlink.html'
          AND cs_uri_query IS NOT NULL AND cs_uri_query NOT IN ('-', '')
        GROUP BY cs_uri_query ORDER BY count DESC LIMIT 20
    """))

    # ─── 21. Security signals ─────────────────────────────────────────────────
    write_json(f"{out}/cns_security_signals.json", q(f"""
        SELECT
            {SECURITY_CASE} AS signal_type,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE {SECURITY_CASE} IS NOT NULL
        GROUP BY signal_type ORDER BY count DESC
    """))

    # ─── 22. Bot trend over time ──────────────────────────────────────────────
    write_json(f"{out}/cns_bot_trend.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            SUM(CASE WHEN traffic_type='Likely Human' THEN 1 ELSE 0 END)::BIGINT AS human,
            SUM(CASE WHEN traffic_type='Bot' THEN 1 ELSE 0 END)::BIGINT AS bot,
            SUM(CASE WHEN traffic_type='AI-Assistant / Bot' THEN 1 ELSE 0 END)::BIGINT AS ai_bot
        FROM {P}
        WHERE date >= '2018-01-01'
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 23. Cache / CDN response performance ──────────────────────────────────
    # x_edge_result_type is NULL in this parquet — derive from HTTP status codes
    write_json(f"{out}/cns_cache_performance.json", q(f"""
        SELECT
            CASE
                WHEN sc_status BETWEEN 200 AND 299 THEN 'Hit'
                WHEN sc_status = 304 THEN 'RefreshHit'
                WHEN sc_status BETWEEN 300 AND 399 THEN 'Redirect'
                WHEN sc_status BETWEEN 400 AND 499 THEN 'Miss'
                WHEN sc_status >= 500 THEN 'Error'
                ELSE 'Other'
            END AS result_type,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE sc_status IS NOT NULL
        GROUP BY result_type ORDER BY count DESC
    """))

    # ─── 24. Error categories (actionable buckets) ─────────────────────────
    write_json(f"{out}/cns_error_categories.json", q(f"""
        SELECT
            CASE
                WHEN sc_status = 404 AND (cs_uri_stem LIKE '%wp-login%' OR cs_uri_stem LIKE '%wp-admin%'
                    OR cs_uri_stem LIKE '%xmlrpc%' OR cs_uri_stem LIKE '%.env%'
                    OR cs_uri_stem LIKE '%/admin%' OR cs_uri_stem LIKE '%/manager%'
                    OR cs_uri_stem LIKE '%/console%' OR cs_uri_stem LIKE '%config%'
                    OR cs_uri_stem LIKE '%/debug%') THEN 'Scanner/Attack Probes (404)'
                WHEN sc_status = 404 AND cs_uri_stem LIKE '%.pdf' THEN 'Missing PDFs (404)'
                WHEN sc_status = 404 AND (cs_uri_stem LIKE '/workshops/%' OR cs_uri_stem LIKE '/events%') THEN 'Moved Workshop/Event Pages (404)'
                WHEN sc_status = 404 AND cs_uri_stem LIKE '/images/%' THEN 'Missing Images (404)'
                WHEN sc_status = 404 AND cs_uri_stem LIKE '/docs/%' THEN 'Missing Documents (404)'
                WHEN sc_status = 404 THEN 'Other Broken Links (404)'
                WHEN sc_status >= 500 AND (cs_uri_stem LIKE '%wp-%' OR cs_uri_stem LIKE '%.php'
                    OR cs_uri_stem LIKE '%/cgi-bin/%' OR cs_uri_stem LIKE '%/scripts/%') THEN 'Scanner-Triggered Server Errors (500)'
                WHEN sc_status >= 500 AND cs_uri_stem = '/' THEN 'Homepage Server Errors (500)'
                WHEN sc_status >= 500 THEN 'Other Server Errors (500)'
                WHEN sc_status = 403 THEN 'Access Denied (403)'
                ELSE 'Other HTTP Errors'
            END AS category,
            sc_status AS status,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE sc_status >= 400
        GROUP BY category, status
        ORDER BY count DESC
    """))

    # ─── 25. Monthly error rate ──────────────────────────────────────────────
    write_json(f"{out}/cns_monthly_error_rate.json", q(f"""
        SELECT
            strftime(date_trunc('month', date)::DATE, '%Y-%m') AS month_year,
            count(*)::BIGINT AS total,
            SUM(CASE WHEN sc_status >= 400 THEN 1 ELSE 0 END)::BIGINT AS errors,
            round(100.0 * SUM(CASE WHEN sc_status >= 400 THEN 1 ELSE 0 END) / count(*), 2) AS error_rate
        FROM {P}
        WHERE date >= '2018-01-01'
        GROUP BY month_year ORDER BY month_year
    """))

    # ─── 26. Top error paths by month (for drilldown panel) ──────────────────
    error_rows = q(f"""
        SELECT
            year || '-' || lpad(month, 2, '0') AS mo,
            cs_uri_stem AS path,
            sc_status::INTEGER AS status,
            CASE
                WHEN sc_status = 404 AND (cs_uri_stem LIKE '%wp-login%' OR cs_uri_stem LIKE '%wp-admin%'
                    OR cs_uri_stem LIKE '%xmlrpc%' OR cs_uri_stem LIKE '%.env%'
                    OR cs_uri_stem LIKE '%/admin%' OR cs_uri_stem LIKE '%/manager%'
                    OR cs_uri_stem LIKE '%/console%' OR cs_uri_stem LIKE '%config%'
                    OR cs_uri_stem LIKE '%/debug%') THEN 'Scanner Probe'
                WHEN sc_status = 404 AND cs_uri_stem LIKE '%.pdf' THEN 'Missing PDF'
                WHEN sc_status = 404 AND (cs_uri_stem LIKE '/workshops/%' OR cs_uri_stem LIKE '/events%') THEN 'Moved Page'
                WHEN sc_status = 404 AND cs_uri_stem LIKE '/images/%' THEN 'Missing Image'
                WHEN sc_status = 404 AND cs_uri_stem LIKE '/docs/%' THEN 'Missing Doc'
                WHEN sc_status = 404 THEN 'Broken Link'
                WHEN sc_status >= 500 AND (cs_uri_stem LIKE '%wp-%' OR cs_uri_stem LIKE '%.php'
                    OR cs_uri_stem LIKE '%/cgi-bin/%' OR cs_uri_stem LIKE '%/scripts/%') THEN 'Scanner Probe'
                WHEN sc_status >= 500 AND cs_uri_stem = '/' THEN 'Homepage Error'
                WHEN sc_status >= 500 THEN 'Server Error'
                WHEN sc_status = 403 THEN 'Access Denied'
                ELSE 'Other'
            END AS category,
            count(*)::BIGINT AS count
        FROM {P}
        WHERE sc_status >= 400
        GROUP BY mo, path, status, category
        ORDER BY mo, count DESC
    """)
    # Build per-month top 10 and all-time top 15 in Python
    from collections import defaultdict
    by_month_map = defaultdict(list)
    all_time_map = defaultdict(lambda: {"path": "", "status": 0, "count": 0, "category": ""})
    for r in error_rows:
        mo = r["mo"]
        key = (r["path"], r["status"])
        by_month_map[mo].append({"path": r["path"], "status": r["status"], "count": r["count"], "category": r["category"]})
        existing = all_time_map[key]
        if existing["count"] == 0:
            all_time_map[key] = {"path": r["path"], "status": r["status"], "count": r["count"], "category": r["category"]}
        else:
            existing["count"] += r["count"]
    by_month_out = {}
    for mo, rows in sorted(by_month_map.items()):
        by_month_out[mo] = sorted(rows, key=lambda x: -x["count"])[:10]
    all_time_list = sorted(all_time_map.values(), key=lambda x: -x["count"])[:15]
    write_json(f"{out}/cns_top_errors_by_month.json", {"all_time": all_time_list, "by_month": by_month_out})

    total = len([f for f in os.listdir(out) if f.endswith(".json")])
    print(f"\nAll done \u2014 {total} files in {out}/")


def parse_args():
    p = argparse.ArgumentParser(description="Generate CNS dashboard JSON files from CloudFront parquet logs")
    p.add_argument("--parquet", default=PARQUET_DEFAULT, help="Path to source parquet")
    p.add_argument("--out", default=OUT_DEFAULT, help="Output directory")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    print(f"CNS data pipeline: {args.parquet} \u2192 {args.out}/")
    run(args.parquet, args.out)
