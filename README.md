# HRA + CNS Analytics Dashboard

Interactive web dashboard for analyzing Amazon CloudFront logs across two Indiana University platforms:

- **HRA** ([humanatlas.io](https://humanatlas.io)) — Human Reference Atlas tool usage analytics
- **CNS** ([cns.iu.edu](https://cns.iu.edu)) — Cyberinfrastructure for Network Science website analytics

**Live:** [hra-viz.vercel.app](https://hra-viz.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| Charts | Apache ECharts 6 via echarts-for-react |
| Data Processing | DuckDB (SQL on Parquet) + Python |
| ML Pipeline | Prophet, scikit-learn, ruptures, NLP clustering |
| External Data | PubMed E-utilities, GitHub API (cns-iu/cns-website repo) |
| Testing | pytest (58 data integrity tests) |
| Deployment | Vercel (static export) |

## Dashboards

### HRA — 7 pages
Tool usage analytics for EUI, RUI, CDE, FTU Explorer, KG Explorer.

| Page | Route | Highlights |
|------|-------|-----------|
| Overview | `/hra` | Stat cards, hourly traffic, monthly unique users |
| Usage + Reliability | `/hra/tools` | Monthly trends with release/event/publication overlay, error rates per tool, fix priorities |
| Tool Behaviour | `/hra/features` | Event types, top UI paths, RUI keyboard usage, CDE workflow funnel |
| Geography | `/hra/geo` | World map (128 countries), tool preference per country, bot traffic |
| Journeys | `/hra/journeys` | Tool transition force graph, cross-tool sessions |
| Insights | `/hra/insights` | 23 data-driven insight cards with embedded charts |
| ML Lab | `/hra/ml` | Prophet forecasts, churn prediction, error clusters, bot detection |

### CNS — 6 pages
18 years of website traffic analytics (2008–2026).

| Page | Route | Highlights |
|------|-------|-----------|
| Overview | `/cns` | Stat cards, monthly trend with publication + event overlay, funding timeline ($42.9M, 81 grants) |
| Traffic | `/cns/traffic` | Long-term trend, hourly + day-of-week patterns, bot trend |
| Content | `/cns/content` | Top 405 publications (PDF downloads matched to titles), workshops, team page views |
| Geography | `/cns/geo` | World map (224 countries), bot rate per country |
| Errors + Security | `/cns/errors` | HTTP status breakdown, error categorization, monthly drilldown panel, security signals |
| Referrers | `/cns/referrers` | Search engine breakdown, top referring domains, trend over time |

## Project Structure

```
app/
  page.tsx                 # Landing page (pick HRA or CNS)
  hra/                     # HRA dashboard (7 pages)
  cns/                     # CNS dashboard (6 pages)
  help/page.tsx            # Parquet field dictionary
  components/
    charts/                # 72 chart components (all "use client" + ECharts)
    Navbar.tsx             # HRA/CNS toggle + nav links
  lib/chartTheme.ts        # Shared colors, tooltip styles, helpers

data_processing/
  generate_hra_data.py            # HRA: DuckDB SQL → 51 JSON files
  generate_hra_ml_insights.py     # HRA: Prophet + sklearn → 10 JSON files
  fetch_hra_publications.py       # HRA: PubMed API → publications.json
  extract_hra_parquet_dictionary.py # HRA: parquet schema → field dictionary
  generate_cns_data.py            # CNS: DuckDB SQL → 31 JSON files
  fetch_cns_github.py             # CNS: GitHub API → pubs, events, funding, news
  run_all.sh                      # Run entire pipeline (HRA + CNS + build)
  requirements.txt                # Python dependencies

tests/
  test_data_integrity.py   # 58 pytest tests (file existence, shapes, cross-checks)

data/                      # Place parquet files here (auto-detected by scripts)
  hra/                     # HRA CloudFront parquet logs
  cns/                     # CNS CloudFront parquet logs

public/data/
  hra/                     # 51 HRA JSON files (generated)
  cns/                     # 31 CNS JSON files (generated)
```

## Quick Start

```bash
# Install
npm install
pip install -r data_processing/requirements.txt

# Run full pipeline (data + build)
./data_processing/run_all.sh

# Selective runs
./data_processing/run_all.sh --hra-only
./data_processing/run_all.sh --cns-only
./data_processing/run_all.sh --skip-fetch   # skip PubMed/GitHub API calls

# Development
npm run dev                   # localhost:3000
npm run build                 # static production build
npm run lint                  # ESLint

# Testing
pytest tests/ -v
pytest tests/ -k "hra"        # HRA tests only
pytest tests/ -k "cns"        # CNS tests only
pytest tests/ -k "pipeline"   # Pipeline checks only
```

The pipeline auto-detects the latest parquet in `data/hra/` and `data/cns/` by modification time. Drop a new parquet (e.g. `2026-05-01_hra-logs.parquet`) into the directory and rerun — no script edits needed.

## Pipeline Stages

### HRA

```
data/hra/*.parquet (CloudFront logs)
    ↓
[1] Deduplicate exact rows  →  ~1,500 dupes removed (0.01%)
[2] Filter traffic_type='Likely Human'  →  78% of rows
[3] Filter tool URIs (/eui/, /rui/, /cde/, /ftu-explorer/, /kg-explorer/)
[4] Aggregate via DuckDB SQL  →  51 JSON files
[5] ML pipeline (Prophet, KMeans, RandomForest, IsolationForest)  →  10 JSON files
[6] PubMed fetch + dedup (preprint vs journal)  →  publications.json
    ↓
public/data/hra/*.json
    ↓
Next.js static build  →  HTML + JS bundles  →  Vercel
```

### CNS

```
data/cns/*.parquet (CloudFront logs)
    ↓
[1] Deduplicate exact rows  →  ~631K dupes removed (3.8%)
[2] Filter traffic_type='Likely Human'  →  77% of rows
[3] Categorize content (Publications, Presentations, News, Workshops, Team, etc.)
[4] Normalize paths (collapse double slashes, strip trailing slashes, merge variants)
[5] Aggregate via DuckDB SQL  →  31 JSON files
[6] GitHub fetch (cns-iu/cns-website repo) → publications, events, funding, news
[7] Match top PDFs to publication titles (filename → DOI/title enrichment)
    ↓
public/data/cns/*.json
    ↓
Next.js static build  →  HTML + JS bundles  →  Vercel
```

## Data Sources

| Source | Script | Output | Volume |
|--------|--------|--------|--------|
| HRA CloudFront logs | `generate_hra_data.py` | 51 JSON files | 15.8M rows, Jun 2023 – Apr 2026 |
| HRA ML pipeline | `generate_hra_ml_insights.py` | 10 JSON files | Forecasts, clusters, churn, bot scores |
| PubMed (NCBI E-utilities) | `fetch_hra_publications.py` | `publications.json` | 54 papers, deduplicated |
| CNS CloudFront logs | `generate_cns_data.py` | 31 JSON files | 15.8M rows, Apr 2008 – Apr 2026 |
| cns-iu/cns-website (GitHub) | `fetch_cns_github.py` | 4 JSON files | 405 pubs, 999 events, 81 grants ($42.9M), 187 news |

## Key Metrics (based on latest file processed)

### HRA
- **Date range:** Jun 2023 – Apr 2026 (~34 months)
- **Total requests:** 15.8M (78.0% human, 19.3% bot, 2.6% AI crawler)
- **Tool visits:** 78,879 (KG Explorer 49,358 · EUI 14,007 · RUI 5,548 · CDE 5,286 · FTU Explorer 4,680)
- **Error events:** 38,922 — clustered into ~8 actionable buckets via TF-IDF + KMeans
- **Countries:** 128
- **Publications:** 54 (PubMed)
- **Releases tracked:** v1.4 through v2.4 (6 releases)

### CNS
- **Date range:** Apr 2008 – Apr 2026 (~18 years)
- **Total requests:** 15.8M (77.4% human, 20.7% bot, 2.0% AI crawler)
- **HTTP errors:** 2.9M HTTP 404s + 1.9M HTTP 500s, categorized into actionable buckets
- **Countries:** 224
- **Publications:** 405 (1992–2026, from GitHub)
- **Events tracked:** 999 conferences, workshops, tutorials
- **Funding tracked:** $42.9M across 81 grants (NSF, NIH, others)
- **News articles:** 187 (2003–2026)

## Team

Kaustav Deka · Aydian Brown · Akriti Kumari
Indiana University, Bloomington
