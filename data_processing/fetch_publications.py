#!/usr/bin/env python3
"""
Fetch HRA-related publications from PubMed via NCBI E-utilities.

Outputs public/data/publications.json for the analytics dashboard.
Free API, no auth key needed — just requires tool + email params.

Usage:
    python data_processing/fetch_publications.py
    python data_processing/fetch_publications.py --out public/data
"""

import json
import time
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlencode

BASE_ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
BASE_EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

TOOL = "hra-viz"
EMAIL = "hra-analytics@indiana.edu"

# Search terms — union of HRA-related queries
SEARCH_TERMS = [
    '"Human Reference Atlas"',
    '"HuBMAP" AND "atlas"',
    '"Common Coordinate Framework" AND "human"',
]


def esearch(term: str, retmax: int = 500) -> list[str]:
    """Search PubMed and return PMIDs."""
    params = {
        "db": "pubmed",
        "term": term,
        "retmode": "json",
        "retmax": retmax,
        "sort": "pub_date",
        "tool": TOOL,
        "email": EMAIL,
    }
    url = f"{BASE_ESEARCH}?{urlencode(params)}"
    req = Request(url, headers={"User-Agent": f"{TOOL}/1.0"})
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    return data.get("esearchresult", {}).get("idlist", [])


def efetch_batch(pmids: list[str]) -> list[dict]:
    """Fetch article metadata for a batch of PMIDs (max ~200 per call)."""
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "rettype": "abstract",
        "tool": TOOL,
        "email": EMAIL,
    }
    url = f"{BASE_EFETCH}?{urlencode(params)}"
    req = Request(url, headers={"User-Agent": f"{TOOL}/1.0"})
    with urlopen(req, timeout=60) as resp:
        xml_data = resp.read()

    root = ET.fromstring(xml_data)
    articles = []

    for article_el in root.findall(".//PubmedArticle"):
        citation = article_el.find("MedlineCitation")
        if citation is None:
            continue

        pmid_el = citation.find("PMID")
        pmid = pmid_el.text if pmid_el is not None else ""

        art = citation.find("Article")
        if art is None:
            continue

        title_el = art.find("ArticleTitle")
        title = "".join(title_el.itertext()) if title_el is not None else ""

        # Publication date
        pub_date_str = ""
        journal = art.find("Journal")
        if journal is not None:
            jpd = journal.find("JournalIssue/PubDate")
            if jpd is not None:
                year = jpd.findtext("Year", "")
                month = jpd.findtext("Month", "")
                day = jpd.findtext("Day", "")
                if year:
                    # Convert month name to number
                    month_num = _month_to_num(month)
                    pub_date_str = f"{year}-{month_num:02d}" if month_num else year
                    if day:
                        pub_date_str += f"-{int(day):02d}"

        # Journal name
        journal_name = ""
        if journal is not None:
            jt = journal.find("Title")
            if jt is not None:
                journal_name = jt.text or ""

        # DOI
        doi = ""
        for eid in art.findall("ELocationID"):
            if eid.get("EIdType") == "doi":
                doi = eid.text or ""
                break
        if not doi:
            article_ids = article_el.find("PubmedData/ArticleIdList")
            if article_ids is not None:
                for aid in article_ids.findall("ArticleId"):
                    if aid.get("IdType") == "doi":
                        doi = aid.text or ""
                        break

        # Authors (first 5)
        authors = []
        author_list = art.find("AuthorList")
        if author_list is not None:
            for auth in author_list.findall("Author")[:5]:
                last = auth.findtext("LastName", "")
                initials = auth.findtext("Initials", "")
                if last:
                    authors.append(f"{last} {initials}".strip())
            if len(author_list.findall("Author")) > 5:
                authors.append("et al.")

        articles.append({
            "pmid": pmid,
            "title": title,
            "pub_date": pub_date_str,
            "doi": doi,
            "journal": journal_name,
            "authors": authors,
        })

    return articles


_MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

def _month_to_num(m: str) -> int:
    """Convert month name/abbreviation to number. Returns 0 if unknown."""
    if not m:
        return 0
    if m.isdigit():
        return int(m)
    return _MONTH_MAP.get(m[:3].lower(), 0)


def fetch_all() -> list[dict]:
    """Search all terms, deduplicate, fetch metadata."""
    all_pmids: set[str] = set()

    for term in SEARCH_TERMS:
        print(f"  Searching: {term}")
        pmids = esearch(term)
        print(f"    Found {len(pmids)} results")
        all_pmids.update(pmids)
        time.sleep(0.4)  # respect 3 req/sec limit

    print(f"  Total unique PMIDs: {len(all_pmids)}")

    # Fetch in batches of 200
    pmid_list = sorted(all_pmids)
    articles: list[dict] = []
    for i in range(0, len(pmid_list), 200):
        batch = pmid_list[i : i + 200]
        print(f"  Fetching metadata for {len(batch)} articles...")
        articles.extend(efetch_batch(batch))
        time.sleep(0.4)

    # Sort by publication date descending
    articles.sort(key=lambda a: a.get("pub_date", ""), reverse=True)
    return articles


def main():
    parser = argparse.ArgumentParser(description="Fetch HRA publications from PubMed")
    parser.add_argument("--out", default="public/data", help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "publications.json"

    print("Fetching HRA-related publications from PubMed...")
    articles = fetch_all()

    out_path.write_text(json.dumps(articles, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✓ {out_path} — {len(articles)} publications")


if __name__ == "__main__":
    main()
