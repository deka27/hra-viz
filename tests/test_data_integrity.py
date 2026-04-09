"""
Data integrity tests for HRA + CNS analytics dashboard.

Verifies JSON data files exist, have correct shapes, and values are reasonable.
Does NOT run the full pipeline — only checks existing output files.

Usage:
    pytest tests/ -v
    pytest tests/test_data_integrity.py -v
    pytest tests/ -k "hra"          # HRA tests only
    pytest tests/ -k "cns"          # CNS tests only
"""

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
HRA_DATA = ROOT / "public" / "data" / "hra"
CNS_DATA = ROOT / "public" / "data" / "cns"


@pytest.fixture
def hra(request):
    """Load an HRA JSON file by name."""
    def _load(name: str):
        with open(HRA_DATA / name, encoding="utf-8") as f:
            return json.load(f)
    return _load


@pytest.fixture
def cns(request):
    """Load a CNS JSON file by name."""
    def _load(name: str):
        with open(CNS_DATA / name, encoding="utf-8") as f:
            return json.load(f)
    return _load


# ── Pipeline ──────────────────────────────────────────────────────────────────

class TestPipeline:
    def test_hra_parquet_exists(self):
        parquets = list((ROOT / "data" / "hra").glob("*.parquet"))
        assert len(parquets) >= 1, "No HRA parquet files found in data/hra/"

    def test_cns_parquet_exists(self):
        parquets = list((ROOT / "data" / "cns").glob("*.parquet"))
        assert len(parquets) >= 1, "No CNS parquet files found in data/cns/"

    def test_scripts_importable(self):
        sys.path.insert(0, str(ROOT / "data_processing"))
        for script in ["generate_hra_data", "generate_cns_data", "fetch_hra_publications", "fetch_cns_github"]:
            __import__(script)

    def test_all_json_valid(self):
        for data_dir in [HRA_DATA, CNS_DATA]:
            for f in data_dir.glob("*.json"):
                with open(f, encoding="utf-8") as fh:
                    json.load(fh)  # raises on invalid JSON


# ── HRA: File existence ───────────────────────────────────────────────────────

HRA_REQUIRED_FILES = [
    "total_tool_visits.json", "tool_visits_by_month.json", "tool_visits_by_year.json",
    "traffic_types.json", "event_types.json", "geo_distribution.json",
    "error_breakdown.json", "data_metadata.json", "publications.json",
    "hra_releases.json", "external_events.json", "transition_matrix.json",
    "forecast_tool_visits.json", "user_segments.json", "bot_scores.json",
    "tool_error_rates_long.json", "top_errors_by_tool.json",
]

@pytest.mark.parametrize("filename", HRA_REQUIRED_FILES)
def test_hra_file_exists(filename):
    assert (HRA_DATA / filename).exists(), f"Missing: hra/{filename}"


# ── HRA: Data shape & values ─────────────────────────────────────────────────

class TestHRAToolVisits:
    def test_is_list(self, hra):
        data = hra("total_tool_visits.json")
        assert isinstance(data, list)

    def test_has_five_tools(self, hra):
        data = hra("total_tool_visits.json")
        assert len(data) == 5

    def test_correct_tool_names(self, hra):
        data = hra("total_tool_visits.json")
        tools = {d["tool"] for d in data}
        assert tools == {"EUI", "RUI", "CDE", "FTU Explorer", "KG Explorer"}

    def test_total_visits_reasonable(self, hra):
        data = hra("total_tool_visits.json")
        total = sum(d["visits"] for d in data)
        assert 50_000 < total < 500_000, f"Total visits {total:,} out of expected range"


class TestHRAMonthly:
    def test_sufficient_months(self, hra):
        data = hra("tool_visits_by_month.json")
        assert len(data) >= 20

    def test_has_required_fields(self, hra):
        first = hra("tool_visits_by_month.json")[0]
        assert "month_year" in first
        assert "EUI" in first
        assert "KG Explorer" in first

    def test_sorted_chronologically(self, hra):
        data = hra("tool_visits_by_month.json")
        months = [d["month_year"] for d in data]
        assert months == sorted(months)


