#!/usr/bin/env python3
"""
DuckDB-first ML pipeline for HRA analytics.

Reads the CloudFront parquet logs and generates JSON outputs in public/data
for all ML use cases discussed in planning:
1) traffic forecasting
2) spike/changepoint detection
3) user segmentation
4) churn/return prediction
5) journey transition modeling
6) feature association mining
7) bot-score classifier
8) error clustering
9) geo anomaly detection
10) cross-tool recommendation candidates
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import re
from collections import Counter
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote_plus

import duckdb
import numpy as np
import pandas as pd

# Prophet imports `prophet.plot`, which logs an optional Plotly warning.
# We do not use interactive plotting in this pipeline.
logging.getLogger("prophet.plot").disabled = True

try:
    from prophet import Prophet
except Exception:
    Prophet = None  # type: ignore[assignment]

try:
    import ruptures as rpt
except Exception:
    rpt = None  # type: ignore[assignment]

try:
    from mlxtend.frequent_patterns import apriori, association_rules
    from mlxtend.preprocessing import TransactionEncoder
except Exception:
    apriori = None  # type: ignore[assignment]
    association_rules = None  # type: ignore[assignment]
    TransactionEncoder = None  # type: ignore[assignment]

try:
    from sklearn.cluster import KMeans
    from sklearn.ensemble import IsolationForest, RandomForestClassifier
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import (
        accuracy_score,
        f1_score,
        precision_score,
        recall_score,
        roc_auc_score,
    )
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
except Exception:
    KMeans = None  # type: ignore[assignment]
    IsolationForest = None  # type: ignore[assignment]
    RandomForestClassifier = None  # type: ignore[assignment]
    TfidfVectorizer = None  # type: ignore[assignment]
    LogisticRegression = None  # type: ignore[assignment]
    accuracy_score = None  # type: ignore[assignment]
    f1_score = None  # type: ignore[assignment]
    precision_score = None  # type: ignore[assignment]
    recall_score = None  # type: ignore[assignment]
    roc_auc_score = None  # type: ignore[assignment]
    train_test_split = None  # type: ignore[assignment]
    Pipeline = None  # type: ignore[assignment]
    StandardScaler = None  # type: ignore[assignment]

TOOL_STEM_MAP: dict[str, str] = {
    "/eui/": "EUI",
    "/rui/": "RUI",
    "/cde/": "CDE",
    "/ftu-explorer/": "FTU Explorer",
    "/kg-explorer/": "KG Explorer",
}

APP_TOOL_MAP: dict[str, str] = {
    "ccf-eui": "EUI",
    "ccf-rui": "RUI",
    "cde-ui": "CDE",
    "ftu-ui": "FTU Explorer",
    "ftu-ui-small-wc": "FTU Explorer",
    "kg-explorer": "KG Explorer",
}

INVALID_SESSION_IDS = {"", "-", "TODO", "null", "None", "nan"}
INVALID_ANON_IDS = {"", "-", "TODO", "null", "None", "nan"}


def ts_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")


def parse_query_field(raw_query: Any, key: str) -> str | None:
    if not isinstance(raw_query, str) or raw_query in {"", "-"}:
        return None
    try:
        val = parse_qs(raw_query, keep_blank_values=True).get(key, [None])[0]
    except Exception:
        return None
    if not isinstance(val, str):
        return None
    val = unquote_plus(val).strip()
    return val if val else None


def normalize_session_id(val: Any) -> str | None:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    text = str(val).strip()
    if text in INVALID_SESSION_IDS:
        return None
    if len(text) < 4:
        return None
    return text


def map_tool(app: Any, path: Any) -> str | None:
    app_text = str(app).strip().lower() if app is not None else ""
    if app_text in APP_TOOL_MAP:
        return APP_TOOL_MAP[app_text]

    path_text = str(path).strip().lower() if path is not None else ""
    if "kg" in path_text:
        return "KG Explorer"
    if "eui" in path_text:
        return "EUI"
    if "rui" in path_text:
        return "RUI"
    if "cde" in path_text:
        return "CDE"
    if "ftu" in path_text:
        return "FTU Explorer"
    return None


def safe_ratio(a: float, b: float) -> float:
    return float(a) / float(b) if b else 0.0


def load_monthly_tool_visits(con: duckdb.DuckDBPyConnection, parquet_path: Path) -> pd.DataFrame:
    sql = f"""
    SELECT
      date_trunc('month', date)::DATE AS month_start,
      CASE cs_uri_stem
        WHEN '/eui/' THEN 'EUI'
        WHEN '/rui/' THEN 'RUI'
        WHEN '/cde/' THEN 'CDE'
        WHEN '/ftu-explorer/' THEN 'FTU Explorer'
        WHEN '/kg-explorer/' THEN 'KG Explorer'
      END AS tool,
      count(*)::BIGINT AS visits
    FROM read_parquet('{str(parquet_path).replace("'", "''")}')
    WHERE traffic_type='Likely Human'
      AND site='Apps'
      AND cs_uri_stem IN ('/eui/','/rui/','/cde/','/ftu-explorer/','/kg-explorer/')
    GROUP BY 1,2
    ORDER BY 1,2
    """
    out = con.execute(sql).df()
    out["month_start"] = pd.to_datetime(out["month_start"])
    return out


def monthly_pivot(monthly_visits: pd.DataFrame) -> pd.DataFrame:
    if monthly_visits.empty:
        return pd.DataFrame()

    all_tools = list(TOOL_STEM_MAP.values())
    start = monthly_visits["month_start"].min()
    end = monthly_visits["month_start"].max()
    all_months = pd.date_range(start, end, freq="MS")

    piv = (
        monthly_visits.pivot(index="month_start", columns="tool", values="visits")
        .reindex(all_months)
        .fillna(0)
        .astype(int)
    )
    for tool in all_tools:
        if tool not in piv.columns:
            piv[tool] = 0
    piv = piv[all_tools]
    piv.index.name = "month_start"
    return piv


def build_forecast_with_fallback(series: pd.Series, horizon: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, str]:
    y = series.values.astype(float)
    if Prophet is not None and len(series) >= 12 and np.sum(y) > 0:
        try:
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                interval_width=0.9,
            )
            frame = pd.DataFrame({"ds": series.index, "y": y})
            model.fit(frame)
            future = model.make_future_dataframe(periods=horizon, freq="MS")
            pred = model.predict(future).tail(horizon)
            yhat = np.clip(pred["yhat"].to_numpy(dtype=float), 0, None)
            low = np.clip(pred["yhat_lower"].to_numpy(dtype=float), 0, None)
            high = np.clip(pred["yhat_upper"].to_numpy(dtype=float), 0, None)
            # Guardrail: if recent actuals are non-zero, don't forecast zero
            if len(y) >= 3:
                recent_avg = float(np.mean(y[-3:]))
                if recent_avg > 0:
                    yhat = np.maximum(yhat, recent_avg * 0.5)
            return yhat, low, high, "prophet"
        except Exception:
            pass

    x = np.arange(len(y), dtype=float)
    if len(y) >= 2:
        slope, intercept = np.polyfit(x, y, deg=1)
        trend_hist = slope * x + intercept
    else:
        slope, intercept = 0.0, float(y[0] if len(y) else 0.0)
        trend_hist = np.array([intercept], dtype=float)
    resid = y - trend_hist
    sigma = float(np.std(resid)) if len(resid) else 0.0
    sigma = max(1.0, sigma)
    future_x = np.arange(len(y), len(y) + horizon, dtype=float)
    pred = np.clip(slope * future_x + intercept, 0, None)
    low = np.clip(pred - 1.64 * sigma, 0, None)
    high = np.clip(pred + 1.64 * sigma, 0, None)
    return pred, low, high, "linear_fallback"


def generate_forecasts(piv: pd.DataFrame, horizon: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if piv.empty:
        return rows

    last_month = piv.index.max()
    future_months = pd.date_range(last_month + pd.offsets.MonthBegin(1), periods=horizon, freq="MS")

    for tool in piv.columns:
        pred, low, high, method = build_forecast_with_fallback(piv[tool], horizon=horizon)
        for i, month in enumerate(future_months):
            rows.append(
                {
                    "month": month.strftime("%Y-%m"),
                    "tool": tool,
                    "predicted": int(round(float(pred[i]))),
                    "lower": int(round(float(low[i]))),
                    "upper": int(round(float(high[i]))),
                    "method": method,
                }
            )

    rows.sort(key=lambda r: (r["month"], r["tool"]))
    return rows


def detect_spikes(piv: pd.DataFrame) -> list[dict[str, Any]]:
    if piv.empty:
        return []

    events: dict[tuple[str, str, str], dict[str, Any]] = {}

    for tool in piv.columns:
        y = piv[tool].to_numpy(dtype=float)
        months = piv.index

        for i in range(1, len(y)):
            prev_raw = float(y[i - 1])
            curr_raw = float(y[i])
            prev = max(prev_raw, 1.0)
            pct = (curr_raw - prev_raw) / prev

            # Treat near-zero baselines as "new baseline" rather than inflated percentages.
            if prev_raw < 20 and curr_raw >= 100:
                key = (tool, months[i].strftime("%Y-%m"), "new_baseline_jump")
                events[key] = {
                    "tool": tool,
                    "month": months[i].strftime("%Y-%m"),
                    "event_type": "new_baseline_jump",
                    "absolute_jump": int(curr_raw - prev_raw),
                    "from_value": int(prev_raw),
                    "to_value": int(curr_raw),
                }
                continue

            if prev_raw >= 20 and pct >= 1.5 and curr_raw >= 50:
                key = (tool, months[i].strftime("%Y-%m"), "mom_spike")
                events[key] = {
                    "tool": tool,
                    "month": months[i].strftime("%Y-%m"),
                    "event_type": "mom_spike",
                    "magnitude_pct": round(pct * 100.0, 1),
                    "from_value": int(prev_raw),
                    "to_value": int(curr_raw),
                }

        if rpt is not None and len(y) >= 12 and np.sum(y) > 0:
            try:
                cps = rpt.Pelt(model="rbf").fit(y).predict(pen=max(3.0, math.log(len(y)) * 2.0))
                for cp in cps[:-1]:
                    if cp <= 0 or cp >= len(y):
                        continue
                    before = max(float(np.mean(y[:cp])), 1.0)
                    after = float(np.mean(y[cp:]))
                    shift = (after - before) / before
                    if abs(shift) >= 0.4 and (before >= 20.0 or after >= 20.0):
                        key = (tool, months[cp].strftime("%Y-%m"), "level_shift")
                        events[key] = {
                            "tool": tool,
                            "month": months[cp].strftime("%Y-%m"),
                            "event_type": "level_shift",
                            "magnitude_pct": round(shift * 100.0, 1),
                            "baseline_before": round(before, 2),
                            "baseline_after": round(after, 2),
                        }
            except Exception:
                pass

    out = list(events.values())
    def score(item: dict[str, Any]) -> float:
        if "magnitude_pct" in item:
            return abs(float(item["magnitude_pct"]))
        return float(item.get("absolute_jump", 0))

    out.sort(key=score, reverse=True)
    return out


def load_event_rows(con: duckdb.DuckDBPyConnection, parquet_path: Path) -> pd.DataFrame:
    sql = f"""
    SELECT
      anon_id,
      date,
      time,
      timestamp_ms,
      c_country,
      sc_status,
      sc_bytes,
      cs_bytes,
      time_taken,
      time_to_first_byte,
      cs_user_agent,
      cs_referer,
      cs_uri_query,
      query['sessionId'] AS session_id,
      query['app'] AS app,
      query['event'] AS event_type,
      query['path'] AS path,
      query['e.label'] AS e_label,
      query['e.action'] AS e_action,
      query['e.tab'] AS e_tab,
      query['e.value'] AS e_value,
      query['e.message'] AS e_message,
      query['e.reason.message'] AS e_reason_message,
      query['e.reason.stack'] AS e_reason_stack,
      query['e.path'] AS e_path
    FROM read_parquet('{str(parquet_path).replace("'", "''")}')
    WHERE site='Events'
      AND cs_uri_stem='/tr'
      AND traffic_type='Likely Human'
    """
    df = con.execute(sql).df()

    for field, key in {
        "session_id": "sessionId",
        "app": "app",
        "event_type": "event",
        "path": "path",
        "e_label": "e.label",
        "e_action": "e.action",
        "e_tab": "e.tab",
        "e_value": "e.value",
    }.items():
        mask = df[field].isna() & df["cs_uri_query"].notna()
        if mask.any():
            df.loc[mask, field] = df.loc[mask, "cs_uri_query"].apply(lambda s: parse_query_field(s, key))

    df["session_id"] = df["session_id"].apply(normalize_session_id)
    df = df[df["session_id"].notna()].copy()

    df["dt"] = pd.to_datetime(df["timestamp_ms"], unit="ms", utc=True, errors="coerce")
    fallback = df["dt"].isna() & df["date"].notna() & df["time"].notna()
    if fallback.any():
        dt_text = df.loc[fallback, "date"].astype(str) + " " + df.loc[fallback, "time"].astype(str)
        df.loc[fallback, "dt"] = pd.to_datetime(dt_text, utc=True, errors="coerce")
    df = df[df["dt"].notna()].copy()

    df["tool"] = [map_tool(a, p) for a, p in zip(df["app"], df["path"])]
    df["event_type"] = df["event_type"].fillna("unknown").astype(str)
    df["c_country"] = df["c_country"].fillna("-").astype(str)
    df.sort_values(["session_id", "dt"], inplace=True)
    return df


def build_session_features(events: pd.DataFrame) -> pd.DataFrame:
    """
    Build per-session feature matrix using DuckDB SQL on the in-memory events
    DataFrame.  Window functions give us richer temporal features (entry/exit
    tool, time-to-first-action, first-error position) that are cumbersome to
    derive with pandas groupby.
    """
    if events.empty:
        return pd.DataFrame()

    con = duckdb.connect()
    con.register("ev", events)

    out = con.execute("""
        WITH ordered AS (
            SELECT *,
                row_number() OVER (PARTITION BY session_id ORDER BY dt) AS rn,
                count(*) OVER (PARTITION BY session_id)                 AS total_events
            FROM ev
        ),
        tool_counts AS (
            -- count events per (session, tool) so we can pick the dominant tool
            SELECT session_id, tool, count(*) AS cnt
            FROM ev WHERE tool IS NOT NULL
            GROUP BY session_id, tool
        ),
        top_tools AS (
            SELECT session_id, arg_max(tool, cnt) AS top_tool
            FROM tool_counts GROUP BY session_id
        ),
        agg AS (
            SELECT
                session_id,
                -- identity / time
                first(anon_id ORDER BY dt)  AS anon_id,
                first(c_country ORDER BY dt) FILTER (WHERE c_country IS NOT NULL AND c_country <> '-') AS country,
                min(dt)                      AS first_dt,
                max(dt)                      AS last_dt,
                -- depth
                count(*)::BIGINT             AS events,
                count(DISTINCT path)         AS unique_paths,
                count(DISTINCT event_type)   AS unique_events,
                count(DISTINCT tool) FILTER (WHERE tool IS NOT NULL) AS unique_tools,
                -- bounce / time features
                (count(*) <= 1)::INTEGER     AS is_bounce,
                hour(min(dt))                AS start_hour_utc,
                (dayofweek(min(dt)) IN (0, 6))::INTEGER AS is_weekend,
                -- duration (minutes)
                (epoch(max(dt)) - epoch(min(dt))) / 60.0 AS duration_min,
                -- NEW: entry / exit tool (first and last non-null tool in session)
                first(tool ORDER BY dt) FILTER (WHERE tool IS NOT NULL) AS entry_tool,
                last(tool ORDER BY dt)  FILTER (WHERE tool IS NOT NULL) AS exit_tool,
                -- NEW: seconds from session start to first click (NULL if no click)
                (epoch(min(dt) FILTER (WHERE event_type='click')) - epoch(min(dt))) AS time_to_first_click_sec,
                -- NEW: normalised position (0–1) of first error (NULL if no error)
                (min(rn) FILTER (WHERE event_type='error'))::DOUBLE
                    / nullif(max(total_events), 0) AS first_error_position,
                -- event type counts
                sum(CASE WHEN event_type='click'     THEN 1 ELSE 0 END) AS event_click,
                sum(CASE WHEN event_type='error'     THEN 1 ELSE 0 END) AS event_error,
                sum(CASE WHEN event_type='hover'     THEN 1 ELSE 0 END) AS event_hover,
                sum(CASE WHEN event_type='keyboard'  THEN 1 ELSE 0 END) AS event_keyboard,
                sum(CASE WHEN event_type='pageView'  THEN 1 ELSE 0 END) AS event_pageView,
                -- tool event counts
                sum(CASE WHEN tool='EUI'          THEN 1 ELSE 0 END) AS "tool_EUI",
                sum(CASE WHEN tool='RUI'          THEN 1 ELSE 0 END) AS "tool_RUI",
                sum(CASE WHEN tool='CDE'          THEN 1 ELSE 0 END) AS "tool_CDE",
                sum(CASE WHEN tool='FTU Explorer' THEN 1 ELSE 0 END) AS "tool_FTU Explorer",
                sum(CASE WHEN tool='KG Explorer'  THEN 1 ELSE 0 END) AS "tool_KG Explorer"
            FROM ordered
            GROUP BY session_id
        )
        SELECT a.*, coalesce(t.top_tool, '') AS top_tool
        FROM agg a LEFT JOIN top_tools t USING (session_id)
    """).df()

    # Clean up nulls
    numeric_cols = out.select_dtypes(include=[np.number]).columns.tolist()
    out[numeric_cols] = out[numeric_cols].fillna(0)
    for col in ("country", "entry_tool", "exit_tool", "top_tool"):
        if col in out.columns:
            out[col] = out[col].fillna("").astype(str)

    return out


def segment_sessions(session_features: pd.DataFrame) -> dict[str, Any]:
    if KMeans is None or StandardScaler is None:
        return {"segments": [], "notes": "sklearn unavailable; segmentation skipped"}

    features = [
        "events",
        "duration_min",
        "unique_paths",
        "unique_tools",
        "is_bounce",
        "event_click",
        "event_error",
        "event_keyboard",
        "event_hover",
        "event_pageView",
    ]
    for col in features:
        if col not in session_features.columns:
            session_features[col] = 0

    X = session_features[features].astype(float)
    n = len(X)
    if n < 20:
        return {"segments": [], "notes": "insufficient sessions for clustering"}

    # Clip extreme outliers so one anomalous session does not dominate centroids.
    X_clipped = X.copy()
    for col in X_clipped.columns:
        upper = float(X_clipped[col].quantile(0.995))
        if not np.isfinite(upper):
            upper = float(X_clipped[col].max())
        X_clipped[col] = X_clipped[col].clip(lower=0, upper=max(upper, 1.0))

    k = 4
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_clipped)
    model = KMeans(n_clusters=k, random_state=42, n_init=20)
    labels = model.fit_predict(X_scaled)

    tmp = session_features.copy()
    tmp["cluster"] = labels

    def segment_name(row: pd.Series) -> str:
        if row["bounce_rate"] >= 0.9:
            return "Single-Page Visits"
        if row["avg_events"] <= 2.0:
            return "Quick Explorers"
        if row["avg_events"] >= 15.0:
            return "Power Researchers"
        if row["avg_unique_tools"] >= 1.8:
            return "Cross-Tool Users"
        if row["error_rate"] >= 0.30:
            return "Error-Heavy Sessions"
        return "Regular Researchers"

    summary: list[dict[str, Any]] = []
    for cluster_id, grp in tmp.groupby("cluster", sort=True):
        total = len(grp)
        tool_counts = grp["top_tool"].replace("", np.nan).dropna().value_counts()
        top_tool = tool_counts.idxmax() if len(tool_counts) else None
        click_col = grp["event_click"] if "event_click" in grp.columns else pd.Series(np.zeros(len(grp)), index=grp.index)
        error_col = grp["event_error"] if "event_error" in grp.columns else pd.Series(np.zeros(len(grp)), index=grp.index)

        stats = {
            "cluster_id": int(cluster_id),
            "size": int(total),
            "pct": round(100.0 * total / n, 2),
            "avg_events": round(float(grp["events"].mean()), 2),
            "avg_depth": round(float(grp["events"].mean()), 2),
            "avg_duration_min": round(float(grp["duration_min"].clip(upper=120).median()), 2),
            "avg_unique_tools": round(float(grp["unique_tools"].mean()), 2),
            "bounce_rate": round(float(grp["is_bounce"].mean()), 3),
            "click_rate": round(float(np.mean(click_col / np.maximum(grp["events"], 1))), 3),
            "error_rate": round(float(np.mean(error_col / np.maximum(grp["events"], 1))), 3),
            "peak_hour_utc": int(grp["start_hour_utc"].mode().iloc[0]),
            "top_tool": top_tool,
        }
        stats["name"] = segment_name(pd.Series(stats))
        summary.append(stats)

    name_counter: Counter[str] = Counter()
    for item in sorted(summary, key=lambda x: x["cluster_id"]):
        base_name = str(item["name"])
        name_counter[base_name] += 1
        if name_counter[base_name] > 1:
            item["name"] = f"{base_name} {name_counter[base_name]}"

    return {"segments": sorted(summary, key=lambda x: x["size"], reverse=True)}


def build_churn_dataset(events: pd.DataFrame, session_features: pd.DataFrame) -> pd.DataFrame:
    first_three = events.groupby("session_id").head(3).copy()
    first_three["event_type"] = first_three["event_type"].fillna("unknown")
    early_counts = pd.crosstab(first_three["session_id"], first_three["event_type"]).add_prefix("early_")
    early_counts.reset_index(inplace=True)

    early_paths = (
        first_three.groupby("session_id")
        .agg(early_unique_paths=("path", pd.Series.nunique), early_events=("session_id", "size"))
        .reset_index()
    )

    base = session_features[["session_id", "anon_id", "first_dt", "events", "duration_min", "unique_tools", "start_hour_utc", "is_weekend"]].copy()
    churn = base.merge(early_counts, on="session_id", how="left").merge(early_paths, on="session_id", how="left")
    churn.fillna(0, inplace=True)

    valid_anon = churn["anon_id"].notna() & (~churn["anon_id"].astype(str).isin(INVALID_ANON_IDS))
    churn = churn[valid_anon].copy()
    churn.sort_values(["anon_id", "first_dt"], inplace=True)
    churn["next_dt"] = churn.groupby("anon_id")["first_dt"].shift(-1)
    delta = churn["next_dt"] - churn["first_dt"]
    churn["returned_30d"] = ((delta <= pd.Timedelta(days=30)) & delta.notna()).astype(int)
    return churn


def train_churn_model(churn_df: pd.DataFrame) -> dict[str, Any]:
    if LogisticRegression is None or train_test_split is None or Pipeline is None:
        return {"metrics": {}, "notes": "sklearn unavailable; churn model skipped"}
    if churn_df.empty or churn_df["returned_30d"].nunique() < 2:
        return {"metrics": {}, "notes": "insufficient class diversity for churn model"}

    feature_cols = [
        "events",
        "duration_min",
        "unique_tools",
        "start_hour_utc",
        "is_weekend",
        "early_events",
        "early_unique_paths",
        "early_click",
        "early_error",
        "early_keyboard",
        "early_hover",
        "early_pageView",
    ]
    for col in feature_cols:
        if col not in churn_df.columns:
            churn_df[col] = 0

    X = churn_df[feature_cols].astype(float)
    y = churn_df["returned_30d"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
        ]
    )
    model.fit(X_train, y_train)

    prob = model.predict_proba(X_test)[:, 1]
    pred = (prob >= 0.5).astype(int)

    metrics = {
        "sessions_used": int(len(X)),
        "positive_rate": round(float(y.mean()), 4),
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, prob)), 4),
    }

    clf = model.named_steps["clf"]
    coef = clf.coef_[0]
    coef_df = pd.DataFrame({"feature": feature_cols, "weight": coef}).sort_values("weight", ascending=False)
    top_pos = coef_df.head(6).to_dict(orient="records")
    top_neg = coef_df.tail(6).sort_values("weight").to_dict(orient="records")

    churn_df = churn_df.copy()
    churn_df["return_probability"] = model.predict_proba(X)[:, 1]
    bins = pd.cut(churn_df["return_probability"], bins=np.linspace(0, 1, 11), include_lowest=True)
    bucket = (
        churn_df.groupby(bins, observed=False)
        .agg(sessions=("session_id", "size"), observed_return_rate=("returned_30d", "mean"))
        .reset_index()
    )
    bucket["probability_bucket"] = bucket["return_probability"].astype(str)
    bucket["observed_return_rate"] = bucket["observed_return_rate"].fillna(0).round(4)
    bucket = bucket[["probability_bucket", "sessions", "observed_return_rate"]]

    return {
        "metrics": metrics,
        "top_positive_features": top_pos,
        "top_negative_features": top_neg,
        "probability_buckets": bucket.to_dict(orient="records"),
    }


def build_tool_sequences(events: pd.DataFrame) -> dict[str, list[str]]:
    seqs: dict[str, list[str]] = {}
    subset = events.dropna(subset=["tool"]).sort_values(["session_id", "dt"])
    for session_id, grp in subset.groupby("session_id"):
        tools = [t for t in grp["tool"].tolist() if isinstance(t, str) and t]
        dedup: list[str] = []
        for tool in tools:
            if not dedup or dedup[-1] != tool:
                dedup.append(tool)
        if dedup:
            seqs[str(session_id)] = dedup
    return seqs


def build_transition_matrix(seqs: dict[str, list[str]]) -> dict[str, Any]:
    transitions: Counter[tuple[str, str]] = Counter()
    row_totals: Counter[str] = Counter()
    path_counts: Counter[str] = Counter()

    for seq in seqs.values():
        if len(seq) >= 2:
            path_counts[" -> ".join(seq)] += 1
        for a, b in zip(seq, seq[1:]):
            transitions[(a, b)] += 1
            row_totals[a] += 1

    rows = []
    for (src, dst), count in transitions.items():
        rows.append(
            {
                "from_tool": src,
                "to_tool": dst,
                "count": int(count),
                "probability": round(safe_ratio(count, row_totals[src]), 4),
            }
        )
    rows.sort(key=lambda x: x["count"], reverse=True)

    top_paths = [{"path": p, "count": int(c)} for p, c in path_counts.most_common(25)]
    multi_step_sessions = sum(1 for seq in seqs.values() if len(seq) >= 2)
    return {"transitions": rows, "top_paths": top_paths, "sessions_with_sequences": int(multi_step_sessions)}


def build_cross_tool_recommendations(seqs: dict[str, list[str]]) -> dict[str, Any]:
    tx = [set(seq) for seq in seqs.values() if seq]
    total = len(tx)
    if total == 0:
        return {"recommendations": []}

    tools = sorted({tool for basket in tx for tool in basket})
    counts = {tool: sum(1 for basket in tx if tool in basket) for tool in tools}
    rows = []
    for src in tools:
        src_count = counts[src]
        if src_count == 0:
            continue
        candidates = []
        for dst in tools:
            if dst == src:
                continue
            both = sum(1 for basket in tx if src in basket and dst in basket)
            support = safe_ratio(both, total)
            confidence = safe_ratio(both, src_count)
            lift = safe_ratio(confidence, safe_ratio(counts[dst], total))
            candidates.append(
                {
                    "source_tool": src,
                    "recommended_tool": dst,
                    "support": round(support, 4),
                    "confidence": round(confidence, 4),
                    "lift": round(lift, 4),
                    "co_sessions": int(both),
                }
            )

        primary = [c for c in candidates if c["lift"] > 1.0 and c["confidence"] >= 0.02 and c["co_sessions"] >= 3]
        if primary:
            primary.sort(key=lambda x: (x["lift"], x["confidence"]), reverse=True)
            for item in primary[:3]:
                item["basis"] = "lift"
                rows.append(item)
            continue

        fallback = [c for c in candidates if c["confidence"] >= 0.01 and c["co_sessions"] >= 3]
        fallback.sort(key=lambda x: (x["confidence"], x["support"]), reverse=True)
        for item in fallback[:2]:
            item["basis"] = "confidence_fallback"
            rows.append(item)

    rows.sort(key=lambda x: (x["source_tool"], -x["lift"], -x["confidence"]))
    return {"recommendations": rows}


def build_session_transactions(events: pd.DataFrame, seqs: dict[str, list[str]]) -> list[list[str]]:
    tx: list[list[str]] = []
    key_terms = {
        "feature:opacity": r"opaci",
        "feature:spatial_search": r"spatial",
        "feature:download_export": r"download|export",
        "feature:upload": r"upload",
        "feature:organ_selection": r"kidney|heart|lung|brain|colon|liver",
    }

    for session_id, grp in events.groupby("session_id"):
        items: set[str] = set()
        tools = seqs.get(str(session_id), [])
        for tool in set(tools):
            items.add(f"tool:{tool}")

        event_types = grp["event_type"].dropna().astype(str).unique().tolist()
        for event in event_types:
            items.add(f"event:{event}")

        blob_cols = ["path", "e_label", "e_action", "e_tab", "e_value"]
        parts: list[str] = []
        for col in blob_cols:
            if col in grp.columns:
                vals = grp[col].dropna().astype(str).str.lower().tolist()
                if vals:
                    parts.extend(vals)
        blob = " ".join(parts)
        for item_name, pattern in key_terms.items():
            if re.search(pattern, blob):
                items.add(item_name)

        if "event:keyboard" in items:
            items.add("feature:keyboard_navigation")

        if items:
            tx.append(sorted(items))
    return tx


def association_mining(transactions: list[list[str]]) -> dict[str, Any]:
    if not transactions:
        return {"rules": [], "notes": "no transactions"}

    if TransactionEncoder is not None and apriori is not None and association_rules is not None:
        te = TransactionEncoder()
        encoded = te.fit(transactions).transform(transactions)
        frame = pd.DataFrame(encoded, columns=te.columns_)
        freq = apriori(frame, min_support=0.02, use_colnames=True)
        if freq.empty:
            return {"rules": [], "notes": "no frequent itemsets at configured support"}
        rules = association_rules(freq, metric="lift", min_threshold=1.1)
        if rules.empty:
            return {"rules": [], "notes": "no association rules at configured thresholds"}

        rules = rules[
            (rules["antecedents"].apply(len) >= 1)
            & (rules["antecedents"].apply(len) <= 2)
            & (rules["consequents"].apply(len) == 1)
        ].copy()
        rules.sort_values(["lift", "confidence", "support"], ascending=False, inplace=True)

        out = []
        for _, row in rules.head(60).iterrows():
            out.append(
                {
                    "antecedents": sorted(list(row["antecedents"])),
                    "consequent": sorted(list(row["consequents"]))[0],
                    "support": round(float(row["support"]), 4),
                    "confidence": round(float(row["confidence"]), 4),
                    "lift": round(float(row["lift"]), 4),
                    "leverage": round(float(row["leverage"]), 4),
                }
            )
        return {"rules": out, "transaction_count": len(transactions), "method": "mlxtend_apriori"}

    # Fallback pairwise co-occurrence.
    total = len(transactions)
    item_counts: Counter[str] = Counter()
    pair_counts: Counter[tuple[str, str]] = Counter()
    for tx in transactions:
        uniq = sorted(set(tx))
        for item in uniq:
            item_counts[item] += 1
        for a, b in combinations(uniq, 2):
            pair_counts[(a, b)] += 1

    rules = []
    for (a, b), both in pair_counts.items():
        supp = safe_ratio(both, total)
        if supp < 0.02:
            continue
        conf_ab = safe_ratio(both, item_counts[a])
        conf_ba = safe_ratio(both, item_counts[b])
        lift_ab = safe_ratio(conf_ab, safe_ratio(item_counts[b], total))
        lift_ba = safe_ratio(conf_ba, safe_ratio(item_counts[a], total))
        rules.append({"antecedents": [a], "consequent": b, "support": round(supp, 4), "confidence": round(conf_ab, 4), "lift": round(lift_ab, 4)})
        rules.append({"antecedents": [b], "consequent": a, "support": round(supp, 4), "confidence": round(conf_ba, 4), "lift": round(lift_ba, 4)})
    rules.sort(key=lambda x: (x["lift"], x["confidence"], x["support"]), reverse=True)
    return {"rules": rules[:60], "transaction_count": total, "method": "pairwise_fallback"}


def train_bot_model(con: duckdb.DuckDBPyConnection, parquet_path: Path, session_features: pd.DataFrame) -> dict[str, Any]:
    if RandomForestClassifier is None or train_test_split is None:
        return {"metrics": {}, "notes": "sklearn unavailable; bot model skipped"}

    sql = f"""
    SELECT
      traffic_type,
      site,
      sc_status,
      coalesce(sc_bytes, 0) AS sc_bytes,
      coalesce(cs_bytes, 0) AS cs_bytes,
      coalesce(time_taken, 0.0) AS time_taken,
      coalesce(time_to_first_byte, 0.0) AS ttfb,
      length(coalesce(cs_uri_stem, '')) AS uri_len,
      CASE WHEN cs_uri_query IS NULL OR cs_uri_query IN ('', '-') THEN 0 ELSE 1 END AS has_query,
      length(coalesce(cs_user_agent, '')) AS ua_len,
      length(coalesce(cs_referer, '')) AS referer_len,
      try_cast(substr(time, 1, 2) AS INTEGER) AS hour_utc,
      lower(coalesce(cs_user_agent, '')) AS ua_lower
    FROM read_parquet('{str(parquet_path).replace("'", "''")}')
    WHERE traffic_type IN ('Likely Human', 'Bot', 'AI-Assistant / Bot')
      AND abs(hash(x_edge_request_id)) % 1000 < 10
    """
    df = con.execute(sql).df()
    if df.empty:
        return {"metrics": {}, "notes": "no rows sampled for bot model"}

    df["target_bot"] = (df["traffic_type"] != "Likely Human").astype(int)
    # ua_bot_hint removed: "bot|crawler|spider" in UA is circular — it just reproduces the heuristic label
    df["ua_headless_hint"] = df["ua_lower"].str.contains(r"headless|selenium|playwright", regex=True).astype(int)
    df["ua_script_hint"] = df["ua_lower"].str.contains(r"python|curl|wget|httpclient", regex=True).astype(int)

    keep = []
    for label in [0, 1]:
        part = df[df["target_bot"] == label]
        n = min(len(part), 60000)
        if n > 0:
            keep.append(part.sample(n=n, random_state=42))
    if keep:
        df = pd.concat(keep, ignore_index=True)

    y = df["target_bot"].astype(int)
    x_num = df[
        [
            "sc_status",
            "sc_bytes",
            "cs_bytes",
            "time_taken",
            "ttfb",
            "uri_len",
            "has_query",
            "ua_len",
            "referer_len",
            "hour_utc",
            "ua_headless_hint",
            "ua_script_hint",
        ]
    ].fillna(0)
    X = x_num.copy()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=18,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    prob = model.predict_proba(X_test)[:, 1]
    pred = (prob >= 0.5).astype(int)
    metrics = {
        "rows_train": int(len(X_train)),
        "rows_test": int(len(X_test)),
        "positive_rate": round(float(y.mean()), 4),
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, prob)), 4),
    }

    feat_imp = (
        pd.DataFrame({"feature": X.columns, "importance": model.feature_importances_})
        .sort_values("importance", ascending=False)
        .head(20)
    )

    suspicious = []
    if not session_features.empty:
        # Score likely-human event rows by reusing their request-level features.
        # Use a reduced sample of event requests for speed.
        # event sessions are already human-labeled; we detect suspicious outliers.
        event_sql = f"""
        SELECT
          query['sessionId'] AS session_id,
          site,
          sc_status,
          coalesce(sc_bytes, 0) AS sc_bytes,
          coalesce(cs_bytes, 0) AS cs_bytes,
          coalesce(time_taken, 0.0) AS time_taken,
          coalesce(time_to_first_byte, 0.0) AS ttfb,
          length(coalesce(cs_uri_stem, '')) AS uri_len,
          CASE WHEN cs_uri_query IS NULL OR cs_uri_query IN ('', '-') THEN 0 ELSE 1 END AS has_query,
          length(coalesce(cs_user_agent, '')) AS ua_len,
          length(coalesce(cs_referer, '')) AS referer_len,
          try_cast(substr(time, 1, 2) AS INTEGER) AS hour_utc,
          lower(coalesce(cs_user_agent, '')) AS ua_lower
        FROM read_parquet('{str(parquet_path).replace("'", "''")}')
        WHERE site='Events'
          AND cs_uri_stem='/tr'
          AND traffic_type='Likely Human'
          AND query['sessionId'] IS NOT NULL
        """
        ev = con.execute(event_sql).df()
        ev["session_id"] = ev["session_id"].apply(normalize_session_id)
        ev = ev[ev["session_id"].notna()].copy()
        ev["ua_bot_hint"] = ev["ua_lower"].str.contains(r"bot|crawler|spider", regex=True).astype(int)
        ev["ua_headless_hint"] = ev["ua_lower"].str.contains(r"headless|selenium|playwright", regex=True).astype(int)
        ev["ua_script_hint"] = ev["ua_lower"].str.contains(r"python|curl|wget|httpclient", regex=True).astype(int)

        ev_num = ev[
            [
                "sc_status",
                "sc_bytes",
                "cs_bytes",
                "time_taken",
                "ttfb",
                "uri_len",
                "has_query",
                "ua_len",
                "referer_len",
                "hour_utc",
                "ua_bot_hint",
                "ua_headless_hint",
                "ua_script_hint",
            ]
        ].fillna(0)
        ev_X = ev_num.reindex(columns=X.columns, fill_value=0)
        ev["bot_probability"] = model.predict_proba(ev_X)[:, 1]

        sess_prob = (
            ev.groupby("session_id")
            .agg(mean_bot_score=("bot_probability", "mean"), max_bot_score=("bot_probability", "max"), request_count=("session_id", "size"))
            .reset_index()
            .sort_values("mean_bot_score", ascending=False)
            .head(80)
        )
        sess_prob = sess_prob.merge(
            session_features[["session_id", "country", "top_tool", "events"]],
            on="session_id",
            how="left",
        )
        suspicious = sess_prob.to_dict(orient="records")

    return {
        "metrics": metrics,
        "feature_importance": feat_imp.to_dict(orient="records"),
        "suspicious_sessions": suspicious,
    }


def cluster_errors(events: pd.DataFrame) -> dict[str, Any]:
    if TfidfVectorizer is None or KMeans is None:
        return {"clusters": [], "notes": "sklearn unavailable; error clustering skipped"}

    err = events[(events["event_type"] == "error") | events["e_message"].notna()].copy()
    if err.empty:
        return {"clusters": [], "notes": "no error events"}

    text_cols = ["e_message", "e_reason_message", "e_reason_stack", "path", "e_path"]
    for col in text_cols:
        if col not in err.columns:
            err[col] = ""
    err["text"] = (
        err[text_cols]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
        .str.lower()
        .str.replace(r"https?://\S+", " ", regex=True)
        .str.replace(r"[^a-z0-9_ ]", " ", regex=True)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )
    err = err[err["text"].str.len() > 0].copy()
    if len(err) < 200:
        return {"clusters": [], "notes": "not enough error text rows"}

    n_clusters = min(8, max(4, int(round(math.sqrt(len(err) / 500.0)))))
    vec = TfidfVectorizer(max_features=2500, ngram_range=(1, 2), stop_words="english", min_df=5)
    X = vec.fit_transform(err["text"])
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=20)
    labels = km.fit_predict(X)
    err["cluster"] = labels

    terms = np.array(vec.get_feature_names_out())
    centers = km.cluster_centers_.argsort(axis=1)[:, ::-1]

    def label_cluster(top_terms: list[str], sample: str) -> str:
        s = sample.lower()
        terms_str = " ".join(top_terms)
        if "127.0.0.1" in s or "localhost" in s:
            return "Dev localhost (noise)"
        if "svg" in s and ("tag not found" in s or "tag not" in s):
            return "Malformed SVG icon"
        if "error retrieving icon" in s and "404" in s:
            return "KG Explorer icon 404"
        if "error retrieving icon" in s:
            return "KG Explorer icon network error"
        if any(t in terms_str for t in ["chart", "visualizer", "pop", "bar graph"]):
            return "HRA Pop Visualizer crash"
        if "0 unknown error" in s or "unknown error" in s:
            return "HTTP network failure"
        if "404" in s and "http failure" in s:
            return "404 Not Found"
        return "Misc error"

    clusters = []
    for cluster_id in range(n_clusters):
        grp = err[err["cluster"] == cluster_id]
        if grp.empty:
            continue
        top_terms = terms[centers[cluster_id, :8]].tolist()
        sample = grp.iloc[0]
        sample_msg = str(sample.get("e_reason_message") or sample.get("e_message") or sample.get("text"))[:220]
        clusters.append(
            {
                "cluster_id": int(cluster_id),
                "label": label_cluster(top_terms, sample_msg),
                "count": int(len(grp)),
                "pct": round(100.0 * len(grp) / len(err), 2),
                "top_terms": top_terms,
                "sample_error": sample_msg,
            }
        )
    # Merge clusters that share the same label (K-means can split one root cause)
    merged: dict[str, dict] = {}
    for c in clusters:
        lbl = c["label"]
        if lbl not in merged:
            merged[lbl] = c.copy()
        else:
            merged[lbl]["count"] += c["count"]
    total_merged = sum(c["count"] for c in merged.values())
    for c in merged.values():
        c["pct"] = round(100.0 * c["count"] / total_merged, 2)

    result = sorted(merged.values(), key=lambda x: x["count"], reverse=True)
    return {"clusters": result, "total_error_rows": int(len(err))}


def detect_geo_anomalies(con: duckdb.DuckDBPyConnection, parquet_path: Path, session_features: pd.DataFrame) -> dict[str, Any]:
    sql = f"""
    SELECT
      c_country,
      count(*)::BIGINT AS total_requests,
      count(*) FILTER (WHERE traffic_type='Likely Human')::BIGINT AS human_requests,
      count(*) FILTER (WHERE traffic_type='Bot')::BIGINT AS bot_requests,
      count(*) FILTER (WHERE traffic_type='AI-Assistant / Bot')::BIGINT AS ai_bot_requests,
      count(DISTINCT cs_user_agent)::BIGINT AS ua_cardinality,
      avg(time_taken) AS avg_time_taken,
      avg(sc_bytes) AS avg_sc_bytes
    FROM read_parquet('{str(parquet_path).replace("'", "''")}')
    WHERE c_country IS NOT NULL
      AND c_country <> '-'
    GROUP BY 1
    """
    geo = con.execute(sql).df()
    if geo.empty:
        return {"suspicious_countries": []}

    sess_geo = (
        session_features.groupby("country")
        .agg(session_count=("session_id", "size"), avg_session_depth=("events", "mean"))
        .reset_index()
        .rename(columns={"country": "c_country"})
    )
    geo = geo.merge(sess_geo, on="c_country", how="left")
    geo["session_count"] = geo["session_count"].fillna(0)
    geo["avg_session_depth"] = geo["avg_session_depth"].fillna(0)
    geo["bot_ratio"] = (geo["bot_requests"] + geo["ai_bot_requests"]) / np.maximum(geo["total_requests"], 1)
    geo["ai_ratio"] = geo["ai_bot_requests"] / np.maximum(geo["total_requests"], 1)
    geo["ua_per_1k_requests"] = 1000.0 * geo["ua_cardinality"] / np.maximum(geo["total_requests"], 1)
    geo["requests_per_session"] = geo["total_requests"] / np.maximum(geo["session_count"], 1)
    geo["human_share"] = geo["human_requests"] / np.maximum(geo["total_requests"], 1)

    feature_cols = [
        "bot_ratio",
        "ai_ratio",
        "ua_per_1k_requests",
        "requests_per_session",
        "avg_session_depth",
        "avg_time_taken",
        "avg_sc_bytes",
        "human_share",
        "session_count",
    ]
    X = geo[feature_cols].copy()
    for col in ["requests_per_session", "ua_per_1k_requests", "session_count", "avg_sc_bytes"]:
        X[col] = np.log1p(X[col].astype(float))
    X = X.fillna(0)

    if IsolationForest is not None and len(geo) >= 20:
        model = IsolationForest(contamination=0.12, random_state=42)
        pred = model.fit_predict(X)
        score = -model.score_samples(X)
        geo["is_anomaly"] = (pred == -1).astype(int)
        geo["anomaly_score"] = score
    else:
        z = (X - X.mean()) / (X.std(ddof=0) + 1e-9)
        geo["anomaly_score"] = np.abs(z).mean(axis=1)
        threshold = geo["anomaly_score"].quantile(0.88)
        geo["is_anomaly"] = (geo["anomaly_score"] >= threshold).astype(int)

    suspicious = geo[geo["is_anomaly"] == 1].copy()
    # Keep anomalies that are likely actionable, not simply large traffic markets.
    q_bot = float(geo["bot_ratio"].quantile(0.9))
    q_req_per_sess = float(geo["requests_per_session"].quantile(0.9))
    q_depth = float(geo["avg_session_depth"].quantile(0.9))
    suspicious = suspicious[
        (suspicious["bot_ratio"] >= q_bot)
        | (suspicious["requests_per_session"] >= q_req_per_sess)
        | (suspicious["avg_session_depth"] >= q_depth)
    ].copy()
    suspicious["likely_artifact"] = (
        (suspicious["bot_ratio"] >= 0.7)
        | ((suspicious["session_count"] < 25) & (suspicious["total_requests"] > 250))
    )
    q95_total = float(geo["total_requests"].quantile(0.95))
    focused = suspicious[(suspicious["total_requests"] <= q95_total) | (suspicious["likely_artifact"])].copy()
    if not focused.empty:
        suspicious = focused
    suspicious = suspicious.sort_values(["likely_artifact", "anomaly_score"], ascending=[False, False]).head(25)

    cols = [
        "c_country",
        "anomaly_score",
        "total_requests",
        "human_requests",
        "bot_requests",
        "ai_bot_requests",
        "bot_ratio",
        "session_count",
        "avg_session_depth",
        "likely_artifact",
    ]
    return {
        "suspicious_countries": suspicious[cols]
        .assign(bot_ratio=lambda d: d["bot_ratio"].round(4), anomaly_score=lambda d: d["anomaly_score"].round(4))
        .to_dict(orient="records")
    }


def run_pipeline(parquet_path: Path, output_dir: Path, forecast_horizon: int) -> dict[str, Any]:
    con = duckdb.connect()
    con.execute("PRAGMA threads=4")

    monthly_visits = load_monthly_tool_visits(con, parquet_path)
    piv = monthly_pivot(monthly_visits)
    forecast = generate_forecasts(piv, horizon=forecast_horizon)
    spikes = detect_spikes(piv)

    events = load_event_rows(con, parquet_path)
    session_features = build_session_features(events)
    segments = segment_sessions(session_features)
    churn_ds = build_churn_dataset(events, session_features)
    churn = train_churn_model(churn_ds)

    seqs = build_tool_sequences(events)
    transitions = build_transition_matrix(seqs)
    cross_tool = build_cross_tool_recommendations(seqs)
    transactions = build_session_transactions(events, seqs)
    associations = association_mining(transactions)

    bot_scores = train_bot_model(con, parquet_path, session_features)
    error_clusters = cluster_errors(events)
    geo_anoms = detect_geo_anomalies(con, parquet_path, session_features)

    output_dir.mkdir(parents=True, exist_ok=True)
    write_json(output_dir / "forecast_tool_visits.json", forecast)
    write_json(output_dir / "detected_events.json", spikes)
    write_json(output_dir / "user_segments.json", segments)
    write_json(output_dir / "return_probability.json", churn)
    write_json(output_dir / "transition_matrix.json", transitions)
    write_json(output_dir / "feature_cooccurrence.json", associations)
    write_json(output_dir / "bot_scores.json", bot_scores)
    write_json(output_dir / "error_clusters.json", error_clusters)
    write_json(output_dir / "suspicious_countries.json", geo_anoms)
    write_json(output_dir / "cross_tool_recommendations.json", cross_tool)

    meta = {
        "generated_at_utc": ts_utc(),
        "input_parquet": str(parquet_path),
        "output_dir": str(output_dir),
        "forecast_horizon_months": forecast_horizon,
        "rows": {
            "monthly_points": int(len(monthly_visits)),
            "event_rows": int(len(events)),
            "sessions": int(len(session_features)),
            "transactions": int(len(transactions)),
        },
        "outputs": [
            "forecast_tool_visits.json",
            "detected_events.json",
            "user_segments.json",
            "return_probability.json",
            "transition_matrix.json",
            "feature_cooccurrence.json",
            "bot_scores.json",
            "error_clusters.json",
            "suspicious_countries.json",
            "cross_tool_recommendations.json",
        ],
    }
    write_json(output_dir / "ml_pipeline_metadata.json", meta)
    return meta


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate ML insight JSON files from HRA parquet logs")
    parser.add_argument(
        "--input-parquet",
        default="data/2026-01-13_hra-logs.parquet",
        help="Path to source parquet log file",
    )
    parser.add_argument(
        "--output-dir",
        default="public/data",
        help="Directory where ML JSON outputs will be written",
    )
    parser.add_argument(
        "--forecast-horizon",
        type=int,
        default=6,
        help="Number of future months to forecast per tool",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    parquet = Path(args.input_parquet)
    out_dir = Path(args.output_dir)

    if not parquet.exists():
        raise FileNotFoundError(f"Input parquet not found: {parquet}")

    meta = run_pipeline(parquet_path=parquet, output_dir=out_dir, forecast_horizon=args.forecast_horizon)
    print("ML pipeline complete.")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
