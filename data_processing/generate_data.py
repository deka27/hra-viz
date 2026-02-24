# data_processing/generate_data.py
import pandas as pd
import json
import os
import re
from urllib.parse import parse_qs

# Load data
print("Loading parquet...")
df = pd.read_parquet('data/2026-01-13_hra-logs.parquet')

# Filter human traffic, exclude CDN
df_human = df[
    (df['traffic_type'] == 'Likely Human') &
    (df['site'] != 'CDN')
].copy()

# Apps data
df_apps = df_human[df_human['site'] == 'Apps'].copy()
static_extensions = ['.js', '.css', '.svg', '.png', '.ico', '.woff2', '.woff', '.ttf', '.jpg', '.jpeg', '.webp']
def is_static(uri):
    return any(uri.endswith(ext) for ext in static_extensions)
df_apps_clean = df_apps[~df_apps['cs_uri_stem'].apply(is_static)].copy()

# Events data — filter to tracker endpoint
df_events = df_human[df_human['site'] == 'Events'].copy()
df_events_tr = df_events[df_events['cs_uri_stem'] == '/tr'].copy()

# Parse basic event fields from cs_uri_query string (original method, kept for back-compat)
def extract_event_fields(query_str):
    try:
        params = parse_qs(query_str, keep_blank_values=True)
        return {
            'event': params.get('event', [None])[0],
            'app':   params.get('app',   [None])[0],
            'path':  params.get('path',  [None])[0],
            'trigger': params.get('trigger', [None])[0],
        }
    except:
        return {'event': None, 'app': None, 'path': None, 'trigger': None}

events_parsed = df_events_tr['cs_uri_query'].apply(extract_event_fields).apply(pd.Series)
df_events_tr = pd.concat([df_events_tr.reset_index(drop=True), events_parsed], axis=1)

# Parse richer event fields from pre-parsed query tuples (more accurate than parse_qs)
def parse_extra_event_fields(q):
    if not isinstance(q, list):
        return {
            'e_label': None, 'e_value': None, 'e_tab': None,
            'e_action': None, 'e_anon_id': None, 'e_session_id': None,
        }
    d = {k: v for k, v in q if isinstance(k, str) and isinstance(v, str)}
    return {
        'e_label':      d.get('e.label'),
        'e_value':      d.get('e.value'),
        'e_tab':        d.get('e.tab'),
        'e_action':     d.get('e.action'),
        'e_anon_id':    d.get('e.anon_id'),
        'e_session_id': d.get('sessionId'),
    }

extra_fields = df_events_tr['query'].apply(parse_extra_event_fields).apply(pd.Series)
df_events_tr = pd.concat([df_events_tr, extra_fields], axis=1)

# Output folder
out = 'public/data'
os.makedirs(out, exist_ok=True)

# ── ORIGINAL EXTRACTIONS (1–10) ────────────────────────────────────────────

# ---- 1. Tool visits by year ----
tool_map = {
    '/eui/':          'EUI',
    '/rui/':          'RUI',
    '/cde/':          'CDE',
    '/ftu-explorer/': 'FTU Explorer',
    '/kg-explorer/':  'KG Explorer',
}
tool_rows = df_apps[df_apps['cs_uri_stem'].isin(tool_map.keys())].copy()
tool_rows['tool'] = tool_rows['cs_uri_stem'].map(tool_map)
tool_by_year = tool_rows.groupby(['year', 'tool']).size().unstack(fill_value=0).reset_index()
tool_by_year.to_json(f'{out}/tool_visits_by_year.json', orient='records')
print("✓ tool_visits_by_year.json")

# ---- 2. Tool visits by month ----
tool_rows['month_year'] = pd.to_datetime(tool_rows['date']).dt.to_period('M').astype(str)
tool_by_month = tool_rows.groupby(['month_year', 'tool']).size().unstack(fill_value=0).reset_index()
tool_by_month.to_json(f'{out}/tool_visits_by_month.json', orient='records')
print("✓ tool_visits_by_month.json")

