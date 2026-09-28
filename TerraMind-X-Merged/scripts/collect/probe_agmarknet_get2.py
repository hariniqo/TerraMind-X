"""Second-round probe of AGMARKNET GET endpoints using the real param names."""
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

CANDIDATES = [
    ("/prices-and-arrivals/commodity-wise/daily-report-state",
     {"date": "2024-01-15", "stateIds": 20}),
    ("/prices-and-arrivals/commodity-wise/daily-report-state",
     {"date": "2024-01-15", "stateIds": "[20]"}),
    ("/prices-and-arrivals/commodity-wise/daily-report-state",
     {"date": "2024-01-15", "stateIds": "20", "commodityIds": "[23]"}),
    ("/prices-and-arrivals/commodity-wise/daily-report-state",
     {"date": "2024-01-15", "stateIds": "20", "commodity": 23}),
    ("/prices-and-arrivals/market-report/specific",
     {"date": "2024-01-15", "stateIds": "20", "districtIds": "all"}),
    ("/price-trend/year-filter", {"commodity": 23, "state": 20}),
    ("/price-trend/wholesale-prices-monthly",
     {"commodity": 23, "state": 20, "year": 2024, "report_mode": "Statewise",
      "mode": "statewise", "type": "monthly"}),
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
               "head": text[:600]}
        try:
            j = json.loads(text)
            data = j.get("data") if isinstance(j, dict) else j
            if isinstance(data, list):
                rec["row_count"] = len(data)
                if data:
                    rec["row_keys"] = sorted(data[0].keys())
                    rec["row_sample"] = data[0]
            elif isinstance(data, dict):
                rec["data_keys"] = sorted(data.keys())[:30]
                rec["row_sample"] = {k: data[k] for k in list(data)[:3]}
        except Exception:  # noqa: BLE001
            pass
        out.append(rec)
        log(f"{path} {list(params.keys())} -> http={st} rows={rec.get('row_count')} "
            f"keys={rec.get('row_keys') or rec.get('data_keys')}")
    (METADATA / "agmarknet_get_probe2.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    log("wrote data/metadata/agmarknet_get_probe2.json")


if __name__ == "__main__":
    main()