class TestHRATraffic:
    def test_has_human_type(self, hra):
        data = hra("traffic_types.json")
        types = {d["type"] for d in data}
        assert "Likely Human" in types

    def test_human_pct_reasonable(self, hra):
        data = hra("traffic_types.json")
        total = sum(d["count"] for d in data)
        human = next(d["count"] for d in data if d["type"] == "Likely Human")
        pct = human / total * 100
        assert 70 < pct < 90, f"Human traffic {pct:.1f}% outside 70-90% range"


class TestHRAGeo:
    def test_sufficient_countries(self, hra):
        data = hra("geo_distribution.json")
        countries = [d for d in data if d["c_country"] != "-"]
        assert len(countries) >= 100

    def test_us_exists_and_leading(self, hra):
        data = hra("geo_distribution.json")
        us = next((d for d in data if d["c_country"] == "US"), None)
        assert us is not None
        assert us["visits"] > 10_000


class TestHRAErrors:
    def test_error_totals_cross_check(self, hra):
        errors = hra("error_breakdown.json")
        events = hra("event_types.json")
        error_total = sum(d["errors"] for d in errors["by_source"])
        event_errors = next((d["count"] for d in events if d["event"] == "error"), 0)
        assert error_total == event_errors, f"Mismatch: breakdown={error_total:,} vs events={event_errors:,}"


class TestHRAPublications:
    def test_sufficient_count(self, hra):
        data = hra("publications.json")
        assert len(data) >= 40

    def test_has_required_fields(self, hra):
        pub = hra("publications.json")[0]
        assert "title" in pub
        assert "pub_date" in pub
        assert "doi" in pub


class TestHRAReleases:
    def test_sufficient_releases(self, hra):
        data = hra("hra_releases.json")
        assert len(data) >= 5

    def test_has_key_versions(self, hra):
        data = hra("hra_releases.json")
        versions = {d["version"] for d in data}
        assert "v2.0" in versions
        assert "v2.4" in versions


# ── CNS: File existence ───────────────────────────────────────────────────────

CNS_REQUIRED_FILES = [
    "cns_data_metadata.json", "cns_traffic_types.json", "cns_monthly_visits.json",
    "cns_geo_distribution.json", "cns_top_pages.json", "cns_top_pdfs.json",
    "cns_referrers.json", "cns_http_status.json", "cns_security_signals.json",
    "cns_publications.json", "cns_events.json", "cns_funding.json", "cns_news.json",
]

@pytest.mark.parametrize("filename", CNS_REQUIRED_FILES)
def test_cns_file_exists(filename):
    assert (CNS_DATA / filename).exists(), f"Missing: cns/{filename}"


# ── CNS: Data shape & values ─────────────────────────────────────────────────

class TestCNSTraffic:
    def test_total_requests_reasonable(self, cns):
        data = cns("cns_traffic_types.json")
        total = sum(d["count"] for d in data)
        assert total > 10_000_000, f"CNS total {total:,} seems too low"

    def test_human_pct_reasonable(self, cns):
        data = cns("cns_traffic_types.json")
        total = sum(d["count"] for d in data)
        human = next((d["count"] for d in data if d["type"] == "Likely Human"), 0)
        pct = human / total * 100
        assert 70 < pct < 90, f"Human traffic {pct:.1f}% outside range"


class TestCNSPublications:
    def test_sufficient_count(self, cns):
        data = cns("cns_publications.json")
        assert len(data) >= 300

    def test_spans_decades(self, cns):
        data = cns("cns_publications.json")
        years = {d["pub_date"][:4] for d in data if len(d.get("pub_date", "")) >= 4}
        assert any(y < "2005" for y in years), "Missing early publications"
        assert any(y >= "2025" for y in years), "Missing recent publications"


class TestCNSEvents:
    def test_sufficient_events(self, cns):
        data = cns("cns_events.json")
        assert len(data) >= 500


class TestCNSFunding:
    def test_sufficient_grants(self, cns):
        data = cns("cns_funding.json")
        assert len(data) >= 50

    def test_total_funding_reasonable(self, cns):
        data = cns("cns_funding.json")
        total = sum(d["amount"] for d in data)
        assert total > 30_000_000, f"Total funding ${total:,.0f} seems low"


class TestCNSGeo:
    def test_sufficient_countries(self, cns):
        data = cns("cns_geo_distribution.json")
        countries = [d for d in data if d["c_country"] != "-"]
        assert len(countries) >= 150
