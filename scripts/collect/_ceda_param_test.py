"""Find the most efficient CEDA request shape (calc type x date range)."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import http_get_json, log  # noqa: E402

BASE = "https://agmarknet.ceda.ashoka.edu.in/api"
RESULTS = []


def call(endpoint, sid, cid, y0, y1, calc="d", timeout=150):
    payload = {
        "state_id": sid, "commodity_id": cid, "district_id": 0,
        "calculation_type": calc, "chart_type": "datadownload",
        "start_date": f"{y0}T00:00:00Z", "end_date": f"{y1}T23:59:59Z",
    }
    t0 = time.time()
    j, s, e = http_get_json(f"{BASE}/{endpoint}", timeout=timeout, max_attempts=1,
                            method="POST", payload=payload)
    rows = (j or {}).get("data") if isinstance(j, dict) else j
    rows = rows or []
    el = time.time() - t0
    dates = sorted({str(r.get("t") or r.get("date") or "")[:10] for r in rows} - {""})
    row = {
        "endpoint": endpoint, "calc": calc, "y0": y0, "y1": y1,
        "status": s, "rows": len(rows), "elapsed_s": round(el, 1),
        "distinct_dates": len(dates),
        "first_date": dates[0] if dates else None,
        "last_date": dates[-1] if dates else None,
        "keys": sorted(rows[0].keys()) if rows else [],
        "error": e,
    }
    RESULTS.append(row)
    log(json.dumps(row, ensure_ascii=False))
    return row


if __name__ == "__main__":
    cid = int(sys.argv[1]) if len(sys.argv) > 1 else 23
    call("prices", 27, cid, "2015-01-01", "2015-12-31", "d")
    call("prices", 27, cid, "2015-01-01", "2025-12-31", "m")
    call("prices", 27, cid, "2015-01-01", "2025-12-31", "a")
    call("quantities", 27, cid, "2015-01-01", "2015-12-31", "d")
    call("quantities", 27, cid, "2015-01-01", "2025-12-31", "m")
    Path("data/metadata/ceda_param_test.json").write_text(
        json.dumps(RESULTS, indent=2, ensure_ascii=False), encoding="utf-8")
    log("wrote data/metadata/ceda_param_test.json")
