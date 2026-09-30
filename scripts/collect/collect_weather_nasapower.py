"""Collect NASA POWER monthly agro-climatology for TN + Maharashtra districts.

Source: NASA POWER (Prediction Of Worldwide Energy Resources), MERRA-2 based.
  Docs: https://power.larc.nasa.gov/docs/services/api/
Like Open-Meteo ERA5 this is **reanalysis / model-assimilated data**, not an IMD
station observation. It is stored as an independent cross-check of the ERA5
series and is labelled as such everywhere.

Usage:
    python scripts/collect/collect_weather_nasapower.py --start 2015 --end 2025
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import (  # noqa: E402
    METADATA, RAW, ensure_dirs, http_get_json, log, record, sha256_file, today,
)

API = "https://power.larc.nasa.gov/api/temporal/monthly/point"
PARAMS = "T2M,T2M_MAX,T2M_MIN,T2MDEW,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN"
STATE_NAME = {"maharashtra": "Maharashtra", "tamil_nadu": "Tamil Nadu"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, default=2015)
    ap.add_argument("--end", type=int, default=2025)
    a = ap.parse_args()
    ensure_dirs()
    summary = {}
    for slug, state in STATE_NAME.items():
        coords = json.loads(
            (RAW / slug / "reference" / "district_coordinates.json").read_text(encoding="utf-8")
        )
        outdir = RAW / slug / "weather" / "nasa_power_monthly"
        outdir.mkdir(parents=True, exist_ok=True)
        n_ok = n_fail = 0
        nbytes = 0
        for d in coords:
            dest = outdir / f"{slug}__{d['census_district_id']}__{a.start}_{a.end}.json"
            if dest.exists() and dest.stat().st_size > 0:
                n_ok += 1
                continue
            url = (f"{API}?parameters={PARAMS}&community=AG"
                   f"&longitude={d['longitude']}&latitude={d['latitude']}"
                   f"&start={a.start}&end={a.end}&format=JSON")
            j, s, e = http_get_json(url, timeout=90, max_attempts=3)
            if s != "OK" or not isinstance(j, dict) or "properties" not in j:
                n_fail += 1
                log(f"FAIL NASA POWER {d['district_name']} status={s} err={e}")
                continue
            dest.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")
            n_ok += 1
            nbytes += dest.stat().st_size
            time.sleep(0.3)
        summary[slug] = {"ok": n_ok, "failed": n_fail, "bytes": nbytes}
        log(f"{slug}: NASA POWER {n_ok} files ok, {n_fail} failed, {nbytes/1e6:.2f} MB")
        record({
            "source_id": f"nasa_power_{slug}_monthly",
            "organization": "NASA POWER (NASA Langley Research Center)",
            "dataset_name": f"Monthly agro-climatology {state} {a.start}-{a.end} "
                            f"(MERRA-2 reanalysis)",
            "category": "weather", "state": state,
            "url": "https://power.larc.nasa.gov/data-access-viewer/",
            "download_url": API,
            "file_name": f"data/raw/{slug}/weather/nasa_power_monthly/ ({n_ok} JSON files)",
            "file_type": "JSON", "retrieval_date": today(),
            "publication_year": "", "coverage_start": f"{a.start}-01",
            "coverage_end": f"{a.end}-12", "geographic_level": "district (point)",
            "license": "NASA POWER open data, free for public use",
            "status": "DOWNLOADED",
            "notes": "MODEL/RESAMPLED: MERRA-2 reanalysis at district HQ point, "
                     "not a measured IMD station series. Used only to cross-check ERA5.",
        })
    (METADATA / "nasa_power_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
