# HRA Analytics Dashboard — TODO

> Remaining work after first client meeting (March 2026).

---

### 1. Social Media Event Tracking
> **Status:** Placeholder built — needs client data
> **Priority:** Low

The event overlay framework supports `"type": "social"` events. Client needs to provide dates/links.

- [ ] Client provides social media post dates and links (AnVIL, Twitter/X, LinkedIn?)
- [ ] Add entries to `public/data/external_events.json` with `"type": "social"`
- [ ] They'll automatically appear as green markers on the chart

---

### 2. Cookie Consent Metrics
> **Status:** BLOCKED — needs client instrumentation
> **Priority:** Medium (when unblocked)

The parquet has `cs_cookie` (raw Cookie header) but NO consent accept/decline signals.

**Client needs to:**
- [ ] Implement cookie consent banner on HRA tools
- [ ] Log accept/decline events to CloudFront or separate endpoint
- [ ] Provide updated parquet with consent events

**We'll then build:**
- [ ] Consent aggregation in `generate_data.py`
- [ ] `public/data/cookie_consent.json`
- [ ] Consent donut chart + geographic breakdown on `/geo`

---

### 3. Confirm KG Explorer Launch Date with Client
> **Status:** Needs client confirmation
> **Priority:** Low

Parquet shows first KG Explorer traffic in Aug 2025 (1,971 requests, zero before). Used as launch date throughout the dashboard. Ask client to confirm this is the official launch.

---

## Questions for Client (Unanswered)

| # | Question | Context | Blocks |
|---|----------|---------|--------|
| 1 | Which social media platforms do you use, and can you provide post dates/links? | Framework built — just need data to populate as green markers on chart | Social media overlay |
| 2 | When will cookie consent tracking be instrumented on HRA tools? | We need accept/decline events logged to CloudFront or separate endpoint | Cookie consent metrics + geo breakdown |
| 3 | Is Aug 2025 the official KG Explorer launch date? | Parquet shows first traffic Aug 2025 (1,971 requests, zero before) | Label accuracy |
| 4 | Are our 61 PubMed papers the right set? Any authors/grant IDs to filter? | Searching "Human Reference Atlas", "HuBMAP" + "atlas", "CCF" + "human" | Publication accuracy |
| 5 | Do you want exact release day-of-month for HRA versions? | Currently using Jun/Dec broadly (e.g., Jun 1 vs Jun 15) | Chart annotation precision |
| 6 | How often should we re-fetch PubMed data? | `fetch_publications.py` needs periodic re-runs for new papers | Data freshness |
