# AGMARKNET & data.gov.in Multi-State Market Intelligence Integration

## 1. Executive Summary & Overview
TerraMind-X integrates official **Government of India AGMARKNET agricultural market data (via data.gov.in)** to provide smallholder farmers with verified mandi spot prices, price trend analytics, multi-mandi spread comparisons, and multilingual strategic advisories in **Tamil, English, Thanglish, and Marathi**.

---

## 2. API Credentials & Environment Variables
The integration requires the Government Open Data (OGD) data.gov.in API key:

```env
# Backend .env configuration (Never committed to GitHub or exposed to frontend)
DATA_GOV_API_KEY=579b464db66ec23bdd000001xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATA_GOV_MARKET_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070
MARKET_CACHE_TTL_MINUTES=60
```

### Security Guarantees:
- `DATA_GOV_API_KEY` is loaded strictly on the FastAPI backend via `app/core/config.py`.
- Vite, React, browser JavaScript, and mobile clients never receive the API key.
- Endpoints and logs sanitize all API tokens.

---

## 3. Backend Architecture & Data Flow

```text
Farmer / Frontend UI
        ↓
FastAPI Backend (/api/v1/market/*)
        ↓
Market Service (app/services/market_service.py)
        ↓
data.gov.in AGMARKNET REST API
        ↓
Validation & Normalization (app/services/data_normalizer.py)
        ↓
PostgreSQL / Database Storage (MarketPriceRecord)
        ↓
Price Analytics Engine (7d/30d % changes, spreads)
        ↓
Market Intelligence Agent
        ↓
Multilingual Advisory (Tamil / English / Thanglish / Marathi)
```

---

## 4. API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/market/states` | `GET` | Returns list of supported Indian states. |
| `/api/v1/market/districts?state=Tamil Nadu` | `GET` | Returns districts for the selected state dynamically. |
| `/api/v1/market/markets?state=Tamil Nadu&district=Madurai` | `GET` | Returns APMC mandis & regulated markets in district. |
| `/api/v1/market/commodities` | `GET` | Returns tradable commodities (Tomato, Onion, Soybean, etc.). |
| `/api/v1/market/prices` | `GET` | Live & cached AGMARKNET spot prices with zero fabrication. |
| `/api/v1/market/compare` | `GET` | Multi-mandi price spread and deviation from average. |
| `/api/v1/market/analytics` | `GET` | 7-day and 30-day percentage changes and trend direction. |
| `/api/v1/market/advisor-query` | `POST` | Converts query into verified fact + AI interpretation advisory. |

---

## 5. PostgreSQL Database Schema (`market_prices`)

```sql
CREATE TABLE market_prices (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    market VARCHAR(100) NOT NULL,
    commodity VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    grade VARCHAR(50),
    min_price FLOAT NOT NULL,
    max_price FLOAT NOT NULL,
    modal_price FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT '₹/quintal',
    arrival_quantity FLOAT,
    source VARCHAR(100) DEFAULT 'AGMARKNET / data.gov.in',
    source_record_id VARCHAR(100),
    source_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_market_price_record UNIQUE (state, district, market, commodity, variety, date)
);
```

---

## 6. Multi-State Extensibility

The architecture supports dynamic geographical expansion across India without modifying the core Market Service:
- **Tamil Nadu:** Madurai, Dindigul, Theni, Coimbatore, Tiruppur, Erode, Salem, Tiruchirappalli.
- **Maharashtra:** Nashik, Pune, Akola, Nagpur, Amravati, Ahmednagar, Chhatrapati Sambhajinagar.
- **Karnataka, Gujarat, Andhra Pradesh, Telangana, Madhya Pradesh, Punjab, Rajasthan, etc.**

---

## 7. How to Test

```bash
# Run pytest market test suite
pytest tests/test_market_service.py tests/test_market_api.py tests/test_market_cache.py tests/test_market_agent.py tests/test_market_multistate.py -v
```
