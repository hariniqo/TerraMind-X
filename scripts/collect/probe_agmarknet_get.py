"""Probe the official AGMARKNET 2.0 GET report endpoints (no captcha path)."""
from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import METADATA, SSL_CTX, log  # noqa: E402

API = "https://api.agmarknet.gov.in/v1"
HDRS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TerraMindCollector/1.0",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://agmarknet.gov.in", "Referer": "https://agmarknet.gov.in/",
}

# commodity 23 = Onion, state 20 = Maharashtra, 31 = Tamil Nadu (from /filters)
CANDIDATES = [
    ("/price-trend/wholesale-prices-monthly",
     {"commodity": 23, "state": 20, "year": 2015, "report_mode": "statewise"}),
    ("/price-trend/wholesale-prices-monthly",
     {"commodity": 23, "state": 20, "year": 2015, "mode": "statewise"}),
    ("/price-trend/wholesale-prices-monthly",
     {"commodity": 23, "state": 20, "year": 2015}),
    ("/price-trend/wholesale-arrivals-monthly",
     {"commodity": 23, "state": 20, "year": 2015}),
    ("/price-trend/month-filter", {"commodity": 23, "state": 20, "year": 2015}),
    ("/price-trend/year-filter", {"commodity": 23, "state": 20}),
    ("/price-trend/week-filter",
     {"commodity": 23, "state": 20, "year": 2015, "month": 1}),
    ("/all-type-report/commodity-wise-mandi-arrival",
     {"commodity": 23, "state": 20, "from_date": "2015-01-01", "to_date": "2015-01-31"}),
    ("/prices-and-arrivals/commodity-wise/daily-report-state",
     {"commodity": 23, "state": 20, "date": "2015-01-15"}),
    ("/cmdt-below-msp-report", {"commodity": 23, "state": 20, "year": 2015}),
]


def get(path: str, params: dict):
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HDRS)
    try:
        with urllib.request.urlopen(req, timeout=90, context=SSL_CTX) as r:
            return r.status, r.read()
    except Exception as e:  # noqa: BLE001
        body = b""
        try:
            body = e.read()
        except Exception:  # noqa: BLE001
            pass
        return None, f"{type(e).__name__}: {e} | {body[:250]!r}".encode()


def main() -> None:
    out = []
    for path, params in CANDIDATES:
        st, raw = get(path, params)
        text = raw.decode("utf-8", "replace")
        rec = {"path": path, "params": params, "http": st, "bytes": len(raw),
               "head": text[:500]}
        try:
            j = json.loads(text)
            data = j.get("data") if isinstance(j, dict) else j
            rec["status"] = j.get("status") if isinstance(j, dict) else None
            rec["message"] = j.get("message") if isinstance(j, dict) else None
            if isinstance(data, list):
                rec["row_count"] = len(data)
                if data:
                    rec["row_keys"] = sorted(data[0].keys())
                    rec["row_sample"] = data[0]
            elif isinstance(data, dict):
                rec["data_keys"] = sorted(data.keys())[:30]
        except Exception:  # noqa: BLE001
            rec["status"] = "not-json"
        out.append(rec)
        log(f"{path} {params} -> http={st} rows={rec.get('row_count')} "
            f"status={rec.get('status')} msg={str(rec.get('message'))[:80]}")
    (METADATA / "agmarknet_get_probe.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    log("wrote data/metadata/agmarknet_get_probe.json")


if __name__ == "__main__":
    main()
