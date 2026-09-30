# TerraMind-X Data Pipeline → Base44

Pulls real data from verified government/open sources and loads it **directly into
the app's Base44 entity store** via the REST API. No PostgreSQL needed — the app's
screens (Market, Weather, Soil, Festival Planner) read from these entities.

| Source | Script | Base44 Entity | Status |
|---|---|---|---|
| AGMARKNET (data.gov.in) | `fetch_agmarknet_b44.py` | `MarketPrice` | ✅ working, needs free API key |
| Open-Meteo | `fetch_weather_b44.py` | `WeatherData` | ✅ working, no key needed |
| ISRIC SoilGrids | `fetch_soil_b44.py` | `SoilData` | ⚠️ REST API paused — script ready for when it's back |
| Festivals | (already seeded in-app) | `FestivalCalendar` | ✅ 11 festivals seeded |
| Crops & seasons | (already seeded in-app) | `Crop`, `CropCalendar` | ✅ 17 crops + 8 calendars seeded |

## 1. Setup

```bash
cd src/data_pipeline
python -m venv venv && source venv/bin/activate
pip install requests python-dotenv
cp .env.example .env
```

Edit `.env`:
- **`BASE44_APP_ID`** — Dashboard → API → "App ID" (top of page).
- **`BASE44_API_TOKEN`** — Dashboard → click your profile (top-right) → Personal Access Tokens → New token. Must be a personal token (workspace/read-only keys are rejected).
- **`DATA_GOV_IN_API_KEY`** — Get one free at https://data.gov.in → register → My Account → API keys. The key is rate-limited; if you hit 429s, slow down `--days-back` or wait an hour.
- Open-Meteo needs no key.

## 2. Run

```bash
# Latest mandi prices for all major MH crops + 16-day weather forecast
python run_all_b44.py

# Last 7 days of mandi prices + forecast
python run_all_b44.py --days-back 7

# Specific crops only
python fetch_agmarknet_b44.py --commodity Onion --commodity Tomato

# Historical weather for backtesting
python fetch_weather_b44.py --mode history --start 2025-01-01 --end 2025-09-01

# Soil data for one farm (once ISRIC's API is back)
python fetch_soil_b44.py --farm-id F001 --lat 19.99 --lon 73.79 --zone "Nashik Plot 1"
```

## 3. How it maps to your PostgreSQL schema

Your original `schema.sql` created PostgreSQL tables. This pipeline writes to the
equivalent Base44 entities instead — the app already reads from these:

| PostgreSQL table | Base44 entity | Notes |
|---|---|---|
| `mandi_price_arrivals` | `MarketPrice` | AGMARKNET prices/arrivals |
| `weather_forecasts` | `WeatherData` | Open-Meteo forecast + historical |
| `soil_observations` | `SoilData` | SoilGrids (or manual entry via app) |
| `festivals` | `FestivalCalendar` | Already seeded (11 MH festivals) |
| `crops` | `Crop` | Already seeded (17 crops) |
| `agricultural_seasons` | `CropCalendar` | Already seeded (8 season calendars) |
| `government_policies` | `GovernmentPolicy` | Add via app or API as needed |
| `crop_market_forecasts` | `Forecast` | Computed in-app by the market engine |

## 4. Dedup / idempotency

Every script checks for existing records before creating (via GET with a filter
query), so it's safe to re-run daily via cron without creating duplicates.

## 5. Practical notes

- `api.data.gov.in` free tier has an hourly ceiling — if you hit 429s, reduce
  `--days-back` or wait an hour.
- Open-Meteo has no key and a generous free tier; cache daily rather than
  re-fetching per user request in production.
- SoilGrids' REST API is paused (Sep 2026). Meanwhile, enter soil-test data
  manually via the app's **Add Soil Health Card** form, or download GeoTIFF
  tiles from soilgrids.org and extract values locally.
- `heatwave_risk` / `drought_risk` / `flood_risk` from your original
  `fetch_weather.py` were heuristic formulas, not a calibrated model — don't
  present them to judges as validated. The app computes weather alerts from
  real IMD-aligned thresholds instead.

## Optional CEDA Historical Backfill

For long-range AGMARKNET history, the separate CEDA importer lives in
`backend/scripts/agmarknet_ceda/`. It downloads monthly checkpoints for
Maharashtra and Tamil Nadu, and can resume after interruption. This is optional;
the app's normal data pipeline remains the Base44 entity pipeline described
above.

The CEDA package has its own PostgreSQL schema. Use a dedicated database from
that package's `.env.example`; do not run its `schema.sql` against the TerraMind
application database, whose `market_prices` and `market_arrivals` tables have a
different structure.

From the package directory, install dependencies, copy `.env.example` to `.env`,
apply `schema.sql`, then run `python ingest_agmarknet.py`. See the package
README for full setup and coverage queries.