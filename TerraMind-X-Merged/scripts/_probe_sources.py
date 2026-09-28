"""Fast parallel probe of official data URLs."""
from __future__ import annotations

import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

CTX = ssl.create_default_context()
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TerraMindDataCollector/1.0"
}

URLS = [
    ("mahasdb", "https://mahasdb.maharashtra.gov.in/home.do"),
    ("krishi", "https://krishi.maharashtra.gov.in/"),
    ("agrimark", "https://agrimark.tn.gov.in/"),
    ("mh_opendata", "https://data.maharashtra.gov.in/"),
    ("desagri", "https://desagri.gov.in/"),
    ("desagri_asag", "https://desagri.gov.in/document-report-category/agricultural-statistics-at-a-glance/"),
    ("mospi", "https://www.mospi.gov.in/"),
    ("imd_pune", "https://www.imdpune.gov.in/"),
    ("mausam", "https://mausam.imd.gov.in/"),
    ("cgwb", "https://cgwb.gov.in/"),
    ("wris", "https://indiawris.gov.in/"),
    ("ceda_states", "https://agmarknet.ceda.ashoka.edu.in/api/states"),
    ("ceda_commodities", "https://agmarknet.ceda.ashoka.edu.in/api/commodities"),
    ("harvard_icrisat", "https://dataverse.harvard.edu/api/search?q=ICRISAT%20District%20Level%20Database&type=dataset"),
    ("nasa_power", "https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=80.27&latitude=13.08&start=202001&end=202002&format=JSON"),
    ("fao_api", "https://fenixservices.fao.org/faostat/api/v1/en/groupsanddomains"),
    ("datagov_home", "https://www.data.gov.in/"),
    ("datagov_api", "https://api.data.gov.in/resource/9ef84268-d588-448a-a48b-15f1c5718621?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=1"),
    ("eands", "https://eands.dacnet.nic.in/"),
    ("icrisat_dld", "https://data.icrisat.org/dld/"),
    ("openmeteo", "https://archive-api.open-meteo.com/v1/archive?latitude=13.08&longitude=80.27&start_date=2020-01-01&end_date=2020-01-31&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata"),
    ("worldbank", "https://api.worldbank.org/v2/country/IND/indicator/AG.PRD.CROP.XD?format=json&per_page=5"),
    ("rbi", "https://rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook of Statistics on Indian States"),
    ("tn_des", "https://www.des.tn.gov.in/en/node/18"),
    ("aps", "https://aps.dac.gov.in/"),
]


def probe(name: str, url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20, context=CTX) as resp:
            body = resp.read(250)
            return f"OK {name} status={resp.status} ctype={resp.headers.get('content-type')} n={len(body)} snippet={body[:120]!r}"
    except Exception as e:
        return f"FAIL {name} {type(e).__name__}: {e}"


def main():
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(probe, n, u): n for n, u in URLS}
        for fut in as_completed(futs):
            print(fut.result(), flush=True)


if __name__ == "__main__":
    main()
