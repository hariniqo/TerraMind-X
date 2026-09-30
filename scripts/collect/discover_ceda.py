"""Discovery probe for the CEDA AgmarkNet API - records real response schemas."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import METADATA, http_get_json, log  # noqa: E402

BASE = "https://agmarknet.ceda.ashoka.edu.in/api"
OUT = {}


def show(label, obj, limit=900):
    text = json.dumps(obj, ensure_ascii=False, default=str)
    log(f"{label}: {text[:limit]}")
    OUT[label] = obj


def main() -> None:
    j, s, e = http_get_json(f"{BASE}/states", timeout=30)
    show("states", j if s == "OK" else {"status": s, "error": e})

    j, s, e = http_get_json(f"{BASE}/commodities", timeout=40)
    if s == "OK" and isinstance(j, dict):
        rows = j.get("data") or []
        show("commodities_count", len(rows))
        show("commodities_first5", rows[:5])
    else:
        show("commodities", {"status": s, "error": e})

    for sid, name in ((27, "Maharashtra"), (33, "Tamil Nadu")):
        j, s, e = http_get_json(f"{BASE}/districts?state_id={sid}", timeout=40)
        if s == "OK" and isinstance(j, dict):
            rows = j.get("data") or []
            show(f"districts_{name}_count", len(rows))
            show(f"districts_{name}_first5", rows[:5])
        else:
            show(f"districts_{name}", {"status": s, "error": e})

    # Small price + quantity request: one district (Pune/Coimbatore), one month.
    payload = {
        "state_id": 27, "commodity_id": 23, "district_id": 0,
        "calculation_type": "d", "chart_type": "datadownload",
        "start_date": "2015-01-01T00:00:00Z", "end_date": "2015-01-31T23:59:59Z",
    }
    j, s, e = http_get_json(f"{BASE}/prices", timeout=60, method="POST", payload=payload)
    if s == "OK":
        if isinstance(j, dict):
            keys = list(j.keys())
            show("prices_keys", keys)
            for k in keys:
                v = j[k]
                if isinstance(v, list):
                    show(f"prices_{k}_count", len(v))
                    show(f"prices_{k}_first2", v[:2])
                else:
                    show(f"prices_{k}", v)
        else:
            show("prices_type", [type(j).__name__, str(j)[:400]])
    else:
        show("prices", {"status": s, "error": e})

    j, s, e = http_get_json(f"{BASE}/quantities", timeout=60, method="POST", payload=payload)
    if s == "OK":
        if isinstance(j, dict):
            keys = list(j.keys())
            show("quantities_keys", keys)
            for k in keys:
                v = j[k]
                if isinstance(v, list):
                    show(f"quantities_{k}_count", len(v))
                    show(f"quantities_{k}_first2", v[:2])
                else:
                    show(f"quantities_{k}", v)
        else:
            show("quantities_type", [type(j).__name__, str(j)[:400]])
    else:
        show("quantities", {"status": s, "error": e})

    METADATA.mkdir(parents=True, exist_ok=True)
    (METADATA / "ceda_api_discovery.json").write_text(
        json.dumps(OUT, indent=2, ensure_ascii=False, default=str), encoding="utf-8"
    )
    log("wrote data/metadata/ceda_api_discovery.json")


if __name__ == "__main__":
    main()
