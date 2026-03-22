# HRA Analytics Dashboard

Usage analytics for the [Human Reference Atlas](https://humanatlas.io/) portal tools, derived from Amazon CloudFront access logs.

**Live:** Deployed on Vercel (main branch)

---

## What It Does

Analyzes ~14.8M CloudFront log entries to surface usage patterns, error trends, geographic distribution, and ML-driven insights across five HRA tools: **EUI**, **RUI**, **CDE**, **FTU Explorer**, and **KG Explorer**.

### Pages

| Page | Path | What It Shows |
|------|------|---------------|
| Overview | `/` | Stat cards, request funnel, tool bar chart, traffic donut, hourly patterns |
| Usage + Reliability | `/tools` | Monthly trends with release/publication overlays, yearly breakdown, error rates, return rates |
| Tool Behaviour | `/features` | Per-tool interaction analysis (spatial search, keyboard nav, CDE workflow, opacity toggles) |
| Geography | `/geo` | World map, top countries, tool preference by region, bot traffic analysis |
| Journeys | `/journeys` | UX gaps, cross-tool correlation heatmap, transition flows, Sankey diagrams |
| ML Insights | `/ml` | Forecasts, spike detection, cohort retention, session segments, churn model |
| Key Insights | `/insights` | 19 data-driven insight cards with embedded charts |
| Field Dictionary | `/help` | Parquet schema reference |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, static export)
- **Charts:** ECharts 6 + echarts-for-react
- **Styling:** Tailwind CSS v4
- **Data:** Pre-processed JSON files from DuckDB SQL on parquet

---

## Project Structure

```
app/
  page.tsx                       # Overview
  tools/page.tsx                 # Usage + Reliability
  features/page.tsx              # Per-tool interaction behaviour
  geo/page.tsx                   # Geographic distribution
  journeys/page.tsx              # UX gaps & cross-tool flows
  ml/page.tsx                    # Machine learning insights
  insights/page.tsx              # Key insight cards
  help/page.tsx                  # Field dictionary
  components/
    charts/                      # 49 chart components ('use client' + ssr:false)
    ChartCard.tsx                # Card wrapper with title/subtitle/badge
    StatCard.tsx                 # Metric card with accent color
    Navbar.tsx                   # Sticky top nav
    Hc.tsx                       # Hardcoded value marker
  lib/
    chartTheme.ts                # TOOL_COLORS, tooltip/axis styles, helpers

public/data/                     # 51 pre-processed JSON files (build-time imports)

data_processing/
  generate_data.py               # DuckDB pipeline -> 51 JSON aggregations
  ml_insights.py                 # ML pipeline (Prophet, clustering, churn, bot detection)
  fetch_publications.py          # PubMed E-utilities API -> publications.json
  extract_parquet_dictionary.py  # Parquet schema extractor

data/                            # Source parquet files (not committed)
```

---

## Data Pipeline

All data flows from a single CloudFront parquet file through Python scripts into JSON files consumed by Next.js at build time. Both scripts auto-deduplicate the parquet on load.

```
CloudFront parquet
    |
    +-- generate_data.py       -> 51 JSON files (visits, errors, geo, events, etc.)
    +-- ml_insights.py         -> 10 JSON files (forecasts, segments, clusters, etc.)
    +-- fetch_publications.py  -> publications.json (from PubMed API)
```

### Running the pipeline

```bash
# 1. Data aggregations (requires: duckdb)
python data_processing/generate_data.py \
  --parquet data/2026-03-09_hra-logs.parquet \
  --out public/data

# 2. ML insights (requires: duckdb, pandas, numpy, scikit-learn, prophet)
python data_processing/ml_insights.py \
  --input-parquet data/2026-03-09_hra-logs.parquet \
  --output-dir public/data

# 3. Fetch publications from PubMed (requires: stdlib only)
python data_processing/fetch_publications.py --out public/data
```

After running, restart the dev server or rebuild to pick up updated JSON.

---

## Event Overlay System

The monthly trends chart supports data-driven event annotations stored in `public/data/external_events.json`:

| Type | Visual | Example |
|------|--------|---------|
| `release` | Cyan dashed line | HRA v2.2 (Dec 2024) |
| `workshop` | Red shaded area | HuBMAP Training + Demo Day (Mar 2024) |
| `publication` | Purple bars (right axis) | 3 papers incl. HRA KG paper (Feb 2025) |
| `social` | Green markers | (placeholder, needs client data) |

To add a new event:

```json
{ "date": "2025-01", "type": "social", "title": "AnVIL post about HRA v2.2" }
```

Publications also have a click-to-show panel below the chart with paper titles linking to DOI/PubMed.

---

## Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Static export
npm run lint      # ESLint (0 errors, 0 warnings)
```

---

## Deploy

Deployed on Vercel from the `main` branch. Push to `main` to trigger a redeploy. No environment variables required — all data is served as static JSON.
