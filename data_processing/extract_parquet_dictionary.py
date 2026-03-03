#!/usr/bin/env python3
"""Extract parquet field metadata into public/data/parquet_field_dictionary.json."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import duckdb

DEFAULT_PARQUET = Path("data/2026-01-13_hra-logs.parquet")
DEFAULT_OUT = Path("public/data/parquet_field_dictionary.json")

# Known field descriptions for a human-readable help page.
# If a parquet has extra fields not listed here, those fields are still added
# with empty meaning/usage so we can fill them later.
FIELD_HINTS: dict[str, tuple[str, str]] = {
    "anon_id": (
        "Anonymous identifier for a visitor/session actor.",
        "Session grouping, retention, and repeat-visitor analytics.",
    ),
    "date": (
        "Request date.",
        "Daily/monthly/yearly trend views and period filters.",
    ),
    "time": (
        "Request time component.",
        "Hour-of-day activity analysis.",
    ),
    "x_edge_location": (
        "CloudFront edge location code that served the request.",
        "Infra routing diagnostics and coarse geo context.",
    ),
    "sc_bytes": (
        "Response bytes sent by server.",
        "Payload-size analysis and traffic profiling.",
    ),
    "cs_method": (
        "HTTP request method (GET, POST, etc.).",
        "Request profiling and endpoint behavior checks.",
    ),
    "cs_uri_stem": (
        "Path part of the URL (without query params).",
        "Tool/page visit counting and route-level analytics.",
    ),
    "sc_status": (
        "HTTP status code returned to client.",
        "Error-rate and reliability metrics.",
    ),
    "cs_referer": (
        "Incoming referrer URL header.",
        "Source attribution and external ecosystem analysis.",
    ),
    "cs_user_agent": (
        "User-agent string from client.",
        "Client profiling and bot/human heuristics.",
    ),
    "cs_uri_query": (
        "Raw URL query string.",
        "Parameter extraction and event-context parsing.",
    ),
    "cs_cookie": (
        "Cookie header from request.",
        "Session continuity and identity context.",
    ),
    "x_edge_result_type": (
        "CloudFront result category.",
        "Infra/cache behavior diagnostics.",
    ),
    "x_edge_request_id": (
        "Unique CloudFront request id.",
        "Request traceability and de-dup checks.",
    ),
    "x_host_header": (
        "Host header requested by client.",
        "Domain-level segmentation and host routing checks.",
    ),
    "cs_protocol": (
        "Protocol scheme used by client request.",
        "Transport-level diagnostics.",
    ),
    "cs_bytes": (
        "Request bytes sent by client.",
        "Upload/payload profiling.",
    ),
    "time_taken": (
        "Total time to serve request.",
        "Latency and performance monitoring.",
    ),
    "ssl_protocol": (
        "TLS protocol version.",
        "Security/transport compatibility diagnostics.",
    ),
    "ssl_cipher": (
        "TLS cipher used for the request.",
        "Security posture and transport telemetry.",
    ),
    "x_edge_response_result_type": (
        "CloudFront response result type.",
        "Delivery outcome and cache/error analysis.",
    ),
    "cs_protocol_version": (
        "HTTP protocol version.",
        "Network/client compatibility analysis.",
    ),
    "time_to_first_byte": (
        "Time until first byte is returned.",
        "Backend/network latency monitoring.",
    ),
    "x_edge_detailed_result_type": (
        "Detailed CloudFront result reason.",
        "Infra troubleshooting for specific failure classes.",
    ),
    "sc_content_type": (
        "Response content MIME type.",
        "Asset/API/document classification.",
    ),
    "sc_content_len": (
        "Response content length.",
        "Payload distribution and bandwidth analysis.",
    ),
    "sc_range_start": (
        "Range start for partial content responses.",
        "Media/file transfer diagnostics.",
    ),
    "sc_range_end": (
        "Range end for partial content responses.",
        "Media/file transfer diagnostics.",
    ),
    "timestamp": (
        "Event timestamp in source format.",
        "Event ordering and temporal feature engineering.",
    ),
    "timestamp_ms": (
        "Event timestamp in milliseconds.",
        "Fine-grained sequencing and latency math.",
    ),
    "c_country": (
        "Country derived from client/edge location.",
        "Geo usage trends and country comparisons.",
    ),
    "query": (
        "Parsed query-parameter map.",
        "Event/tool context and parameter-level analysis.",
    ),
    "traffic_type": (
        "Traffic classification label (for example likely human or bot).",
        "Filtering analytics to desired traffic segments.",
    ),
    "referrer": (
        "Normalized referrer category/value.",
        "Traffic-source reporting.",
    ),
    "airport": (
        "Airport/location code derived from edge location context.",
        "Regional infrastructure distribution analysis.",
    ),
    "month": (
        "Month component derived from date.",
        "Monthly aggregation and trend charting.",
    ),
    "day": (
        "Day component derived from date.",
        "Daily aggregation and anomaly detection.",
    ),
    "distribution": (
        "Distribution/environment identifier.",
        "Comparing traffic across deployment distributions.",
    ),
    "site": (
        "High-level site/category label for the event.",
        "Separating Apps vs Events traffic in dashboards.",
    ),
    "year": (
        "Year component derived from date.",
        "Year-over-year trend analysis.",
    ),
    "technology": (
        "Technology label extracted from request context.",
        "Technology-level usage and error breakdowns.",
    ),
    "tool": (
        "Resolved tool identifier.",
        "Per-tool visits, reliability, and geography views.",
    ),
    "is_infra_request": (
        "Flag for infrastructure/static requests.",
        "Separating infra traffic from product usage.",
    ),
    "is_tool_visit": (
        "Flag for requests counted as tool visits.",
        "Tool usage metrics and chart denominators.",
    ),
    "likely_bot": (
        "Heuristic flag for probable bot traffic.",
        "Traffic quality filtering and bot analysis.",
    ),
}


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def extract_schema(con: duckdb.DuckDBPyConnection, parquet_path: Path) -> list[dict]:
    parquet_sql = sql_escape(str(parquet_path))
    cursor = con.execute(f"DESCRIBE SELECT * FROM read_parquet('{parquet_sql}')")
    rows = cursor.fetchall()
    colnames = [d[0].lower() for d in cursor.description]

    i_name = colnames.index("column_name") if "column_name" in colnames else 0
    i_type = colnames.index("column_type") if "column_type" in colnames else 1
    i_null = colnames.index("null") if "null" in colnames else None

    fields: list[dict] = []
    for row in rows:
        field = str(row[i_name])
        meaning, usage = FIELD_HINTS.get(field, ("", ""))
        nullable = None
        if i_null is not None:
            nullable = str(row[i_null]).upper() == "YES"
        fields.append(
            {
                "field": field,
                "type": row[i_type],
                "nullable": nullable,
                "meaning": meaning,
                "usage": usage,
            }
        )
    return fields


def extract_row_count(con: duckdb.DuckDBPyConnection, parquet_path: Path) -> int:
    parquet_sql = sql_escape(str(parquet_path))
    return int(con.execute(f"SELECT COUNT(*)::BIGINT FROM read_parquet('{parquet_sql}')").fetchone()[0])


def run(parquet_path: Path, out_path: Path) -> None:
    con = duckdb.connect()
    try:
        fields = extract_schema(con, parquet_path)
        row_count = extract_row_count(con, parquet_path)
    finally:
        con.close()

    payload = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "parquet_path": str(parquet_path),
        "row_count": row_count,
        "fields": fields,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} with {len(fields)} fields.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract parquet fields into a JSON dictionary for the Help page."
    )
    parser.add_argument("--parquet", default=str(DEFAULT_PARQUET), help="Input parquet path")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output JSON path")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(Path(args.parquet), Path(args.out))