# ---- 3. Total tool visits ----
total_visits = tool_rows.groupby('tool').size().reset_index(name='visits')
total_visits.to_json(f'{out}/total_tool_visits.json', orient='records')
print("✓ total_tool_visits.json")

# ---- 4. Event types distribution ----
event_types = df_events_tr['event'].value_counts().reset_index()
event_types.columns = ['event', 'count']
event_types.to_json(f'{out}/event_types.json', orient='records')
print("✓ event_types.json")

# ---- 5. Top UI paths ----
top_paths = df_events_tr['path'].value_counts().head(20).reset_index()
top_paths.columns = ['path', 'count']
top_paths.to_json(f'{out}/top_ui_paths.json', orient='records')
print("✓ top_ui_paths.json")

# ---- 6. Opacity interactions ----
opacity = df_events_tr[df_events_tr['path'].str.contains('opaci', case=False, na=False)]
opacity_counts = opacity['path'].value_counts().reset_index()
opacity_counts.columns = ['path', 'count']
opacity_counts.to_json(f'{out}/opacity_interactions.json', orient='records')
print("✓ opacity_interactions.json")

# ---- 7. Spatial search interactions ----
spatial = df_events_tr[df_events_tr['path'].str.contains('spatial', case=False, na=False)]
spatial_counts = spatial['path'].value_counts().reset_index()
spatial_counts.columns = ['path', 'count']
spatial_counts.to_json(f'{out}/spatial_search.json', orient='records')
print("✓ spatial_search.json")

# ---- 8. Geographic distribution ----
tool_visits_geo = tool_rows.groupby('c_country').size().reset_index(name='visits')
tool_visits_geo = tool_visits_geo.sort_values('visits', ascending=False)
tool_visits_geo.to_json(f'{out}/geo_distribution.json', orient='records')
print("✓ geo_distribution.json")

# ---- 9. Traffic type breakdown ----
traffic = df['traffic_type'].value_counts().reset_index()
traffic.columns = ['type', 'count']
traffic.to_json(f'{out}/traffic_types.json', orient='records')
print("✓ traffic_types.json")

# ---- 10. CDE workflow funnel ----
cde_all = df_events_tr[df_events_tr['app'] == 'cde-ui']
cde_paths = cde_all['path'].value_counts().head(15).reset_index()
cde_paths.columns = ['path', 'count']
cde_paths.to_json(f'{out}/cde_workflow.json', orient='records')
print("✓ cde_workflow.json")

# ── NEW EXTRACTIONS (11–18) ────────────────────────────────────────────────

# ---- 11. External referrer ecosystem ----
# Aggregate inbound requests by partner ecosystem (excludes HRA self-referrals & dev)
def _group_referrer(domain):
    if domain is None:                                                   return None
    if 'gtexportal.org' in domain:                                       return 'GTEx Portal'
    if 'hubmapconsortium.org' in domain or \
       'hubmapconsortium.github.io' in domain:                           return 'HubMAP'
    if 'ebi.ac.uk' in domain:                                            return 'EBI'
    if 'sennetconsortium.org' in domain:                                 return 'SenNet'
    if 'vitessce.io' in domain:                                          return 'Vitessce'
    if 'google.com' in domain:                                           return 'Google'
    # Exclude HRA self-referrals, localhost, CloudFront CDN hops
    if 'humanatlas.io' in domain or 'localhost' in domain \
       or 'cloudfront.net' in domain:                                    return None
    return None

if 'cs_referer' in df.columns:
    ref_series = df['cs_referer'].dropna()
    ref_series = ref_series[~ref_series.isin(['-', ''])]

    def _extract_domain(url):
        m = re.match(r'https?://([^/]+)', str(url))
        return m.group(1) if m else None

    grouped = ref_series.map(_extract_domain).map(_group_referrer).dropna()
    ref_counts = grouped.value_counts().reset_index()
    ref_counts.columns = ['name', 'value']
    ref_counts.to_json(f'{out}/referrers.json', orient='records')
    print("✓ referrers.json")

