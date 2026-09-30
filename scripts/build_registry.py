"""Build data/metadata/source_registry.csv from the real download manifest,
the failure log, and the endpoint probe results.

Status vocabulary (fixed by the project spec):
  DOWNLOADED | PARTIALLY_DOWNLOADED | BLOCKED | TIMEOUT | NOT_FOUND | MANUAL_REQUIRED
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "collect"))
from tdcommon import FAILURES, METADATA, RAW, ensure_dirs, log  # noqa: E402

COLUMNS = [
    "source_id", "organization", "dataset_name", "category", "state", "url",
    "download_url", "file_name", "file_type", "retrieval_date", "publication_year",
    "coverage_start", "coverage_end", "geographic_level", "license", "status",
    "notes",
]

STATUS_MAP = {
    "DOWNLOADED": "DOWNLOADED", "OK": "DOWNLOADED",
    "PARTIALLY_DOWNLOADED": "PARTIALLY_DOWNLOADED", "OK_TRUNCATED": "PARTIALLY_DOWNLOADED",
    "ACCESS_DENIED": "BLOCKED", "HTTP_ERROR": "BLOCKED", "SSL_ERROR": "BLOCKED",
    "CONNECTION_ERROR": "BLOCKED", "SERVER_ERROR": "BLOCKED",
    "TIMEOUT": "TIMEOUT",
    "BROKEN_LINK": "NOT_FOUND", "MISSING_DATA": "NOT_FOUND", "NOT_FOUND": "NOT_FOUND",
    "PARSING_ERROR": "PARTIALLY_DOWNLOADED",
    "CAPTCHA": "MANUAL_REQUIRED", "LOGIN_REQUIRED": "MANUAL_REQUIRED",
    "MANUAL_DOWNLOAD_REQUIRED": "MANUAL_REQUIRED", "MANUAL_REQUIRED": "MANUAL_REQUIRED",
}


def norm_status(s: str) -> str:
    return STATUS_MAP.get(str(s or "").upper(), "BLOCKED")


def read_manifest() -> list[dict]:
    p = METADATA / "download_manifest.jsonl"
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def read_failures() -> list[dict]:
    out = []
    for p in sorted(FAILURES.glob("*.json")):
        try:
            hist = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        if not isinstance(hist, list):
            hist = [hist]
        for h in hist:
            if isinstance(h, dict):
                h["_file"] = p.name
                out.append(h)
    return out


def read_probe() -> list[dict]:
    p = METADATA / "endpoint_probe.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else []


def main() -> None:
    ensure_dirs()
    rows, seen = [], set()

    for m in read_manifest():
        rec = {c: m.get(c, "") for c in COLUMNS}
        rec["status"] = norm_status(rec["status"])
        key = (rec["source_id"], rec["file_name"])
        if key in seen:
            continue
        seen.add(key)
        b, h = m.get("bytes"), m.get("sha256")
        extra = []
        if b:
            extra.append(f"{b} bytes")
        if h:
            extra.append(f"sha256={str(h)[:16]}")
        if rec["notes"]:
            extra.append(str(rec["notes"]))
        rec["notes"] = "; ".join(extra)[:800]
        rows.append(rec)

    for f in read_failures():
        sid = str(f.get("_file", "failure")).replace(".json", "")
        if any(r["source_id"].startswith(sid[:28]) and r["status"] != "DOWNLOADED"
               for r in rows):
            continue
        rows.append({
            "source_id": sid[:120],
            "organization": f.get("organization", ""),
            "dataset_name": f.get("dataset_name") or f.get("commodity") or f.get("url", ""),
            "category": f.get("category", ""), "state": f.get("state", ""),
            "url": f.get("url", "") or f.get("download_url", ""),
            "download_url": f.get("download_url", ""),
            "file_name": f.get("file_name", ""), "file_type": f.get("file_type", ""),
            "retrieval_date": str(f.get("logged_at", ""))[:10],
            "publication_year": "", "coverage_start": "", "coverage_end": "",
            "geographic_level": f.get("geographic_level", ""), "license": "",
            "status": norm_status(f.get("classification") or f.get("status")),
            "notes": str(f.get("error") or f.get("reason") or "")[:800],
        })

    for p in read_probe():
        eid = p["endpoint_id"]
        if any(r["source_id"] == eid for r in rows) or p["status"] == "OK":
            continue
        err = str(p.get("error", ""))
        status = ("TIMEOUT" if "timeout" in err.lower() or "Timeout" in str(p["status"])
                  else ("NOT_FOUND" if "getaddrinfo" in err else "BLOCKED"))
        rows.append({
            "source_id": eid, "organization": p.get("organization", ""),
            "dataset_name": f"Endpoint probe: {p.get('category', '')}",
            "category": p.get("category", ""), "state": "",
            "url": p.get("url", ""), "download_url": "", "file_name": "",
            "file_type": "", "retrieval_date": "", "publication_year": "",
            "coverage_start": "", "coverage_end": "", "geographic_level": "",
            "license": "", "status": status,
            "notes": f"probe status={p.get('status')} http={p.get('http_status')} "
                     f"{err[:300]}",
        })

    rows.sort(key=lambda r: (r["status"] != "DOWNLOADED", r["category"], r["source_id"]))
    out = METADATA / "source_registry.csv"
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)

    by_status: dict[str, int] = {}
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
    log(f"wrote {out} with {len(rows)} registry rows: {by_status}")

    raw_files = [p for p in RAW.rglob("*") if p.is_file() and p.suffix != ".part"]
    total = sum(p.stat().st_size for p in raw_files)
    ext: dict[str, int] = {}
    for p in raw_files:
        ext[p.suffix.lower()] = ext.get(p.suffix.lower(), 0) + 1
    (METADATA / "raw_totals.json").write_text(json.dumps({
        "raw_file_count": len(raw_files), "raw_bytes": total,
        "raw_mb": round(total / 1e6, 2), "by_extension": ext,
    }, indent=2), encoding="utf-8")
    log(f"raw tree: {len(raw_files)} files, {total/1e6:.1f} MB, {ext}")


if __name__ == "__main__":
    main()
