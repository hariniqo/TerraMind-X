"""Probe official TerraMind data endpoints and report reachability + content type.

Writes data/metadata/endpoint_probe.json (real HTTP results, no invention).
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from tdcommon import HEADERS, METADATA, SSL_CTX, ensure_dirs, log  # noqa: E402

OGD_SAMPLE_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

ENDPOINTS = [
    # --- Level 2: research institutions / mirrors -------------------------
    ("ceda_states", "CEDA Ashoka (Agmarknet mirror)", "market",
     "https://agmarknet.ceda.ashoka.edu.in/api/states", "GET", None),
    ("ceda_commodities", "CEDA Ashoka (Agmarknet mirror)", "market",
     "https://agmarknet.ceda.ashoka.edu.in/api/commodities", "GET", None),
    ("icrisat_dld", "ICRISAT District Level Database", "crop",
     "https://data.icrisat.org/dld/", "GET", None),
    ("nasapower_ping", "NASA POWER (MERRA-2 reanalysis)", "weather",
     "https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR,RH2M"
     "&community=AG&longitude=80.27&latitude=13.08&start=2015&end=2015&format=JSON", "GET", None),
    ("openmeteo_ping", "Open-Meteo ERA5 archive (reanalysis)", "weather",
     "https://archive-api.open-meteo.com/v1/archive?latitude=13.08&longitude=80.27"
     "&start_date=2015-01-01&end_date=2015-01-03&daily=precipitation_sum&timezone=Asia%2FKolkata",
     "GET", None),
    # --- Level 1: Government of India ------------------------------------
    ("ogd_datagovin_root", "data.gov.in (OGD India)", "portal",
     "https://www.data.gov.in/", "GET", None),
    ("ogd_api_mandi", "data.gov.in API - daily mandi prices", "market",
     "https://api.data.gov.in/resource/9ef84268-d588-448a-a48b-15f1c5718621"
     f"?api-key={OGD_SAMPLE_KEY}&format=json&limit=1", "GET", None),
    ("ogd_api_mandi_alt", "data.gov.in API - daily mandi prices (alt rid)", "market",
     "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
     f"?api-key={OGD_SAMPLE_KEY}&format=json&limit=1", "GET", None),
    ("eands", "Directorate of Economics & Statistics (eands)", "crop",
     "https://eands.dacnet.nic.in/", "GET", None),
    ("desagri", "DES Agri (desagri.gov.in)", "crop", "https://desagri.gov.in/", "GET", None),
    ("agriwelfare", "Ministry of Agriculture & Farmers Welfare", "crop",
     "https://agriwelfare.gov.in/", "GET", None),
    ("imdpune", "India Meteorological Department Pune", "weather",
     "https://www.imdpune.gov.in/", "GET", None),
    ("mausam", "IMD mausam", "weather", "https://mausam.imd.gov.in/", "GET", None),
    ("nhb_horti", "National Horticulture Board", "crop", "https://nhb.gov.in/", "GET", None),
    ("fert_nic", "Department of Fertilizers", "inputs", "https://www.fert.nic.in/", "GET", None),
    ("micensus", "Minor Irrigation Census", "irrigation", "https://micensus.gov.in/", "GET", None),
    ("indiawris", "India-WRIS", "irrigation", "https://indiawris.gov.in/", "GET", None),
    ("soilhealth", "Soil Health Card portal", "soil",
     "https://soilhealth.dac.gov.in/", "GET", None),
    ("ndma", "National Disaster Management Authority", "events",
     "https://ndma.gov.in/", "GET", None),
    ("cgwb", "Central Ground Water Board", "irrigation", "https://cgwb.gov.in/", "GET", None),
    # --- Level 1: Tamil Nadu ---------------------------------------------
    ("tn_opendata", "Tamil Nadu Open Data", "portal",
     "https://www.data.tn.gov.in/", "GET", None),
    ("tn_des", "TN Department of Economics & Statistics", "crop",
     "https://www.des.tn.gov.in/", "GET", None),
    ("agrimark_tn", "TN Agricultural Marketing (agrimark)", "market",
     "https://agrimark.tn.gov.in/", "GET", None),
    ("tn_agri", "TN Agriculture Department", "crop",
     "https://www.tn.gov.in/department/2", "GET", None),
    # --- Level 1: Maharashtra -------------------------------------------
    ("mahasdb", "Maharashtra State Data Bank", "portal",
     "https://mahasdb.maharashtra.gov.in/home.do", "GET", None),
    ("mahades", "Maharashtra DES (mahades)", "crop",
     "https://mahades.maharashtra.gov.in/", "GET", None),
    ("maha_opendata", "Maharashtra Open Data", "portal",
     "https://data.maharashtra.gov.in/", "GET", None),
    ("msamb", "Maharashtra State Agricultural Marketing Board", "market",
     "https://msamb.com/", "GET", None),
    ("krishi_maha", "Krishi Maharashtra", "crop",
     "https://krishi.maharashtra.gov.in/", "GET", None),
    # --- Level 3 (documented fallbacks) ----------------------------------
    ("worldbank_ind", "World Bank API (India)", "macro",
     "https://api.worldbank.org/v2/country/IND/indicator/AG.PRD.CROP.XD?format=json&per_page=3",
     "GET", None),
    ("faostat", "FAOSTAT API", "crop",
     "https://fenixservices.fao.org/faostat/api/v1/en/groupsanddomains", "GET", None),
]


def probe(item) -> dict:
    eid, org, cat, url, method, payload = item
    t0 = time.time()
    hdrs = dict(HEADERS)
    body = None
    if method == "POST" and payload is not None:
        hdrs["Content-Type"] = "application/json"
        body = json.dumps(payload).encode()
    try:
        req = urllib.request.Request(url, headers=hdrs, data=body, method=method)
        with urllib.request.urlopen(req, timeout=25, context=SSL_CTX) as resp:
            head = resp.read(600)
            return {
                "endpoint_id": eid, "organization": org, "category": cat, "url": url,
                "method": method, "status": "OK", "http_status": resp.status,
                "content_type": resp.headers.get("content-type"),
                "elapsed_s": round(time.time() - t0, 2),
                "snippet": head[:300].decode("utf-8", "replace"),
            }
    except Exception as e:  # noqa: BLE001
        return {
            "endpoint_id": eid, "organization": org, "category": cat, "url": url,
            "method": method, "status": type(e).__name__,
            "http_status": getattr(e, "code", None),
            "content_type": None, "elapsed_s": round(time.time() - t0, 2),
            "error": str(e)[:300],
        }


def main() -> None:
    ensure_dirs()
    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = [ex.submit(probe, item) for item in ENDPOINTS]
        for fut in as_completed(futs):
            r = fut.result()
            results.append(r)
            log(f"{r['status']:<22} {r['endpoint_id']:<20} {r.get('http_status')} "
                f"{r.get('content_type')} {r.get('elapsed_s')}s {r.get('error', '')}")
    results.sort(key=lambda r: (r["category"], r["endpoint_id"]))
    out = METADATA / "endpoint_probe.json"
    out.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    ok = sum(1 for r in results if r["status"] == "OK")
    log(f"probed {len(results)} endpoints, {ok} OK -> {out}")


if __name__ == "__main__":
    main()