# ---- 12. Portal navigation clicks (e.label) ----
nav = df_events_tr[df_events_tr['e_label'].notna()]
nav_counts = nav['e_label'].value_counts().head(15).reset_index()
nav_counts.columns = ['label', 'count']
nav_counts.to_json(f'{out}/nav_clicks.json', orient='records')
print("✓ nav_clicks.json")

# ---- 13. CDE tab usage (e.tab) ----
tabs = df_events_tr[df_events_tr['e_tab'].notna()]
tab_counts = tabs['e_tab'].value_counts().reset_index()
tab_counts.columns = ['tab', 'count']
tab_counts.to_json(f'{out}/cde_tabs.json', orient='records')
print("✓ cde_tabs.json")

# ---- 14. Sidebar / panel actions (e.action) ----
actions = df_events_tr[df_events_tr['e_action'].notna()]
action_counts = actions['e_action'].value_counts().reset_index()
action_counts.columns = ['action', 'count']
action_counts.to_json(f'{out}/sidebar_actions.json', orient='records')
print("✓ sidebar_actions.json")

# ---- 15. Organ / view selections (e.value) ----
# Filter out coordinate strings (e.g. 'CenterY_global_px') and UUIDs
def _is_readable(s):
    return bool(s) and not re.match(r'^[A-Z][a-zA-Z]+_', s) and len(s) < 60
vals = df_events_tr[df_events_tr['e_value'].notna()]
vals = vals[vals['e_value'].apply(_is_readable)]
val_counts = vals['e_value'].value_counts().head(20).reset_index()
val_counts.columns = ['selection', 'count']
val_counts.to_json(f'{out}/organ_selections.json', orient='records')
print("✓ organ_selections.json")

# ---- 16. Hourly traffic distribution (UTC) ----
if 'time' in df_human.columns:
    def _extract_hour(t):
        m = re.match(r'(\d+):', str(t))
        return int(m.group(1)) if m else None
    hours = df_human['time'].map(_extract_hour).dropna().astype(int)
    hourly = hours.value_counts().sort_index().reset_index()
    hourly.columns = ['hour', 'count']
    hourly.to_json(f'{out}/hourly_traffic.json', orient='records')
    print("✓ hourly_traffic.json")

# ---- 17. Monthly unique sessions ----
# sessionId is the most reliable per-user identifier in event rows
sessions_monthly_df = df_events_tr[df_events_tr['e_session_id'].notna()].copy()
# date column is datetime.date objects; convert to YYYY-MM string
sessions_monthly_df['month_year'] = sessions_monthly_df['date'].astype(str).str[:7]
monthly_sessions = sessions_monthly_df.groupby('month_year')['e_session_id'].nunique().reset_index()
monthly_sessions.columns = ['month_year', 'unique_sessions']
monthly_sessions.to_json(f'{out}/monthly_unique_users.json', orient='records')
print("✓ monthly_unique_users.json")

# ---- 18. Session depth distribution ----
sessions = df_events_tr[df_events_tr['e_session_id'].notna()]
depth = sessions.groupby('e_session_id').size()

DEPTH_ORDER = ['1', '2', '3–5', '6–10', '11–20', '20+']
def _bin_depth(n):
    if n == 1:    return '1'
    if n == 2:    return '2'
    if n <= 5:    return '3–5'
    if n <= 10:   return '6–10'
    if n <= 20:   return '11–20'
    return '20+'

depth_binned = depth.map(_bin_depth).value_counts()
depth_out = [{'depth': k, 'sessions': int(depth_binned.get(k, 0))} for k in DEPTH_ORDER if k in depth_binned]
with open(f'{out}/session_depth.json', 'w') as f:
    json.dump(depth_out, f)
print("✓ session_depth.json")

print(f"\nAll done! {len(os.listdir(out))} JSON files in {out}/")
