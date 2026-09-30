"""Clean raw weather JSON into the standardized weather tables.

Inputs (all in data/raw/):
  * openmeteo_era5/<state>__<district_id>__<year>.json  - daily ERA5 reanalysis
  * nasa_power_monthly/<state>__<district_id>__<start>_<end>.json - monthly MERRA-2

Outputs:
  * data/processed/<state>/weather_daily_<state>.csv
  * data/processed/<state>/weather_monthly_<state>.csv
  * data/combined/weather_history.csv  (monthly grain, both states)

data_type is always written as "reanalysis" - these are physically-modelled
gridded products, NOT IMD rain-gauge/station observations. rainfall_deviation is
computed against the district 2015-2025 monthly normal FROM THIS SAME SERIES and
is labelled as a derived column. No observation is imputed or invented.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "collect"))
from tdcommon import (  # noqa: E402
    COMBINED, METADATA, PROCESSED, RAW, ensure_dirs, log, record, today,
)

STATE_SLUGS = {"maharashtra": "Maharashtra", "tamil_nadu": "Tamil Nadu"}

DAILY_MAP = {
    "precipitation_sum": "rainfall_mm",
    "rain_sum": "rain_mm",
    "temperature_2m_max": "temperature_max_c",
    "temperature_2m_min": "temperature_min_c",
    "temperature_2m_mean": "temperature_mean_c",
    "relative_humidity_2m_mean": "relative_humidity_pct",
    "et0_fao_evapotranspiration": "et0_mm",
}
POWER_MAP = {
    "PRECTOTCORR": "rainfall_mm_power", "T2M": "temperature_mean_c_power",
    "T2M_MAX": "temperature_max_c_power", "T2M_MIN": "temperature_min_c_power",
    "RH2M": "relative_humidity_pct_power", "T2MDEW": "dewpoint_c_power",
    "ALLSKY_SFC_SW_DWN": "solar_radiation_power",
}


def _districts(slug: str) -> dict:
    p = RAW / slug / "reference" / "districts.json"
    rows = json.loads(p.read_text(encoding="utf-8")) if p.exists() else []
    return {int(r["census_district_id"]): r["district_name"] for r in rows}


def load_daily(slug: str) -> pd.DataFrame:
    d = _districts(slug)
    frames = []
    for p in sorted((RAW / slug / "weather" / "openmeteo_era5").glob("*.json")):
        parts = p.stem.split("__")
        if len(parts) != 3:
            continue
        did = int(parts[1])
        year = int(parts[2])
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        daily = j.get("daily") or {}
        if not daily.get("time"):
            continue
        df = pd.DataFrame({"date": pd.to_datetime(daily["time"], errors="coerce")})
        for src, dst in DAILY_MAP.items():
            if src in daily:
                df[dst] = pd.to_numeric(pd.Series(daily[src]), errors="coerce")
        df["district_id"] = did
        df["district"] = d.get(did)
        df["year"] = year
        df["source_file"] = p.name
        frames.append(df)
    if not frames:
        return pd.DataFrame()
    out = pd.concat(frames, ignore_index=True)
    out = out.drop_duplicates(subset=["district_id", "date"], keep="first")
    return out.sort_values(["district_id", "date"]).reset_index(drop=True)


def load_power(slug: str) -> pd.DataFrame:
    d = _districts(slug)
    frames = []
    for p in sorted((RAW / slug / "weather" / "nasa_power_monthly").glob("*.json")):
        parts = p.stem.split("__")
        if len(parts) != 3:
            continue
        did = int(parts[1])
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        params = (j.get("properties") or {}).get("parameter") or {}
        recs = {}
        for pname, series in params.items():
            if not isinstance(series, dict):
                continue
            for yyyymm, val in series.items():
                if len(str(yyyymm)) != 6:
                    continue
                recs.setdefault(yyyymm, {})[POWER_MAP.get(pname, pname.lower())] = val
        rows = []
        for yyyymm, vals in recs.items():
            vals = {k: v for k, v in vals.items() if v not in (-999.0, -999)}
            rows.append({"year": int(str(yyyymm)[:4]), "month": int(str(yyyymm)[4:6]),
                         "district_id": did, "district": d.get(did), **vals})
        if rows:
            frames.append(pd.DataFrame(rows))
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def _monthly_from_daily(daily: pd.DataFrame, state: str) -> pd.DataFrame:
    agg = {c: "sum" for c in ("rainfall_mm", "rain_mm", "et0_mm") if c in daily}
    for c in ("temperature_max_c", "temperature_min_c", "temperature_mean_c",
              "relative_humidity_pct"):
        if c in daily:
            agg[c] = "mean"
    present = (daily.groupby(["district_id", "year", "month"], dropna=False)
               .size().rename("days_in_month_present").reset_index())
    g = (daily.groupby(["district_id", "district", "year", "month"], dropna=False)
         .agg(agg).reset_index())
    g = g.merge(present, on=["district_id", "year", "month"], how="left")
    g["rainfall_monthly_mm"] = g.get("rainfall_mm")
    norm = (g.groupby(["district_id", "month"])["rainfall_monthly_mm"]
            .transform("mean"))
    g["normal_rainfall_monthly_mm"] = norm
    g["rainfall_deviation_mm"] = g["rainfall_monthly_mm"] - norm
    g["rainfall_deviation_pct"] = np.where(norm > 0,
                                           100.0 * g["rainfall_deviation_mm"] / norm,
                                           np.nan)
    g["normal_basis"] = "district monthly mean of the collected period (derived column)"
    g["state"] = state
    g["data_type"] = "reanalysis"
    g["source_id"] = "openmeteo_era5"
    return g


def main() -> None:
    ensure_dirs()
    stats, monthly_all = {}, []
    for slug, state in STATE_SLUGS.items():
        daily = load_daily(slug)
        power = load_power(slug)
        outdir = PROCESSED / slug
        outdir.mkdir(parents=True, exist_ok=True)

        if len(daily):
            daily.insert(0, "state", state)
            daily["month"] = daily["date"].dt.month
            daily["data_type"] = "reanalysis"
            daily["source_id"] = "openmeteo_era5"
            daily.to_csv(outdir / f"weather_daily_{slug}.csv", index=False,
                         encoding="utf-8")
            g = _monthly_from_daily(daily, state)
            g.to_csv(outdir / f"weather_monthly_{slug}.csv", index=False,
                     encoding="utf-8")
            monthly_all.append(g)
            stats[f"{slug}_daily"] = {
                "rows": int(len(daily)), "districts": int(daily["district"].nunique()),
                "min_date": str(daily["date"].min().date()),
                "max_date": str(daily["date"].max().date()),
                "columns": int(daily.shape[1]),
            }
            stats[f"{slug}_monthly"] = {
                "rows": int(len(g)), "districts": int(g["district"].nunique()),
                "min_year": int(g["year"].min()), "max_year": int(g["year"].max()),
            }
            log(f"{slug} daily: {len(daily)} rows, {daily['district'].nunique()} districts; "
                f"monthly: {len(g)} rows")

        if len(power):
            power["state"] = state
            power["data_type"] = "reanalysis"
            power["source_id"] = "nasa_power_merra2"
            power.to_csv(outdir / f"weather_monthly_nasa_power_{slug}.csv", index=False,
                         encoding="utf-8")
            stats[f"{slug}_nasa_power"] = {
                "rows": int(len(power)), "districts": int(power["district"].nunique()),
                "min_year": int(power["year"].min()), "max_year": int(power["year"].max()),
            }
            log(f"{slug} NASA POWER monthly: {len(power)} rows")

    if monthly_all:
        comb = pd.concat(monthly_all, ignore_index=True)
        comb.to_csv(COMBINED / "weather_history.csv", index=False, encoding="utf-8")
        log(f"combined weather_history.csv: {len(comb)} district-month rows")
        stats["combined_weather_history"] = {
            "rows": int(len(comb)), "states": int(comb["state"].nunique()),
            "districts": int(comb["district"].nunique()),
            "min_year": int(comb["year"].min()), "max_year": int(comb["year"].max()),
        }

    (METADATA / "weather_cleaning_stats.json").write_text(
        json.dumps(stats, indent=2, ensure_ascii=False), encoding="utf-8")
    record({
        "source_id": "processed_weather", "organization": "Open-Meteo (ERA5); NASA POWER",
        "dataset_name": "Standardized daily + monthly district weather (TN, MH)",
        "category": "weather", "state": "Tamil Nadu; Maharashtra",
        "url": "https://open-meteo.com/en/docs/historical-weather-api",
        "download_url": "https://archive-api.open-meteo.com/v1/archive",
        "file_name": "data/combined/weather_history.csv", "file_type": "CSV",
        "retrieval_date": today(), "publication_year": "",
        "coverage_start": "2015-01-01", "coverage_end": "2025-12-31",
        "geographic_level": "district (point)",
        "license": "Open-Meteo CC BY 4.0; NASA POWER open data",
        "status": "DOWNLOADED",
        "notes": "REANALYSIS, not gauge observations. normal_rainfall_monthly_mm and "
                 "rainfall_deviation_* are derived columns documented in the data "
                 "dictionary.",
    })
    log("weather cleaning complete")


if __name__ == "__main__":
    main()
