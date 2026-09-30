"""Extract tables from downloaded government PDFs into real CSV files.

Every extracted table is written to disk with its source page recorded, so a
value can always be traced back to the exact page of the official PDF. Tables
are NOT cleaned here - cleaning happens in category-specific processors.

Outputs
  data/raw/<state>/pdf_tables/<pdf_stem>/p<page>_t<table>.csv
  reports/tables/pdf_table_index.csv
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import pdfplumber

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "collect"))
from tdcommon import METADATA, RAW, REPORTS_TABLES, ensure_dirs, log  # noqa: E402

import json  # noqa: E402


def state_dir_of(pdf: Path) -> str:
    rel = pdf.relative_to(RAW).parts
    return rel[0] if len(rel) > 1 else "national"


def extract_pdf(pdf: Path, min_rows: int, min_cols: int, max_pages: int,
                start_page: int) -> list[dict]:
    outdir = RAW / state_dir_of(pdf) / "pdf_tables" / pdf.stem
    outdir.mkdir(parents=True, exist_ok=True)
    rows = []
    try:
        with pdfplumber.open(pdf) as doc:
            n_pages = len(doc.pages)
            pages = doc.pages[start_page - 1: max_pages + start_page - 1] if max_pages else doc.pages[start_page - 1:]
            for pi, page in enumerate(pages, start=start_page):
                try:
                    tables = page.extract_tables()
                except Exception as e:  # noqa: BLE001
                    rows.append({"pdf": pdf.name, "page": pi, "table": -1,
                                 "rows": 0, "cols": 0, "file": "",
                                 "error": f"{type(e).__name__}: {e}"})
                    continue
                for ti, tbl in enumerate(tables):
                    if not tbl or len(tbl) < min_rows:
                        continue
                    width = max((len(r) for r in tbl if r), default=0)
                    if width < min_cols:
                        continue
                    fn = outdir / f"p{pi:03d}_t{ti}.csv"
                    with fn.open("w", newline="", encoding="utf-8") as fh:
                        w = csv.writer(fh)
                        for r in tbl:
                            w.writerow(["" if c is None else str(c).replace("\n", " ").strip()
                                        for c in r])
                    header = [c for c in (tbl[0] or []) if c][:6]
                    rows.append({"pdf": pdf.name, "state_dir": state_dir_of(pdf),
                                 "page": pi, "table": ti, "rows": len(tbl), "cols": width,
                                 "file": str(fn.relative_to(RAW.parent)),
                                 "header_sample": " | ".join(str(h)[:40] for h in header),
                                 "pdf_total_pages": n_pages, "error": ""})
                    log(f"  {pdf.name} p{pi} t{ti}: {len(tbl)}x{width}")
    except Exception as e:  # noqa: BLE001
        rows.append({"pdf": pdf.name, "page": -1, "table": -1, "rows": 0, "cols": 0,
                     "file": "", "error": f"{type(e).__name__}: {e}"})
        log(f"  PDF FAIL {pdf.name}: {type(e).__name__}: {e}")
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pattern", default="*.pdf")
    ap.add_argument("--min-rows", type=int, default=3)
    ap.add_argument("--min-cols", type=int, default=2)
    ap.add_argument("--max-pages", type=int, default=0)
    ap.add_argument("--start-page", type=int, default=1)
    a = ap.parse_args()
    ensure_dirs()
    pdfs = sorted(RAW.rglob(a.pattern))
    pdfs = [p for p in pdfs if "pdf_tables" not in p.parts]
    log(f"PDFs to process: {len(pdfs)}")
    allrows = []
    for pdf in pdfs:
        log(f"{pdf.name} ({pdf.stat().st_size/1e6:.2f} MB)")
        allrows.extend(extract_pdf(pdf, a.min_rows, a.min_cols, a.max_pages,
                                   a.start_page))
    with (REPORTS_TABLES / "pdf_table_index.csv").open("w", newline="",
                                                       encoding="utf-8") as fh:
        cols = ["pdf", "state_dir", "page", "table", "rows", "cols", "file",
                "header_sample", "pdf_total_pages", "error"]
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in allrows:
            w.writerow(r)
    (METADATA / "pdf_table_index.json").write_text(
        json.dumps(allrows, indent=2, ensure_ascii=False, default=str)[:4_000_000],
        encoding="utf-8")
    ok = [r for r in allrows if r["file"]]
    log(f"extracted {len(ok)} tables from {len({r['pdf'] for r in ok})} PDFs")


if __name__ == "__main__":
    main()
