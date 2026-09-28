"""Test whether the CEDA prices/quantities endpoints accept a multi-year range."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import http_get_json, log  # noqa: E402

BASE = "https://agmarknet.ceda.ashoka.edu.in/api"


def call(endpoint, sid, cid, y0, y1):
    payload = {
        "state_id": sid, "commodity_id": cid, "district_id": 0,
        "calculation_type": "d", "chart_type": "datadownload",
        "start_date": f"{y0}T00:00:00Z", "end_date": f"{y1}T23:59:59Z",
    }
    t0 = time.time()
    j, s, e = http_get_json(f"{BASE}/{endpoint}", timeout=240, max_attempts=2,
                            method="POST", payload=payload)
    rows = (j or {}).get("data") if isinstance(j, dict) else j
    n = len(rows or [])
    dates = sorted({str(r.get("t"))[:10] for r in (rows or []) if r.get("t")})
    log(f"{endpoint} state={sid} cmdty={cid} {y0}..{y1}: status={s} rows={n} "
        f"elapsed={time.time()-t0:.1f}s first={dates[:1]} last={dates[-1:]} err={e}")
    if rows:
        log("  keys: " + ", ".join(sorted(rows[0].keys())))
        log("  sample: " + json.dumps(rows[0], ensure_ascii=False))
    return rows or []


if __name__ == "__main__":
    # Onion (commodity_id resolved by discovery) - Maharashtra, 11-year range
    call("prices", 27, 23, "2015-01-01", "2025-12-31")
    call("quantities", 27, 23, "2015-01-01", "2025-12-31")
