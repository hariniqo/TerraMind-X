"""
Pull daily mandi price + arrival data for Maharashtra from the official
data.gov.in AGMARKNET resource and load it into the app's MarketPrice entity
via the Base44 REST API (replaces the PostgreSQL mandi_price_arrivals table).

Data source (verified live, government-run):
  Resource: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
  Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
  API base: https://api.data.gov.in/resource/{resource_id}
  Fields: state, district, market, commodity, variety, grade, arrival_date,
          min_price, max_price, modal_price   (prices in Rs per quintal)

Get your free API key at https://data.gov.in → register → My Account → API keys.

Usage:
    python fetch_agmarknet_b44.py                          # all major MH crops, latest day
    python fetch_agmarknet_b44.py --commodity Onion --commodity Tomato
    python fetch_agmarknet_b44.py --days-back 7           # last 7 days
"""
import os
import argparse
import datetime as dt
import requests
from dotenv import load_dotenv

from base44_client import bulk_create_if_not_exists

load_dotenv()

DATA_GOV_API_KEY = os.getenv("DATA_GOV_IN_API_KEY", "")
RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
API_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

# Major Maharashtra crops to pull by default (matches the Crop entities seeded in the app).
DEFAULT_COMMODITIES = [
    "Rice", "Soybean", "Cotton", "Tur", "Jowar", "Bajra", "Maize",
    "Wheat", "Gram", "Safflower", "Sugarcane", "Onion", "Tomato",
]

# AGMARKNET commodity spellings that differ from the app's crop_id.
ALIASES = {
    "soyabean": "Soybean",
    "paddy": "Rice",
    "paddy(dhan)(common)": "Rice",
    "arhar (tur/red gram)(whole)": "Tur",
    "tur (arhar)": "Tur",
    "bengal gram(gram)(whole)": "Gram",
    "jowar(sorghum)": "Jowar",
    "bajra(pearl millet)": "Bajra",
}

def normalize_crop_id(commodity):
    key = commodity.strip().lower()
    return ALIASES.get(key, commodity).strip().lower().replace(" ", "_")

def fetch_page(commodity, date_filter, offset=0, limit=500):
    params = {
        "api-key": DATA_GOV_API_KEY,
        "format": "json",
        "limit": limit,
        "offset": offset,
        "filters[state]": "Maharashtra",
        "filters[commodity]": commodity,
    }
    if date_filter:
        params["filters[arrival_date]"] = date_filter
    resp = requests.get(API_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()

def to_market_price(row):
    """Map one AGMARKNET API row → MarketPrice entity record."""
    commodity = row.get("commodity", "").strip()
    crop_id = normalize_crop_id(commodity)
    arrival = row.get("arrival_date", "")
    # AGMARKNET dates are DD/MM/YYYY; convert to YYYY-MM-DD
    try:
        trading_date = dt.datetime.strptime(arrival, "%d/%m/%Y").date().isoformat()
    except (ValueError, TypeError):
        trading_date = arrival  # leave as-is if unparseable

    def num(v):
        try:
            return float(v) if v else None
        except (ValueError, TypeError):
            return None

    return {
        "market_name": row.get("market", "").strip(),
        "state": "Maharashtra",
        "district": row.get("district", "").strip() or None,
        "commodity": commodity,
        "crop_id": crop_id,
        "variety": row.get("variety", "").strip() or None,
        "grade": row.get("grade", "").strip() or None,
        "min_price": num(row.get("min_price")),
        "max_price": num(row.get("max_price")),
        "modal_price": num(row.get("modal_price")),
        "price_unit": "quintal",
        "arrival_quantity": num(row.get("arrivals")),
        "arrival_unit": row.get("unit", "").strip() or None,
        "trading_date": trading_date,
        "source": "AGMARKNET (data.gov.in)",
        "source_url": "https://www.data.gov.in/resource/variety-wise-daily-market-prices-data-commodity",
        "verification_status": "verified",
        "retrieved_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }

def run(commodities=None, days_back=0):
    if not DATA_GOV_API_KEY:
        raise RuntimeError("Set DATA_GOV_IN_API_KEY in .env (get one free at https://data.gov.in)")

    commodities = commodities or DEFAULT_COMMODITIES
    date_filter = None
    if days_back > 0:
        dates = [(dt.date.today() - dt.timedelta(days=i)).strftime("%d/%m/%Y") for i in range(days_back)]
        # data.gov.in filters take a single value; we'll loop per-date instead
        date_filter = None  # handled below

    total_created = 0
    total_skipped = 0
    all_errors = []

    for commodity in commodities:
        dates_to_fetch = [None]
        if days_back > 0:
            dates_to_fetch = [(dt.date.today() - dt.timedelta(days=i)).strftime("%d/%m/%Y") for i in range(days_back)]

        for d in dates_to_fetch:
            offset = 0
            while True:
                page = fetch_page(commodity, d, offset=offset)
                records = page if isinstance(page, list) else []
                if not records:
                    break
                mapped = [to_market_price(r) for r in records]
                result = bulk_create_if_not_exists(
                    "MarketPrice", mapped,
                    dedup_fields=["trading_date", "market_name", "commodity", "variety"],
                )
                total_created += result["created"]
                total_skipped += result["skipped"]
                all_errors.extend(result["errors"])
                print(f"  {commodity} ({d or 'latest'}): +{result['created']} new, {result['skipped']} existing")
                if len(records) < 500:
                    break
                offset += 500

    print(f"\nDone. Created {total_created}, skipped {total_skipped}.")
    if all_errors:
        print(f"Errors ({len(all_errors)}): {all_errors[:3]}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--commodity", action="append", help="Commodity name (repeatable)")
    ap.add_argument("--days-back", type=int, default=0, help="Number of past days to fetch (0 = latest only)")
    args = ap.parse_args()
    run(commodities=args.commodity, days_back=args.days_back)