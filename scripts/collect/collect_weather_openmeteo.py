"""Collect district-level daily weather for Tamil Nadu and Maharashtra.

Source: Open-Meteo Historical Weather API (ERA5 / ERA5-Land reanalysis).
  Docs: https://open-meteo.com/en/docs/historical-weather-api
This is **reanalysis**, not IMD station observation. It is recorded as such in
the source registry and in docs/data_sources.md. No values are invented: every
value written here comes back from the API response saved under data/raw/.

Usage:
    python scripts/collect/collect_weather_openmeteo.py geocode
    python scripts/collect/collect_weather_openmeteo.py fetch [--start 2015-01-01] [--end 2025-12-31]
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

ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
GEOCODE = "https://geocoding-api.open-meteo.com/v1/search"

DAILY_VARS = [
    "precipitation_sum",
    "rain_sum",
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "relative_humidity_2m_mean",
    "et0_fao_evapotranspiration",
]

STATES = {
    "tamil_nadu": {"name": "Tamil Nadu", "slug": "tamil_nadu"},
    "maharashtra": {"name": "Maharashtra", "slug": "maharashtra"},
}


def districts_path(slug: str) -> Path:
    return RAW / slug / "reference" / "districts.json"


def load_districts(slug: str) -> list[dict]:
    p = districts_path(slug)
    if not p.exists():
        raise SystemExit(f"missing {p}; run `discover_ceda`/`districts` step first")
    return json.loads(p.read_text(encoding="utf-8"))


def cmd_geocode() -> None:
    """Resolve district HQ coordinates via the Open-Meteo geocoding API (GeoNames).

    The raw geocoding responses are preserved so every coordinate is traceable.
    A district is only accepted when the returned admin1 matches the state.
    """
    ensure_dirs()
    out_dir = RAW / "reference" / "geocoding"
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {}
    for slug, meta in STATES.items():
        resolved, unresolved = [], []
        for d in load_districts(slug):
            name = d["district_name"]
            q = name.replace("&", "and")
            j, s, e = http_get_json(
                f"{GEOCODE}?name={q.replace(' ', '+')}&count=10&language=en&format=json",
                timeout=30,
            )
            (out_dir / f"{slug}__{d['census_district_id']}.json").write_text(
                json.dumps(j, indent=2, ensure_ascii=False, default=str), encoding="utf-8"
            )
            hit = None
            if s == "OK" and isinstance(j, dict):
                for r in (j.get("results") or []):
                    if (r.get("admin1") or "").strip().lower() == meta["name"].lower():
                        hit = r
                        break
            if hit:
                resolved.append({
                    "census_district_id": d["census_district_id"],
                    "district_name": name,
                    "latitude": hit.get("latitude"),
                    "longitude": hit.get("longitude"),
                    "geonames_id": hit.get("id"),
                    "admin1": hit.get("admin1"),
                    "admin2": hit.get("admin2"),
                    "timezone": hit.get("timezone"),
                    "elevation": hit.get("elevation"),
                    "geocode_query": q,
                })
            else:
                unresolved.append({"district_name": name, "status": s, "error": e})
            time.sleep(0.25)
        p = RAW / slug / "reference" / "district_coordinates.json"
        p.write_text(json.dumps(resolved, indent=2, ensure_ascii=False), encoding="utf-8")
        record({
            "source_id": f"openmeteo_geocode_{slug}",
            "organization": "Open-Meteo geocoding (GeoNames)",
            "dataset_name": f"{meta['name']} district HQ coordinates",
            "category": "reference", "state": meta["name"],
            "url": "https://open-meteo.com/en/docs/geocoding-api",
            "download_url": GEOCODE, "file_name": str(p.relative_to(RAW.parent)),
            "file_type": "JSON", "retrieval_date": today(),
            "coverage_start": "", "coverage_end": "", "geographic_level": "district",
            "license": "GeoNames CC BY 4.0 via Open-Meteo",
            "status": "DOWNLOADED",
            "notes": f"{len(resolved)} districts resolved, {len(unresolved)} unresolved",
            "sha256": sha256_file(p), "bytes": p.stat().st_size,
        })
def _archive_fetch(url: str, attempts: int = 6):
    """GET an archive URL, backing off hard on HTTP 429 (Open-Meteo rate limit)."""
    for i in range(1, attempts + 1):
        j, s, e = http_get_json(url, timeout=90, max_attempts=1)
        if s == "OK":
            return j, "OK", None
        if s == "ACCESS_DENIED" and e and "429" in e:
            wait = 15 * i
            log(f"    429 from Open-Meteo; sleeping {wait}s (attempt {i})")
            time.sleep(wait)
            continue
        time.sleep(2 * i)
    return None, s, e


def cmd_fetch(start: str, end: str) -> None:
    """Download one daily ERA5 archive JSON per district per calendar year."""
    ensure_dirs()
    start_year, end_year = int(start[:4]), int(end[:4])
    outcomes = []
    for slug, meta in STATES.items():
        coords = json.loads(
            (RAW / slug / "reference" / "district_coordinates.json").read_text(encoding="utf-8")
        )
        wdir = RAW / slug / "weather" / "openmeteo_era5"
        wdir.mkdir(parents=True, exist_ok=True)
        consecutive_fail = 0
        for d in coords:
            for year in range(start_year, end_year + 1):
                y0 = max(start, f"{year}-01-01")
                y1 = min(end, f"{year}-12-31")
                dest = wdir / f"{slug}__{d['census_district_id']}__{year}.json"
                if dest.exists() and dest.stat().st_size > 0:
                    outcomes.append(("DOWNLOADED", dest, dest.stat().st_size, 0))
                    continue
                url = (
                    f"{ARCHIVE}?latitude={d['latitude']}&longitude={d['longitude']}"
                    f"&start_date={y0}&end_date={y1}&daily={','.join(DAILY_VARS)}"
                    f"&timezone=Asia%2FKolkata&models=era5"
                )
                j, s, e = _archive_fetch(url)
                if s != "OK" or not isinstance(j, dict) or "daily" not in j:
                    outcomes.append((s if s != "OK" else "PARSING_ERROR", dest, 0, 0))
                    log(f"FAIL {dest.name} status={s} err={e}")
                    consecutive_fail += 1
                    if consecutive_fail >= 8:
                        log("!! 8 consecutive failures - stopping this run so that "
                            "already-downloaded files are kept and the job stays resumable")
                        bad = [o for o in outcomes if o[0] != "DOWNLOADED"]
                        (METADATA / "openmeteo_failures.json").write_text(
                            json.dumps([{"status": s2, "file": str(p)}
                                        for s2, p, _, _ in bad], indent=2), encoding="utf-8")
                        return
                    continue
                consecutive_fail = 0
                dest.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")
                outcomes.append(("DOWNLOADED", dest, dest.stat().st_size, 0))
            time.sleep(0.2)
        got = [o for o in outcomes if o[0] == "DOWNLOADED" and o[1].parent.name == "openmeteo_era5"
               and str(slug) in str(o[1])]
        total_bytes = sum(o[2] for o in got)
        log(f"{slug}: {len(got)} daily weather files, {total_bytes/1e6:.2f} MB")
        record({
            "source_id": f"openmeteo_era5_{slug}_districts",
            "organization": "Open-Meteo (ERA5 / ECMWF reanalysis)",
            "dataset_name": f"Daily district weather {meta['name']} "
                            f"{start_year}-{end_year} (ERA5 reanalysis)",
            "category": "weather", "state": meta["name"],
            "url": "https://open-meteo.com/en/docs/historical-weather-api",
            "download_url": ARCHIVE,
            "file_name": f"data/raw/{slug}/weather/openmeteo_era5/ ({len(got)} JSON files)",
            "file_type": "JSON", "retrieval_date": today(),
            "publication_year": "", "coverage_start": start, "coverage_end": end,
            "geographic_level": "district",
            "license": "Open-Meteo free tier, CC BY 4.0 (ERA5 (c) ECMWF, Copernicus)",
            "status": "DOWNLOADED",
            "notes": "MODEL/RESAMPLED: ERA5 reanalysis downsampled for a district point, "
                     "NOT an IMD station observation. Do not label as measured station data.",
        })
    bad = [o for o in outcomes if o[0] != "DOWNLOADED"]
    if bad:
        (METADATA / "openmeteo_failures.json").write_text(
            json.dumps([{"status": s, "file": str(p)} for s, p, _, _ in bad], indent=2),
            encoding="utf-8")
    log(f"weather fetch complete: {len([o for o in outcomes if o[0]=='DOWNLOADED'])} ok, "
        f"{len(bad)} failed")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["geocode", "fetch"])
    ap.add_argument("--start", default="2015-01-01")
    ap.add_argument("--end", default="2025-12-31")
    a = ap.parse_args()
    if a.command == "geocode":
        cmd_geocode()
    else:
        cmd_fetch(a.start, a.end)


if __name__ == "__main__":
    main()
