"""Inspect every file under data/raw/ and write a real structural inventory.

Detects encoding, file type, and for tabular files: sheet names, row/column
counts, column names and a sample. ZIPs are listed and extracted into
data/raw/<state>/extracted/<archive>/ (originals are never modified).
PDFs are classified as text / image only from real bytes.

Output: data/metadata/raw_inventory.json and reports/tables/raw_file_inventory.csv
"""
from __future__ import annotations

import csv
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "collect"))
from tdcommon import METADATA, RAW, REPORTS_TABLES, ensure_dirs, log, sha256_file  # noqa: E402

TABULAR = (".csv", ".tsv", ".xls", ".xlsx")


def detect_encoding(path: Path) -> str:
    raw = path.read_bytes()[:200000]
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1", "utf-16"):
        try:
            raw.decode(enc)
            return enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return "unknown"


def read_csv_like(path: Path, enc: str) -> dict:
    import pandas as pd
    seps = ["\t"] if path.suffix.lower() == ".tsv" else [",", ";", "|", "\t"]
    for attempt_sep in seps:
        try:
            df = pd.read_csv(path, encoding=enc, sep=attempt_sep, engine="python",
                             nrows=5000, on_bad_lines="skip")
            if df.shape[1] >= 2:
                return {
                    "rows_scanned": int(len(df)), "columns": int(df.shape[1]),
                    "column_names": [str(c) for c in df.columns][:60],
                    "separator": repr(attempt_sep),
                    "sample_first_row": (
                        {str(k): str(v) for k, v in df.head(1).to_dict("records")[0].items()}
                        if len(df) else {}),
                }
        except Exception:  # noqa: BLE001
            continue
    return {"error": "could not parse as delimited text"}


def read_excel(path: Path) -> dict:
    import pandas as pd
    out = {"sheets": []}
    try:
        xls = pd.ExcelFile(path)
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {e}"}
    for sh in xls.sheet_names:
        try:
            df = xls.parse(sh, nrows=2000)
            out["sheets"].append({
                "sheet": str(sh), "rows_scanned": int(len(df)),
                "columns": int(df.shape[1]),
                "column_names": [str(c) for c in df.columns][:60],
                "sample_first_row": (
                    {str(k): str(v) for k, v in df.head(1).to_dict("records")[0].items()}
                    if len(df) else {}),
            })
        except Exception as e:  # noqa: BLE001
            out["sheets"].append({"sheet": str(sh), "error": f"{type(e).__name__}: {e}"})
    return out


def inspect_pdf(path: Path) -> dict:
    data = path.read_bytes()
    info = {
        "bytes": len(data), "has_pdf_header": data[:5] == b"%PDF-",
        "count_stream": data.count(b"stream"),
        "count_image_marker": data.count(b"/Image"),
        "count_font_marker": data.count(b"/Font"),
        "count_text_operator": data.count(b"BT"),
        "count_table_marker": data.count(b"/Table") + data.count(b"/TR"),
    }
    if info["count_font_marker"] and info["count_text_operator"]:
        info["classification"] = "selectable_text"
    elif info["count_image_marker"]:
        info["classification"] = "scanned_or_image"
    else:
        info["classification"] = "unknown"
    return info


def inspect_zip(path: Path) -> dict | None:
    if path.suffix.lower() != ".zip":
        return None
    try:
        with zipfile.ZipFile(path) as zf:
            names = zf.namelist()
            return {"zip_entries": len(names), "entry_names": names[:200]}
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {e}"}


def extract_zip(path: Path, state_slug: str) -> dict:
    """Extract a ZIP without touching the original archive."""
    outdir = RAW / state_slug / "extracted" / path.stem
    outdir.mkdir(parents=True, exist_ok=True)
    extracted, errors = [], []
    try:
        with zipfile.ZipFile(path) as zf:
            for m in zf.infolist():
                if m.is_dir():
                    continue
                target = outdir / Path(m.filename).name
                if target.exists() and target.stat().st_size == m.file_size:
                    extracted.append(str(target.relative_to(RAW.parent)))
                    continue
                with zf.open(m) as src, target.open("wb") as dst:
                    dst.write(src.read())
                extracted.append(str(target.relative_to(RAW.parent)))
    except Exception as e:  # noqa: BLE001
        errors.append(f"{type(e).__name__}: {e}")
    return {"extract_dir": str(outdir.relative_to(RAW.parent)),
            "extracted": extracted, "errors": errors}


def main() -> None:
    ensure_dirs()
    records = []
    for p in sorted(RAW.rglob("*")):
        if not p.is_file() or "extracted" in p.parts or p.suffix == ".part":
            continue
        rec = {
            "relative_path": str(p.relative_to(RAW.parent)).replace("\\", "/"),
            "name": p.name, "suffix": p.suffix.lower(),
            "bytes": p.stat().st_size, "sha256": sha256_file(p),
        }
        low = p.suffix.lower()
        try:
            if low in (".csv", ".tsv"):
                rec["encoding"] = detect_encoding(p)
                rec.update(read_csv_like(p, rec["encoding"]))
            elif low in (".xls", ".xlsx"):
                rec["encoding"] = "binary-excel"
                rec.update(read_excel(p))
            elif low == ".json":
                rec["encoding"] = detect_encoding(p)
                try:
                    j = json.loads(p.read_text(encoding=rec["encoding"], errors="replace"))
                    if isinstance(j, dict):
                        rec["json_top_keys"] = list(j.keys())[:40]
                        rec["json_shape"] = "object"
                    elif isinstance(j, list):
                        rec["json_shape"] = "list"
                        rec["json_items"] = len(j)
                        if j and isinstance(j[0], dict):
                            rec["json_item_keys"] = list(j[0].keys())[:40]
                except Exception as e:  # noqa: BLE001
                    rec["error"] = f"json parse: {type(e).__name__}: {e}"
            elif low == ".pdf":
                rec.update(inspect_pdf(p))
            elif low == ".zip":
                z = inspect_zip(p)
                if z:
                    rec.update(z)
                parts = p.relative_to(RAW).parts
                slug = parts[0] if len(parts) > 1 else "national"
                rec["extraction"] = extract_zip(p, slug)
            elif low in (".txt", ".xml", ".bin"):
                rec["encoding"] = detect_encoding(p)
                rec["preview"] = p.read_text(encoding=rec["encoding"],
                                             errors="replace")[:400]
        except Exception as e:  # noqa: BLE001
            rec["error"] = f"{type(e).__name__}: {e}"
        records.append(rec)

    (METADATA / "raw_inventory.json").write_text(
        json.dumps(records, indent=2, ensure_ascii=False, default=str), encoding="utf-8")

    cols = ["relative_path", "name", "suffix", "bytes", "sha256", "encoding",
            "rows_scanned", "columns", "sheet_count", "classification", "zip_entries",
            "error"]
    with (REPORTS_TABLES / "raw_file_inventory.csv").open("w", newline="",
                                                          encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in records:
            r2 = dict(r)
            if "sheets" in r2:
                r2["sheet_count"] = len(r2["sheets"])
            w.writerow(r2)
    log(f"inspected {len(records)} raw files -> data/metadata/raw_inventory.json")


if __name__ == "__main__":
    main()
