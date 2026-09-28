"""Probe the official AGMARKNET 2.0 /daily-price-arrival/report body schema."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import METADATA, SSL_CTX, log  # noqa: E402

URL = "https://api.agmarknet.gov.in/v1/daily-price-arrival/report"
HDRS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TerraMindCollector/1.0",
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://agmarknet.gov.in",
    "Referer": "https://agmarknet.gov.in/",
}
# Maharashtra = 20, Tamil Nadu = 31 (from /daily-price-arrival/filters)
BASE = {"from_date": "2015-01-01", "to_date": "2015-01-31"}

VARIANTS = [
    ("v1", {**BASE, "dashboard": "cumm_price_sp", "downloadreport": False, "page": 0,
            "state": 20, "commodity": [23]}),
    ("v2", {**BASE, "dashboard": "cumm_price_sp", "downloadreport": False, "page": 0,
            "state": "20", "commodity": "23"}),
    ("v3", {**BASE, "dashboard": "cumm_price_sp", "downloadreport": False, "page": 0,
            "state": [20], "commodity": [23], "itemsPerPage": 100}),
    ("v4", {**BASE, "dashboard": "cumm_price_sp"}),
    ("v5", {**BASE, "state": 20, "commodity": [23]}),
    ("v6", {**BASE, "dashboard": "cumm_price_sp", "downloadreport": True,
            "downloadformat": "csv", "page": 0, "state": 20, "commodity": [23]}),
    ("v7", {**BASE, "dashboard": "statewise_price_arrival_sp", "downloadreport": False,
            "page": 0, "state": [20], "commodity": [23]}),
]


def post(body: dict):
    data = json.dumps(body).encode()
    req = urllib.request.Request(URL, data=data, method="POST", headers=HDRS)
    try:
        with urllib.request.urlopen(req, timeout=90, context=SSL_CTX) as r:
            return r.status, r.headers.get("content-type"), r.read()
    except Exception as e:  # noqa: BLE001
        body_err = getattr(e, "read", lambda: b"")()
        return None, None, f"{type(e).__name__}: {e} | {body_err[:300]!r}".encode()


def main() -> None:
    results = []
    for name, body in VARIANTS:
        st, ctype, raw = post(body)
        text = raw.decode("utf-8", "replace")
        rec = {"variant": name, "body": body, "http": st, "content_type": ctype,
               "bytes": len(raw), "head": text[:400]}
        try:
            j = json.loads(text)
            rows = j.get("data") if isinstance(j, dict) else j
            rec["status"] = j.get("status") if isinstance(j, dict) else None
            rec["message"] = j.get("message") if isinstance(j, dict) else None
            rec["row_count"] = len(rows) if isinstance(rows, list) else None
            if isinstance(rows, list) and rows:
                rec["row_keys"] = sorted(rows[0].keys())
                rec["row_sample"] = rows[0]
            if isinstance(j, dict) and isinstance(j.get("data"), dict):
                rec["data_keys"] = sorted(j["data"].keys())[:25]
        except Exception:  # noqa: BLE001
            rec["status"] = "not-json"
        results.append(rec)
        log(f"[{name}] http={st} rows={rec.get('row_count')} "
            f"status={rec.get('status')} msg={str(rec.get('message'))[:90]}")
    (METADATA / "agmarknet_report_probe.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    log("wrote data/metadata/agmarknet_report_probe.json")


if __name__ == "__main__":
    main()
