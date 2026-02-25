# HRA Analytics Dashboard

CloudFront log analytics. Covers 27 months of usage data across KG Explorer, EUI, RUI, CDE, and FTU Explorer.

**Stack:** Next.js · TypeScript · Tailwind v4 · ECharts 6 · DuckDB (pipeline)

---

## Pages & Charts

### `/` — Overview
Headline KPIs (total visits, human traffic %, month count, country count), monthly sparkline, tool visit bar chart, traffic type donut, and callout cards for notable findings (GTEx integration, March 2024 spike, academic seasonality, error rate).

### `/tools` — Tool Analytics
Per-tool stat cards, multi-line monthly trends with annotations (MonthlyTrendsChart), yearly grouped bar, tool share donut, hourly usage heatmap (ToolHourlyHeatmap), and day-of-week stacked bar (TrafficByDowChart) with DOW insights panel.

### `/features` — Feature Adoption
Interaction type breakdown (EventTypesChart), error root cause analysis with two-panel layout (ErrorBreakdownChart — source vs. NLP clusters), monthly error trend (MonthlyErrorTrendChart), top UI elements drilldown by event type (TopPathsByEventChart), RUI 3D keyboard navigation heatmap (RUIKeyboardChart), CDE workflow funnel (CDEWorkflowChart) with tab usage chips, EUI spatial search funnel (SpatialSearchChart), RUI opacity controls (OpacityChart), and KG Explorer content selection bar (OrgContentSelectChart).

### `/geo` — Geography
Interactive world map (WorldMapChart), top-20 country bar chart colored by region (GeoBarChart), 100% stacked tool preference by country (GeoToolPreferenceChart), dual-axis bot traffic chart (GeoBotChart), regional breakdown donut, US vs. international donut, and country callout cards.

### `/network` — UX Gaps & Journeys
Gap stats and gap cards, EUI spatial search funnel (EUISpatialFunnelChart), CDE Sankey diagram of user flow (CDESankeyChart), tool correlation heatmap + force graph (ToolCorrelationHeatmap / ToolCorrelationGraph), and tool transition flow (ToolTransitionFlowChart — directed force graph of cross-tool journeys).

### `/insights` — Key Insights
20 bento-grid insight cards grouped into 5 categories (Events & Spikes, Tool Trajectories, Feature Insights, Portal & Ecosystem, Traffic & Geography). Eight cards include embedded compact charts; all numeric values are data-driven from JSON.

### `/ml` — Machine Learning View
Prophet traffic forecasts (MLForecastChart), anomaly/spike event timeline (MLSpikeEventsChart), user segment donut + churn risk buckets (MLChurnBucketsChart), monthly cohort retention heatmap (CohortRetentionChart), tool transition heatmap (MLTransitionHeatmap), association rule lift chart (MLRuleLiftChart), NLP error clusters (MLErrorClustersChart), and geographic anomaly scores (MLGeoAnomalyChart).

---

## Data Pipeline

All charts read from pre-built JSON files in `public/data/`. To regenerate from a new parquet log:

### 1. Place the parquet file

Drop the CloudFront parquet log into the `data/` directory at the project root:

```
data/
  2026-01-13_hra-logs.parquet   ← put it here
```

### 2. Install Python dependencies

```bash
pip install duckdb pandas numpy scikit-learn prophet
```

### 3. Run the main aggregation pipeline

```bash
python data_processing/generate_data.py \
  --parquet data/2026-01-13_hra-logs.parquet \
  --out public/data
```

Rewrites all 18 aggregation JSON files in `public/data/`.

### 4. Run the ML pipeline

```bash
python data_processing/ml_insights.py \
  --input-parquet data/2026-01-13_hra-logs.parquet \
  --output-dir public/data \
  --forecast-horizon 6
```

Generates forecasts, spike events, user segments, cohort retention, bot scores, and more.

After both scripts complete, restart the dev server to pick up the new JSON files.

---

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # lint check
```

---

## Deploy

Deployed on Vercel from the `main` branch. Push to `main` to trigger a redeploy. No environment variables required — all data is served as static JSON.
