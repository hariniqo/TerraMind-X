"""Clean raw CEDA/AGMARKNET market JSON into standardized processed CSVs.

Grain of the output:
  * data/processed/<state>/market_prices_<state>.csv
      one row per (date, market, commodity, variety) - the AGMARKNET series grain
  * data/processed/<state>/market_arrivals_<state>.csv
      one row per (date, market, commodity)
  * data/combined/market_prices.csv - both states, prices + arrivals joined on
    the exact grain key with a row-count audit (no accidental many-to-many).

Units are preserved exactly as published: AGMARKNET price = Rs per quintal,
arrivals = metric tonnes. No unit conversion is applied, so nothing is mixed.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "collect"))
from tdcommon import (  # noqa: E402
    COMBINED, METADATA, PROCESSED, RAW, ensure_dirs, log, record, sha256_file, today,
)

STATE_SLUGS = {"maharashtra": "Maharashtra", "tamil_nadu": "Tamil Nadu"}
PRICE_UNIT = "INR_per_quintal"
ARRIVAL_UNIT = "metric_tonne"

PRICE_COLS = ["state", "district", "market", "market_id", "commodity", "variety",
              "date", "year", "month", "min_price", "max_price", "modal_price",
              "price_unit", "source_id"]
ARRIVAL_COLS = ["state", "district", "market", "market_id", "commodity", "date",
                "year", "month", "arrivals", "arrivals_unit", "source_id"]


def _load_rows(paths: list[Path]) -> list[dict]:
    rows = []
    for p in sorted(paths):
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            log(f"  unreadable {p.name}: {type(e).__name__}: {e}")
            continue
        data = j.get("data") if isinstance(j, dict) else j
        if not isinstance(data, list):
            continue
        for r in data:
            if isinstance(r, dict):
                rows.append(r)
    return rows


def _to_frame(rows: list[dict], state: str, kind: str) -> pd.DataFrame:
    empty_cols = PRICE_COLS if kind == "prices" else ARRIVAL_COLS
    if not rows:
        return pd.DataFrame(columns=empty_cols)
    df = pd.DataFrame(rows)
    df["state"] = df["state_name"].fillna(state) if "state_name" in df else state
    df["district"] = df.get("district_name")
    df["market"] = df.get("market_name")
    df["date"] = pd.to_datetime(df.get("t"), errors="coerce")
    df["year"] = df["date"].dt.year.astype("Int64")
    df["month"] = df["date"].dt.month.astype("Int64")
    df["source_id"] = "ceda_agmarknet"
    if kind == "prices":
        for c in ("p_min", "p_max", "p_modal"):
            df[c] = pd.to_numeric(df.get(c), errors="coerce")
        out = pd.DataFrame({
            "state": df["state"], "district": df["district"], "market": df["market"],
            "market_id": df.get("market_id"), "commodity": df.get("cmdty"),
            "variety": df.get("variety"), "date": df["date"], "year": df["year"],
            "month": df["month"], "min_price": df["p_min"], "max_price": df["p_max"],
            "modal_price": df["p_modal"], "price_unit": PRICE_UNIT,
            "source_id": df["source_id"],
        })
    else:
        df["qty"] = pd.to_numeric(df.get("qty"), errors="coerce")
        out = pd.DataFrame({
            "state": df["state"], "district": df["district"], "market": df["market"],
            "market_id": df.get("market_id"), "commodity": df.get("cmdty"),
            "date": df["date"], "year": df["year"], "month": df["month"],
            "arrivals": df["qty"], "arrivals_unit": ARRIVAL_UNIT,
            "source_id": df["source_id"],
        })
    out = out.dropna(subset=["date"])
    out = out.loc[~(out["district"].isna() & out["market"].isna())]
    return out.reset_index(drop=True)


def main() -> None:
    ensure_dirs()
    price_frames, arrival_frames = [], []
    stats = {}
    for slug, state in STATE_SLUGS.items():
        pdir = RAW / slug / "market" / "ceda" / "prices"
        adir = RAW / slug / "market" / "ceda" / "quantities"
        p_files = list(pdir.glob("*.json")) if pdir.exists() else []
        a_files = list(adir.glob("*.json")) if adir.exists() else []
        pdf = _to_frame(_load_rows(p_files), state, "prices")
        adf = _to_frame(_load_rows(a_files), state, "arrivals")

        outdir = PROCESSED / slug
        outdir.mkdir(parents=True, exist_ok=True)
        if len(pdf):
            pdf.to_csv(outdir / f"market_prices_{slug}.csv", index=False,
                       encoding="utf-8")
        if len(adf):
            adf.to_csv(outdir / f"market_arrivals_{slug}.csv", index=False,
                       encoding="utf-8")

        for df, nm, nfiles in ((pdf, "prices", len(p_files)),
                               (adf, "arrivals", len(a_files))):
            key = (["date", "market", "commodity", "variety"] if nm == "prices"
                   else ["date", "market", "commodity"])
            stats[f"{slug}_{nm}"] = {
                "raw_files": nfiles,
                "rows": int(len(df)),
                "districts": int(df["district"].nunique()) if len(df) else 0,
                "markets": int(df["market"].nunique()) if len(df) else 0,
                "commodities": int(df["commodity"].nunique()) if len(df) else 0,
                "min_year": (int(df["year"].min())
                             if len(df) and df["year"].notna().any() else None),
                "max_year": (int(df["year"].max())
                             if len(df) and df["year"].notna().any() else None),
                "exact_duplicate_rows": int(df.duplicated().sum()) if len(df) else 0,
                "duplicate_on_grain_key": (int(df.duplicated(subset=key).sum())
                                           if len(df) else 0),
            }
            log(f"{slug} {nm}: {len(df)} rows from {nfiles} raw files, "
                f"{stats[f'{slug}_{nm}']['districts']} districts, "
                f"{stats[f'{slug}_{nm}']['commodities']} commodities")
        if len(pdf):
            price_frames.append(pdf)
        if len(adf):
            arrival_frames.append(adf)

    if price_frames:
        prices = pd.concat(price_frames, ignore_index=True)
        before = len(prices)
        prices = prices.drop_duplicates().reset_index(drop=True)
        stats["combined_prices_dedup"] = {"before": before, "after": len(prices),
                                         "dropped_exact_duplicates": before - len(prices)}
        prices.to_csv(COMBINED / "market_prices.csv", index=False, encoding="utf-8")
        log(f"combined market_prices.csv: {len(prices)} rows "
            f"({before - len(prices)} exact duplicates removed)")

    if arrival_frames:
        arr = pd.concat(arrival_frames, ignore_index=True)
        before = len(arr)
        arr = arr.drop_duplicates().reset_index(drop=True)
        stats["combined_arrivals_dedup"] = {"before": before, "after": len(arr),
                                           "dropped_exact_duplicates": before - len(arr)}
        arr.to_csv(COMBINED / "market_arrivals.csv", index=False, encoding="utf-8")
        log(f"combined market_arrivals.csv: {len(arr)} rows")

        base = pd.read_csv(COMBINED / "market_prices.csv")
        n_before = len(base)
        merged = base.merge(
            arr.drop(columns=["year", "month", "state"]),
            on=["date", "market", "commodity"], how="left",
            suffixes=("", "_arr"), validate="many_to_one")
        stats["price_arrival_merge"] = {
            "prices_rows_before": n_before, "prices_rows_after": len(merged),
            "row_multiplication": len(merged) - n_before,
            "match_rate": (round(float(merged["arrivals"].notna().mean()), 4)
                           if len(merged) else 0.0),
            "join_key": "date + market + commodity (validated many_to_one)",
        }
        if len(merged) != n_before:
            log("!! MERGE MULTIPLIED ROWS - audit written, prices left unmodified")
        else:
            merged.to_csv(COMBINED / "market_prices.csv", index=False, encoding="utf-8")
            log(f"market_prices.csv enriched with arrivals: {len(merged)} rows, "
                f"match_rate={stats['price_arrival_merge']['match_rate']}")
        stats["market_prices_sha256"] = sha256_file(COMBINED / "market_prices.csv")

    (METADATA / "market_cleaning_stats.json").write_text(
        json.dumps(stats, indent=2, ensure_ascii=False), encoding="utf-8")
    record({
        "source_id": "processed_market_ceda", "organization": "CEDA / AGMARKNET",
        "dataset_name": "Standardized market prices + arrivals (TN, MH)",
        "category": "market", "state": "Tamil Nadu; Maharashtra",
        "url": "https://agmarknet.ceda.ashoka.edu.in/",
        "download_url": "https://agmarknet.ceda.ashoka.edu.in/api/prices",
        "file_name": "data/combined/market_prices.csv", "file_type": "CSV",
        "retrieval_date": today(), "publication_year": "",
        "coverage_start": "2015-01", "coverage_end": "2025-12",
        "geographic_level": "market (mandi)",
        "license": "AGMARKNET / CEDA public data", "status": "DOWNLOADED",
        "notes": "Prices in INR/quintal and arrivals in metric tonnes exactly as "
                 "published; no cross-unit mixing, no imputation.",
    })
    log("market cleaning complete")


if __name__ == "__main__":
    main()
