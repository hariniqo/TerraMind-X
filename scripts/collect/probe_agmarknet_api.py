"""Find working parameters for the official AGMARKNET 2.0 API report endpoint.

Empirical only: each candidate parameter set is really sent, and the response is
recorded. Nothing is assumed about the schema.
"""
from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import METADATA, SSL_CTX, log  # noqa: E402

API = "https://api.agmarknet.gov.in/v1"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TerraMindCollector/1.0",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://agmarknet.gov.in", "Referer": "https://agmarknet.gov.in/"}

# Maharashtra = 20, Tamil Nadu = 31 (verified from /daily-price-arrival/filters)
CANDIDATES = [
    ("A", {"cmdt_id": 23, "state_id": 20, "district_id": 0, "market_id": 0,
            "from_date": "2015-01-01", "to_date": "2015-01-31", "page": 1, "limit": 100}),
    ("B", {"cmdt_id": 23, "state_id": 20, "district_id": 0, "market_id": 0,
            "from_date": "2015-01-01", "to_date": "2015-01-31"}),
    ("C", {"cmdt_id": 23, "state_id": 20, "district_id": 0, "market_id": 0,
            "fromdate": "2015-01-01", "todate": "2015-01-31"}),
    ("D", {"cmdt_id": "23", "state_id": "20", "district_id": "0", "market_id": "0",
            "from_date": "2015-01-01", "to_date": "2015-01-31", "price_arrival": "P"}),
    ("E", {"cmdt_id": 23, "state_id": 20, "district_id": 0, "market_id": 0,
            "from_date": "01-Jan-2015", "to_date": "31-Jan-2015"}),
]
ENDPOINTS = ["/daily-price-arrival/report"]


def post(path: str, params: dict):
    body = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(
        API + path, data=body, method="POST",
        headers={**UA, "Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=60, context=SSL_CTX) as r:
            raw = r.read()
            return r.status, raw
    except Exception as e:  # noqa: BLE001
        return None, f"{type(e).__name__}: {e}".encode()


def main() -> None:
    out = []
    for path in ENDPOINTS:
        for name, params in CANDIDATES:
            st, raw = post(path, params)
            text = raw.decode("utf-8", "replace")
            rec = {"endpoint": path, "variant": name, "params": params,
                   "http": st, "bytes": len(raw), "body_head": text[:600]}
            try:
                j = json.loads(text)
                rows = j.get("data") if isinstance(j, dict) else j
                rec["json_status"] = j.get("status") if isinstance(j, dict) else None
                rec["message"] = j.get("message") if isinstance(j, dict) else None
                rec["row_count"] = len(rows) if isinstance(rows, list) else None
                if isinstance(rows, list) and rows:
                    rec["row_keys"] = sorted(rows[0].keys())
                    rec["row_sample"] = rows[0]
                rec["pagination"] = j.get("pagination") if isinstance(j, dict) else None
            except Exception:  # noqa: BLE001
                rec["json_status"] = "not-json"
            out.append(rec)
            log(f"{path} [{name}] http={st} bytes={len(raw)} "
                f"rows={rec.get('row_count')} msg={rec.get('message')}")
    (METADATA / "agmarknet_api_probe.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    log("wrote data/metadata/agmarknet_api_probe.json")


if __name__ == "__main__":
    main()
