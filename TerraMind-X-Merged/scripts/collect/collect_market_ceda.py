"""Collect district-level mandi prices and arrivals for TN + Maharashtra.

Primary source: CEDA AgMarkNet API (Ashoka University, Centre for Economic Data
& Analysis) which republishes the Directorate of Marketing & Inspection /
AGMARKNET daily market series.
  https://agmarknet.ceda.ashoka.edu.in/

Fallback (documented, official): data.gov.in daily mandi resource
  https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24

Raw API responses are stored verbatim under data/raw/<state>/market/ceda/.
Nothing is fabricated: an empty API response stays an empty file plus a
failure record.

Usage:
    python scripts/collect/collect_market_ceda.py reference
    python scripts/collect/collect_market_ceda.py fetch --start-year 2015 --end-year 2025
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import (  # noqa: E402
    RAW, ensure_dirs, http_get_json, log, record, sha256_file, today, write_failure,
)

BASE = "https://agmarknet.ceda.ashoka.edu.in/api"
CEDA_STATE_ID = {"maharashtra": 27, "tamil_nadu": 33}
STATE_NAME = {"maharashtra": "Maharashtra", "tamil_nadu": "Tamil Nadu"}

# Documented commodity shortlist: major field crops of TN + Maharashtra plus the
# main horticultural crops. Matching is done against the live /api/commodities
# list, so only commodity_ids that really exist are used.
COMMODITY_PATTERNS = [
    "paddy", "rice", "wheat", "maize", "jowar", "bajra", "ragi", "sorghum",
    "groundnut", "cotton", "sugarcane", "arhar", "tur", "gram", "bengal gram",
    "soyabean", "soybean", "black gram", "green gram", "horse gram", "cowpea",
    "sesamum", "sunflower", "safflower", "castor", "mustard", "niger",
    "onion", "tomato", "potato", "brinjal", "cabbage", "cauliflower", "bhendi",
    "banana", "mango", "grapes", "orange", "sapota", "papaya", "pomegranate",
    "coconut", "arecanut", "cashewnut", "chilli", "turmeric", "coriander",
    "ginger", "garlic", "tapioca", "sweet potato", "drumstick", "tamarind",
    "guar", "jute", "pearl millet", "finger millet",
]


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(text).lower()).strip("_")


def _reg(source_id, org, dataset, category, state, url, dl, file_name, status, notes,
         level="district", lic="CEDA / AGMARKNET public data", path=None):
    rec = {
        "source_id": source_id, "organization": org, "dataset_name": dataset,
        "category": category, "state": state, "url": url, "download_url": dl,
        "file_name": file_name, "file_type": "JSON", "retrieval_date": today(),
        "publication_year": "", "coverage_start": "", "coverage_end": "",
        "geographic_level": level, "license": lic, "status": status, "notes": notes,
    }
    if path is not None and Path(path).exists():
        rec["sha256"] = sha256_file(Path(path))
        rec["bytes"] = Path(path).stat().st_size
    record(rec)


def fetch_reference() -> None:
    """Save the live CEDA catalog: states, commodities, districts."""
    ensure_dirs()
    ref = RAW / "reference"
    ref.mkdir(parents=True, exist_ok=True)

    j, s, e = http_get_json(f"{BASE}/states", timeout=40)
    if s != "OK":
        write_failure("ceda_states", {"url": f"{BASE}/states", "status": s, "error": e,
                                      "classification": s})
        raise SystemExit(f"CEDA states failed: {s} {e}")
    p = ref / "ceda_states.json"
    p.write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding="utf-8")
    _reg("ceda_states", "CEDA, Ashoka University", "AgMarkNet state catalog",
         "reference", "All India", "https://agmarknet.ceda.ashoka.edu.in/",
         f"{BASE}/states", "data/raw/reference/ceda_states.json", "DOWNLOADED", "",
         level="state", path=p)

    j, s, e = http_get_json(f"{BASE}/commodities", timeout=90)
    if s != "OK":
        write_failure("ceda_commodities", {"url": f"{BASE}/commodities", "status": s,
                                           "error": e, "classification": s})
        raise SystemExit(f"CEDA commodities failed: {s} {e}")
    p = ref / "ceda_commodities.json"
    p.write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding="utf-8")
    allc = (j.get("data") if isinstance(j, dict) else j) or []
    log(f"commodities available: {len(allc)}")

    selected = []
    for c in allc:
        nm = str(c.get("commodity_disp_name") or c.get("census_commodity_name")
                 or c.get("commodity_name") or "")
        low = nm.lower()
        if any(pat in low for pat in COMMODITY_PATTERNS):
            cid = (c.get("commodity_id") or c.get("census_commodity_id")
                   or c.get("commodity_code"))
            selected.append({"commodity_id": cid, "commodity_name": nm})
    (ref / "ceda_selected_commodities.json").write_text(
        json.dumps(selected, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"selected commodities for download: {len(selected)}")
    _reg("ceda_commodities", "CEDA, Ashoka University", "AgMarkNet commodity catalog",
         "reference", "All India", "https://agmarknet.ceda.ashoka.edu.in/",
         f"{BASE}/commodities", "data/raw/reference/ceda_commodities.json",
         "DOWNLOADED", f"{len(allc)} commodities; {len(selected)} shortlisted",
         level="commodity", path=p)

    for st_slug, sid in CEDA_STATE_ID.items():
        j, s, e = http_get_json(f"{BASE}/districts?state_id={sid}", timeout=60)
        if s != "OK":
            write_failure(f"ceda_districts_{st_slug}",
                          {"url": f"{BASE}/districts?state_id={sid}", "status": s,
                           "error": e, "classification": s})
            continue
        ddir = RAW / st_slug / "reference"
        ddir.mkdir(parents=True, exist_ok=True)
        (ddir / "districts_raw.json").write_text(
            json.dumps(j, indent=2, ensure_ascii=False), encoding="utf-8")
        rows = (j.get("data") if isinstance(j, dict) else j) or []
        norm = [{
            "census_district_id": r.get("census_district_id") or r.get("district_id"),
            "district_name": r.get("census_district_name") or r.get("district_name"),
            "census_state_id": sid,
            "state_name": STATE_NAME[st_slug],
        } for r in rows]
        p = ddir / "districts.json"
        p.write_text(json.dumps(norm, indent=2, ensure_ascii=False), encoding="utf-8")
        log(f"{st_slug}: {len(norm)} districts")
        _reg(f"ceda_districts_{st_slug}", "CEDA, Ashoka University",
             f"AgMarkNet district catalog - {STATE_NAME[st_slug]}", "reference",
             STATE_NAME[st_slug], "https://agmarknet.ceda.ashoka.edu.in/",
             f"{BASE}/districts?state_id={sid}",
             f"data/raw/{st_slug}/reference/districts.json", "DOWNLOADED",
             f"{len(norm)} districts (Census-2011 district basis)", path=p)


def _post_series(endpoint: str, sid: int, commodity_id: int, y0: str, y1: str,
                 timeout: int = 120):
    """POST one date-range slice.

    Observed API behaviour (probed 2026-09-27, recorded in
    data/metadata/ceda_param_test.json):
      * the response is capped at 1000 rows and silently truncated,
      * repeated rapid calls return HTTP 429.
    Slices therefore stay small and every call is paced + backed off.
    """
    payload = {
        "state_id": sid, "commodity_id": commodity_id, "district_id": 0,
        "calculation_type": "d", "chart_type": "datadownload",
        "start_date": f"{y0}T00:00:00Z", "end_date": f"{y1}T23:59:59Z",
    }
    last = (None, "ERROR", "no attempt", 0)
    for attempt in range(1, 7):
        j, s, e = http_get_json(f"{BASE}/{endpoint}", timeout=timeout, max_attempts=1,
                                method="POST", payload=payload)
        if s == "OK":
            return j, "OK", None, attempt
        last = (j, s, e, attempt)
        if s == "ACCESS_DENIED" and e and "429" in e:
            wait = 20 * attempt
            log(f"    429 rate limited; sleeping {wait}s (attempt {attempt})")
            time.sleep(wait)
            continue
        time.sleep(2 * attempt)
    return last


def _rows_of(j) -> list:
    """CEDA responses are {"data": [...]}; tolerate a bare list too."""
    if j is None:
        return []
    if isinstance(j, list):
        return j
    if isinstance(j, dict):
        for key in ("data", "result", "results", "rows", "table"):
            v = j.get(key)
            if isinstance(v, list):
                return v
    return []


def _mid_date(d0: str, d1: str):
    from datetime import date, timedelta
    try:
        a = date.fromisoformat(d0)
        b = date.fromisoformat(d1)
    except ValueError:
        return None
    if (b - a).days <= 1:
        return None
    return (a + timedelta(days=(b - a).days // 2)).isoformat()


def _slice(endpoint: str, sid: int, cid: int, d0: str, d1: str, depth: int = 0):
    """Fetch [d0,d1]. If the response hits the 1000-row cap, bisect the window."""
    j, s, e, _att = _post_series(endpoint, sid, cid, d0, d1)
    if s != "OK":
        return None, s, e
    rows = _rows_of(j)
    if len(rows) >= 1000 and d0 < d1 and depth < 8:
        mid = _mid_date(d0, d1)
        if mid is None or mid <= d0 or mid >= d1:
            return j, "OK_TRUNCATED", f"1000-row cap reached at depth {depth}"
        left = _mid_date(d0, mid)
        r1, s1, e1 = _slice(endpoint, sid, cid, d0, left, depth + 1)
        r2, s2, e2 = _slice(endpoint, sid, cid, mid, d1, depth + 1)
        for r, s_, e_ in ((r1, s1, e1), (r2, s2, e2)):
            if r is None:
                return None, s_, f"bisect child failed: {e_}"
        return ({"data": _rows_of(r1) + _rows_of(r2),
                 "_terraMind_note": "merged from bisected slices due to 1000-row API cap"},
                "OK", None)
    note = None
    if len(rows) >= 1000:
        note = f"1000-row cap reached at depth {depth} (possible truncation)"
    return j, "OK", note


# Priority commodity shortlist actually downloaded, in collection order.
# (commodity_id, label) verified against data/raw/reference/ceda_commodities.json
PRIORITY_COMMODITIES = [
    (2, "Paddy(Dhan)(Common)"), (3, "Rice"), (10, "Groundnut"), (15, "Cotton"),
    (23, "Onion"), (78, "Tomato"), (4, "Maize"), (5, "Jowar (Sorghum)"),
    (28, "Bajra (Pearl Millet/Cumbu)"), (30, "Ragi (Finger Millet)"),
    (6, "Bengal Gram (Gram)(Whole)"), (13, "Soyabean"), (150, "Sugarcane"),
    (1, "Wheat"), (7, "Red Gram"), (19, "Banana"), (138, "Coconut"), (39, "Turmeric"),
    (132, "Dry Chillies"), (24, "Potato"),
]

MONTHS = [(m, f"{m:02d}") for m in range(1, 13)]
DAYS_IN_MONTH = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30,
                 10: 31, 11: 30, 12: 31}


def _month_end(year: int, month: int) -> int:
    if month == 2 and (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)):
        return 29
    return DAYS_IN_MONTH[month]


def fetch_series(start_year: int, end_year: int, only: list | None = None,
                 pace_seconds: float = 1.0) -> None:
    """Fetch monthly price + arrival slices for the priority commodities."""
    ensure_dirs()
    todo = PRIORITY_COMMODITIES if not only else [
        (cid, nm) for cid, nm in PRIORITY_COMMODITIES if nm.lower() in
        {o.lower() for o in only}
    ]
    log(f"commodities to fetch: {len(todo)}; years {start_year}-{end_year}; "
        f"pace {pace_seconds}s")

    for st_slug, sid in CEDA_STATE_ID.items():
        for kind in ("prices", "quantities"):
            (RAW / st_slug / "market" / "ceda" / kind).mkdir(parents=True, exist_ok=True)
        n_ok = n_new = n_fail = n_trunc = 0
        nbytes = 0
        consecutive_fail = 0
        for cid, cname in todo:
            for year in range(start_year, end_year + 1):
                for mnum, _mm in MONTHS:
                    d0 = f"{year}-{mnum:02d}-01"
                    d1 = f"{year}-{mnum:02d}-{_month_end(year, mnum):02d}"
                    for kind in ("prices", "quantities"):
                        out = (RAW / st_slug / "market" / "ceda" / kind /
                               f"{slug(cname)}__{d0[:7]}.json")
                        if out.exists():
                            n_ok += 1
                            continue
                        j, s, note = _slice(kind, sid, int(cid), d0, d1)
                        time.sleep(pace_seconds)
                        if s != "OK" or j is None:
                            n_fail += 1
                            consecutive_fail += 1
                            write_failure(
                                f"ceda_{st_slug}_{kind}_{slug(cname)}_{d0[:7]}",
                                {"organization": "CEDA, Ashoka University",
                                 "url": f"{BASE}/{kind}", "state": STATE_NAME[st_slug],
                                 "commodity": cname, "month": d0[:7], "status": s,
                                 "error": note, "classification": s})
                            if consecutive_fail >= 6:
                                log("!! 6 consecutive slice failures (likely persistent "
                                    "429 rate limiting) - stopping so the run stays "
                                    "resumable and no further requests are wasted")
                                _reg(f"ceda_{st_slug}_prices_quantities",
                                     "CEDA, Ashoka University",
                                     f"AgMarkNet daily mandi prices + arrivals - "
                                     f"{STATE_NAME[st_slug]}", "market",
                                     STATE_NAME[st_slug],
                                     "https://agmarknet.ceda.ashoka.edu.in/",
                                     f"{BASE}/prices",
                                     f"data/raw/{st_slug}/market/ceda/(prices,quantities)/",
                                     "PARTIALLY_DOWNLOADED",
                                     f"{n_ok} slices present, {n_fail} failed before "
                                     f"abort; API rate limited",
                                     level="market")
                                return
                            continue
                        consecutive_fail = 0
                        out.write_text(json.dumps(j, ensure_ascii=False),
                                       encoding="utf-8")
                        n_ok += 1
                        n_new += 1
                        nbytes += out.stat().st_size
                        if note:
                            n_trunc += 1
                            write_failure(
                                f"ceda_truncation_{st_slug}_{kind}_{slug(cname)}_{d0[:7]}",
                                {"organization": "CEDA, Ashoka University",
                                 "state": STATE_NAME[st_slug], "commodity": cname,
                                 "month": d0[:7], "classification": "PARTIALLY_DOWNLOADED",
                                 "error": note})
                        if _rows_of(j) and not _rows_of(j)[0].get("cmdty"):
                            write_failure(
                                f"ceda_schema_{st_slug}_{kind}_{d0[:7]}",
                                {"classification": "PARSING_ERROR",
                                 "error": "unexpected response shape",
                                 "keys": sorted(_rows_of(j)[0].keys())})
            log(f"{st_slug} {cname}: slices_ok={n_ok} new={n_new} fail={n_fail} "
                f"cap_hits={n_trunc}")
        log(f"{st_slug}: {n_ok} slices present, {n_new} new this run "
            f"({nbytes/1e6:.2f} MB), {n_fail} failed, {n_trunc} cap warnings")
        _reg(f"ceda_{st_slug}_prices_quantities", "CEDA, Ashoka University",
             f"AgMarkNet daily mandi prices + arrivals - {STATE_NAME[st_slug]}",
             "market", STATE_NAME[st_slug],
             "https://agmarknet.ceda.ashoka.edu.in/", f"{BASE}/prices",
             f"data/raw/{st_slug}/market/ceda/(prices,quantities)/",
             "PARTIALLY_DOWNLOADED" if n_fail else "DOWNLOADED",
             f"{n_ok} monthly commodity slices, {n_fail} failed, {n_trunc} cap warnings; "
             f"unit as published by AGMARKNET (price: Rs/quintal, arrivals: tonnes)",
             level="market")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["reference", "fetch"])
    ap.add_argument("--start-year", type=int, default=2015)
    ap.add_argument("--end-year", type=int, default=2025)
    ap.add_argument("--only", nargs="*", default=None)
    ap.add_argument("--pace", type=float, default=1.0)
    a = ap.parse_args()
    if a.command == "reference":
        fetch_reference()
    else:
        fetch_series(a.start_year, a.end_year, a.only, a.pace)


if __name__ == "__main__":
    main()
