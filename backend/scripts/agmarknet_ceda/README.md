# TerraMind-X — MH + TN 2007–2026 market ingestion

## 1. What this loads

The importer targets:

- Maharashtra — CEDA Census/2011 state ID `27`
- Tamil Nadu — CEDA Census/2011 state ID `33`
- `2007-01-01` through `2026-12-31`
- daily mandi-level price data
- daily arrival quantity data

The CEDA AgMarkNet web API exposes both `/prices` and `/quantities`. Verify actual coverage for each commodity and market before claiming complete 20-year coverage.

## 2. Exact endpoints

```text
GET  https://agmarknet.ceda.ashoka.edu.in/api/states
GET  https://agmarknet.ceda.ashoka.edu.in/api/commodities
GET  https://agmarknet.ceda.ashoka.edu.in/api/districts?state_id=27
GET  https://agmarknet.ceda.ashoka.edu.in/api/districts?state_id=33

POST https://agmarknet.ceda.ashoka.edu.in/api/prices
POST https://agmarknet.ceda.ashoka.edu.in/api/quantities
```

Example price request body:

```json
{
  "state_id": 27,
  "commodity_id": 78,
  "district_id": 0,
  "calculation_type": "d",
  "chart_type": "datadownload",
  "start_date": "2020-01-01T00:00:00Z",
  "end_date": "2020-01-31T23:59:59Z"
}
```

Example arrival request body is identical except the endpoint is `/quantities`.

The requests use daily price/arrival retrieval with date ranges and `chart_type="datadownload"`.

## 3. Official OGD price fallback

```text
https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24
```

Typical request:

```text
GET https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24
    ?api-key=YOUR_KEY
    &format=json
    &limit=1000
    &filters[State]=Maharashtra
    &filters[Commodity]=Tomato
```

This resource is the Government of India's daily mandi dataset sourced from AGMARKNET. Availability and update cadence can change.

## 4. Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 5. Create `.env`

Copy `.env.example` to `.env` and set:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/terramind_ceda
```

## 6. Create database schema

Use a dedicated `terramind_ceda` database. Do not use the TerraMind-X application
database: this package's `market_prices` and `market_arrivals` tables have a
different schema from the application's tables.

```bash
createdb -U postgres terramind_ceda
psql -U postgres -d terramind_ceda -f schema.sql
```

Do not execute this schema in the application's Supabase database.

## 7. Run

```bash
python ingest_agmarknet.py
```

The job is intentionally month-chunked:

```text
Maharashtra
  commodity 1
    Jan 2007
    Feb 2007
    ...
  commodity 2
    ...

Tamil Nadu
  commodity 1
    Jan 2007
    ...
```

## 8. Resume

You can stop the process with Ctrl+C.

Run the same command again:

```bash
python ingest_agmarknet.py
```

Rows with:

```text
price_status = done
arrival_status = done
```

are skipped.

Failed months remain in `ingestion_checkpoints` and are retried on the next run.

## 9. Check progress

```sql
SELECT
    state_id,
    count(*) AS months,
    count(*) FILTER (
        WHERE price_status='done' AND arrival_status='done'
    ) AS completed,
    count(*) FILTER (
        WHERE price_status='failed' OR arrival_status='failed'
    ) AS failed
FROM ingestion_checkpoints
GROUP BY state_id
ORDER BY state_id;
```

## 10. Check actual coverage

Do not assume every commodity has 2007–2026 coverage.

```sql
SELECT
    state_name,
    commodity_name,
    MIN(observed_date) AS first_date,
    MAX(observed_date) AS last_date,
    COUNT(*) AS observations
FROM market_prices
GROUP BY state_name, commodity_name
ORDER BY state_name, commodity_name;
```

For arrivals:

```sql
SELECT
    state_name,
    commodity_name,
    MIN(observed_date) AS first_date,
    MAX(observed_date) AS last_date,
    COUNT(*) AS observations
FROM market_arrivals
GROUP BY state_name, commodity_name
ORDER BY state_name, commodity_name;
```

## 11. Market features for TerraMind-X

After ingestion, derive:

- daily modal price
- weekly/monthly price
- min/max spread
- price volatility
- arrival volume
- arrival growth
- rolling 7/30/90-day averages
- year-over-year price
- year-over-year arrivals
- seasonal indices
- mandi price differentials
- festival-window price behavior
- crop-area vs price relationship

Feed those to the Market Intelligence Agent and Crop Competition Diffusion Model.

## 12. Important data integrity rule

Never fill a missing upstream observation with a fabricated price or arrival.

Mark it as unavailable.

For model training, interpolation/imputation should be a separate, versioned feature-engineering step, never mixed into the raw source tables.
