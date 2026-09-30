"""Discover and download real data files (CSV/XLS/XLSX/JSON/ZIP/PDF/TXT) from
official Indian government portals.

No scraping of *values* - this only follows links published by the portal and
downloads the linked document. Every file is kept in data/raw/ and recorded in
the staging manifest.

    python scripts/collect/portal_files.py --preset maharashtra
    python scripts/collect/portal_files.py --preset tamil_nadu
    python scripts/collect/portal_files.py --preset national
    python scripts/collect/portal_files.py --url <index-url> --state maharashtra --limit 40
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import (  # noqa: E402
    RAW, ensure_dirs, fetch_bytes, log, record, sha256_file, today, write_failure,
)

DATA_EXT = (".csv", ".xls", ".xlsx", ".json", ".zip", ".pdf", ".txt", ".tsv", ".xml")

PRESETS = {
    # (state slug for the raw folder, [(index_url, organisation), ...])
    "maharashtra": ("maharashtra", [
        ("https://mahasdb.maharashtra.gov.in/home.do",
         "Maharashtra State Data Bank, Directorate of Economics & Statistics"),
        ("https://krishi.maharashtra.gov.in/",
         "Maharashtra Agriculture Department (Krishi)"),
        ("https://msamb.com/",
         "Maharashtra State Agricultural Marketing Board"),
    ]),
    "tamil_nadu": ("tamil_nadu", [
        ("https://agrimark.tn.gov.in/",
         "Tamil Nadu Agricultural Marketing (agrimark.tn.gov.in)"),
        ("https://www.tn.gov.in/department/2",
         "Tamil Nadu Agriculture Department"),
    ]),
    "national": ("national", [
        ("https://agriwelfare.gov.in/",
         "Ministry of Agriculture & Farmers Welfare, Government of India"),
        ("https://nhb.gov.in/",
         "National Horticulture Board, Government of India"),
        ("https://soilhealth.dac.gov.in/",
         "Soil Health Card scheme, Department of Agriculture & Cooperation"),
    ]),
}


def extract_links(html: str, base_url: str) -> list[str]:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")
    out, seen = [], set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.lower().startswith(("javascript:", "mailto:", "#")):
            continue
        full = urljoin(base_url, href)
        if full in seen:
            continue
        seen.add(full)
        out.append(full)
    return out


def looks_like_data(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(DATA_EXT)


def safe_name(url: str) -> str:
    p = urlparse(url)
    name = Path(p.path).name or "index"
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    if not name or name in (".", ".."):
        name = "file"
    if not name.lower().endswith(DATA_EXT):
        name += ".bin"
    return name[:150]


def fetch_index(url: str, lax_ssl: bool = True):
    payload, status, mode = fetch_bytes(url, timeout=60, lax_ssl=lax_ssl)
    if payload is None:
        return None, status, mode
    for enc in ("utf-8", "latin-1"):
        try:
            return payload.decode(enc), "OK", mode
        except UnicodeDecodeError:
            continue
    return payload.decode("utf-8", "replace"), "OK", mode


def crawl(url: str, org: str, state_slug: str, category: str, limit: int,
          follow_depth: int = 0) -> dict:
    html, status, _mode = fetch_index(url)
    if html is None:
        write_failure(f"portal_{state_slug}_{safe_name(url)}",
                      {"organization": org, "url": url, "status": status,
                       "classification": status})
        log(f"INDEX FAIL {url} status={status}")
        return {"index": url, "status": status, "downloaded": 0, "found": 0, "bytes": 0}

    links = extract_links(html, url)
    data_links = [l for l in links if looks_like_data(l)]
    subpages = [l for l in links if not looks_like_data(l)
                and urlparse(l).netloc == urlparse(url).netloc
                and re.search(r"(download|report|statistic|publication|data)", l, re.I)]
    if follow_depth > 0:
        for sp in subpages[:20]:
            sub_html, s2, _ = fetch_index(sp)
            if sub_html is None:
                continue
            for l in extract_links(sub_html, sp):
                if looks_like_data(l):
                    data_links.append(l)
            record({
                "source_id": f"portal_subpage_{safe_name(sp)}", "organization": org,
                "dataset_name": f"Index page inspected: {sp}", "category": category,
                "state": state_slug, "url": sp, "download_url": "",
                "file_name": "", "file_type": "HTML", "retrieval_date": today(),
                "publication_year": "", "coverage_start": "", "coverage_end": "",
                "geographic_level": "", "license": "Government of India / State Government",
                "status": "DOWNLOADED", "notes": "index page only, no file",
            })

    seen, downloaded, nbytes, got = set(), 0, 0, []
    for link in data_links:
        if downloaded >= limit:
            break
        nm = safe_name(link)
        if nm in seen:
            continue
        seen.add(nm)
        dest = RAW / state_slug / category / nm
        payload, status2, dl_mode = fetch_bytes(link, timeout=180, lax_ssl=True)
        if payload is None or len(payload) < 64:
            write_failure(f"portal_{state_slug}_{nm}",
                          {"organization": org, "url": link, "status": status2,
                           "classification": status2,
                           "bytes": 0 if payload is None else len(payload)})
            log(f"  FAIL {nm} status={status2}")
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists() and dest.stat().st_size == len(payload):
            log(f"  keep {nm} ({len(payload)} bytes, already present)")
        else:
            dest.write_bytes(payload)
        downloaded += 1
        nbytes += len(payload)
        got.append(nm)
        record({
            "source_id": f"portal_{state_slug}_{nm}",
            "organization": org,
            "dataset_name": nm, "category": category, "state": state_slug,
            "url": url, "download_url": link,
            "file_name": f"data/raw/{state_slug}/{category}/{nm}",
            "file_type": Path(nm).suffix.lstrip(".").upper(),
            "retrieval_date": today(), "publication_year": "",
            "coverage_start": "", "coverage_end": "", "geographic_level": "",
            "license": "Government of India / State Government (public publication)",
            "status": "DOWNLOADED",
            "notes": f"discovered from {url}; TLS mode={dl_mode}",
            "sha256": sha256_file(dest), "bytes": dest.stat().st_size,
        })
        log(f"  ok   {nm} ({len(payload)} bytes)")

    log(f"{url}: {downloaded} files downloaded, {len(data_links)} data links found")
    return {"index": url, "status": "OK", "downloaded": downloaded,
            "found": len(data_links), "bytes": nbytes, "files": got}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preset", choices=sorted(PRESETS))
    ap.add_argument("--url")
    ap.add_argument("--state", default="national")
    ap.add_argument("--category", default="portal")
    ap.add_argument("--limit", type=int, default=25)
    ap.add_argument("--follow-depth", type=int, default=0)
    a = ap.parse_args()
    ensure_dirs()
    results = []
    if a.preset:
        slug, sites = PRESETS[a.preset]
        for url, org in sites:
            results.append(crawl(url, org, slug, a.category, a.limit, a.follow_depth))
    elif a.url:
        results.append(crawl(a.url, "official portal", a.state, a.category, a.limit,
                             a.follow_depth))
    else:
        raise SystemExit("pass --preset or --url")
    total = sum(r["downloaded"] for r in results)
    log(f"TOTAL downloaded this run: {total} files")
    p = RAW / "reference" / "portal_crawl_summary.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    existing = []
    if p.exists():
        try:
            existing = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            existing = []
    existing.extend(results)
    p.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
