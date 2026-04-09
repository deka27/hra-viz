#!/usr/bin/env python3
"""
Fetch all CNS data from the cns-iu/cns-website GitHub repo.

Fetches publications, events, funding, and news — all from YAML files
in the repo's content/ directory.

Outputs:
  public/data/cns/cns_publications.json  — 405+ publications (1992–2026)
  public/data/cns/cns_events.json        — 999+ events (1999–2026)
  public/data/cns/cns_funding.json       — 81 grants ($42.9M total)
  public/data/cns/cns_news.json          — 187 news articles (2003–2026)

Usage:
    python data_processing/fetch_cns_github.py
    python data_processing/fetch_cns_github.py --out public/data/cns
"""

import json
import subprocess
import argparse
import yaml
from pathlib import Path
from typing import Any


REPO = "cns-iu/cns-website"


# ── GitHub helpers ────────────────────────────────────────────────────────────

def gh_raw(path: str) -> str:
    """Fetch raw file content from the repo."""
    result = subprocess.run(
        ["gh", "api", f"repos/{REPO}/contents/{path}", "-H", "Accept: application/vnd.github.raw+json"],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return result.stdout


def list_dirs(path: str) -> list:
    """List directory names in a repo path."""
    result = subprocess.run(
        ["gh", "api", f"repos/{REPO}/contents/{path}"],
        capture_output=True, text=True, timeout=30,
    )
    items = json.loads(result.stdout)
    return sorted([i["name"] for i in items if i["type"] == "dir"])


def fetch_yaml_entries(content_path: str) -> list:
    """Fetch all data.yaml entries from a content directory."""
    print(f"  Listing {content_path}...")
    dirs = list_dirs(content_path)
    print(f"  Found {len(dirs)} entries")

    entries = []
    errors = 0
    for i, d in enumerate(dirs):
        if (i + 1) % 50 == 0:
            print(f"  Fetching {i + 1}/{len(dirs)}...")
        try:
            raw = gh_raw(f"{content_path}/{d}/data.yaml")
            data = yaml.safe_load(raw)
            if data:
                entries.append(data)
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"    Warning: {d}: {e}")
    if errors > 3:
        print(f"    ... and {errors - 3} more errors")
    return entries


# ── Processors ────────────────────────────────────────────────────────────────

def process_publications(entries: list) -> list:
    """Process raw publication entries into clean JSON."""
    articles = []
    for data in entries:
        if not data.get("title"):
            continue

        date_str = str(data.get("date", ""))
        pub_date = date_str[:10] if date_str and len(date_str) >= 4 else ""

        authors_raw = data.get("authors", []) or []
        authors = []
        for a in authors_raw[:5]:
            name = a.replace("-", " ").title() if isinstance(a, str) else str(a)
            authors.append(name)
        if len(authors_raw) > 5:
            authors.append("et al.")

        links = data.get("links", []) or []
        url = ""
        if data.get("doi"):
            url = f"https://doi.org/{data['doi']}" if not data["doi"].startswith("http") else data["doi"]
        elif links:
            url = links[0]

        articles.append({
            "slug": data.get("slug", ""),
            "title": data["title"],
            "pub_date": pub_date,
            "doi": data.get("doi", ""),
            "journal": data.get("venue", "") or data.get("publisher", "") or "",
            "authors": authors,
            "type": data.get("type", ""),
            "url": url,
        })

    articles.sort(key=lambda a: a.get("pub_date", ""), reverse=True)
    return articles


def process_events(entries: list) -> list:
    """Process raw event entries into clean JSON."""
    events = []
    for e in entries:
        if not e.get("title") or not e.get("dateStart"):
            continue
        events.append({
            "slug": e.get("slug", ""),
            "title": e["title"].strip(),
            "type": e.get("type", "other"),
            "location": e.get("location", ""),
            "date_start": str(e["dateStart"])[:10],
            "date_end": str(e.get("dateEnd", e["dateStart"]))[:10],
            "link": e.get("link", ""),
        })
    events.sort(key=lambda x: x["date_start"], reverse=True)
    return events


def process_funding(entries: list) -> list:
    """Process raw funding entries into clean JSON."""
    funds = []
    for f in entries:
        if not f.get("title") or not f.get("dateStart"):
            continue
        funds.append({
            "slug": f.get("slug", ""),
            "name": f.get("name", ""),
            "title": f["title"].strip(),
            "funder": f.get("funder", ""),
            "amount": f.get("amount", 0) or 0,
            "received_amount": f.get("receivedAmount", 0) or 0,
            "investigators": f.get("investigators", []) or [],
            "date_start": str(f["dateStart"])[:10],
            "date_end": str(f.get("dateEnd", f["dateStart"]))[:10],
            "type": f.get("type", ""),
        })
    funds.sort(key=lambda x: x["date_start"], reverse=True)
    return funds


def process_news(entries: list) -> list:
    """Process raw news entries into clean JSON."""
    news = []
    for n in entries:
        if not n.get("title") or not n.get("date"):
            continue
        news.append({
            "slug": n.get("slug", ""),
            "title": n["title"].strip(),
            "date": str(n["date"])[:10],
            "description": (n.get("description", "") or "").strip()[:200],
            "publisher": n.get("publisher", ""),
            "link": n.get("link", ""),
            "media_type": n.get("mediaType", ""),
        })
    news.sort(key=lambda x: x["date"], reverse=True)
    return news


# ── Helpers ───────────────────────────────────────────────────────────────────

def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def year_summary(items: list, date_key: str) -> dict:
    years: dict = {}
    for item in items:
        y = item.get(date_key, "")[:4] if len(item.get(date_key, "")) >= 4 else "unknown"
        years[y] = years.get(y, 0) + 1
    return years


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Fetch all CNS data from cns-iu/cns-website GitHub repo")
    parser.add_argument("--out", default="public/data/cns", help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Publications
    print("1/4  Fetching publications...")
    raw_pubs = fetch_yaml_entries("content/publications")
    pubs = process_publications(raw_pubs)
    write_json(out_dir / "cns_publications.json", pubs)
    print(f"     \u2713 {len(pubs)} publications")

    # 2. Events
    print("\n2/4  Fetching events...")
    raw_events = fetch_yaml_entries("content/events")
    events = process_events(raw_events)
    write_json(out_dir / "cns_events.json", events)
    print(f"     \u2713 {len(events)} events")

    # 3. Funding
    print("\n3/4  Fetching funding...")
    raw_funding = fetch_yaml_entries("content/funding")
    funding = process_funding(raw_funding)
    write_json(out_dir / "cns_funding.json", funding)
    total_funding = sum(f["amount"] for f in funding)
    print(f"     \u2713 {len(funding)} grants (${total_funding:,.0f} total)")

    # 4. News
    print("\n4/4  Fetching news...")
    raw_news = fetch_yaml_entries("content/news")
    news = process_news(raw_news)
    write_json(out_dir / "cns_news.json", news)
    print(f"     \u2713 {len(news)} articles")

    # Summary
    print(f"\n{'='*50}")
    print(f"\u2713 All done \u2014 4 files in {out_dir}/")
    print(f"  Publications: {len(pubs)} ({min(year_summary(pubs, 'pub_date'))}–{max(year_summary(pubs, 'pub_date'))})")
    print(f"  Events:       {len(events)} ({min(year_summary(events, 'date_start'))}–{max(year_summary(events, 'date_start'))})")
    print(f"  Funding:      {len(funding)} grants, ${total_funding:,.0f}")
    print(f"  News:         {len(news)} articles ({min(year_summary(news, 'date'))}–{max(year_summary(news, 'date'))})")


if __name__ == "__main__":
    main()
