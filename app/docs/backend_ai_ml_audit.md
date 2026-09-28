# TerraMind-X — Backend / AI / ML Audit
**Date:** 2026-09-26  
**Auditor:** Kiro (automated inspection — no code modified)

---

## 1. REPOSITORY OVERVIEW

| Layer | Location | Status |
|---|---|---|
| Frontend (React + Vite) | `src/` | **EXISTS — substantial, well-structured** |
| Base44 Entity schema | `base44/entities/` | **EXISTS — 25 entity files** |
| Backend (Python / FastAPI) | `backend/` | **EMPTY — directory scaffolding only** |
| Data files | `data/` | **EMPTY — `data/metadata/` is empty** |
| Scripts | `backend/scripts/` | **EMPTY** |
| Tests | `backend/tests/` | **EMPTY** |
| Model files | `backend/models/` | **EMPTY** |

**Critical finding:** The backend directory tree (`agents/`, `api/`, `decision/`, `llm/`, `ml/`, `schemas/`, `services/`, `utils/`) exists as empty folders. No Python code exists anywhere in this repository.

---

## 2. FRONTEND AUDIT

### 2.1 Framework & Technology
- React 18, Vite 8, Tailwind CSS 3, shadcn/ui (Radix-based)
- React Router v6
- React Query (TanStack)
- Recharts for charts
- react-leaflet for maps
- Base44 SDK (entity store + auth)

### 2.2 Routes / Pages
| Page | File | Purpose |
|---|---|---|
| Landing | `src/pages/Landing.jsx` | App landing |
| Login / Register | `src/pages/Login.jsx`, `Register.jsx` | Auth |
| Home | `src/pages/Home.jsx` | Home after auth |
| Market Price Board | `src/pages/MarketPriceBoard.jsx` | Market intelligence |
| Crop Recommendation | `src/pages/CropRecommendation.jsx` | Crop advice |
| Sell Advisor | `src/pages/SellAdvisor.jsx` | When/where to sell |
| Where To Sell | `src/pages/WhereToSell.jsx` | Market finder |
| Find Buyers | `src/pages/FindBuyers.jsx` | Buyer directory |
| My Land | `src/pages/MyLand.jsx` | Farm management |
| Sales Tracker | `src/pages/SalesTracker.jsx` | Transaction tracking |
| Crowding Risk | `src/pages/CrowdingRisk.jsx` | Supply pressure |
| Weather Calendar | `src/pages/WeatherCalendar.jsx` | Weather view |
| Gov Schemes | `src/pages/GovSchemes.jsx` | MSP / policy |
| Voice Assistant | `src/pages/VoiceAssistant.jsx` | Voice AI |
| My Alerts | `src/pages/MyAlerts.jsx` | Price alerts |
| Profile | `src/pages/Profile.jsx` | User profile |

### 2.3 Terra Screens (TerraMindShell)
The main app uses a SPA shell (`TerraMindShell.jsx`) with `onNav` routing between screens:

`Dashboard`, `Market` (+ `Simulator`), `AIRecommendation`, `AICouncil`, `SoilGuardian`, `Agronomy`, `Weather`, `MyFields`, `VoiceAI`, `Notifications`, `Profile`, `SetupWizard`, `PlanResults`, `Buyers`, `SyncStatus`, `PriceAlerts`, `Volatility`, `CropSuitability`, `MarketRisk`, `Sustainability`, `SoilHealth`, `SupplyDemand`, `FestivalIntelligence`, `FestivalPlanner`, `BalanceAllocation`, `BuyerDemandBoard`, `VillageAggregation`, `FpoPooling`, `MyLots`, `MyTransactions`, `Agronomy`, `RecordSoilHealth`, `RecordSowing`, `HarvestReminders`, `HistoricalReplay`, `PerformanceReport`, `MspChecker`, `SendOffer`

### 2.4 Frontend API Contracts
The frontend reads EXCLUSIVELY from the **Base44 entity store** via `db.entities.*`. There is NO direct HTTP call to a custom FastAPI backend anywhere in the frontend. All data access goes through:

```js
db.entities.MarketPrice.filter(...)
db.entities.MarketArrival.list(...)
db.entities.SoilData.filter(...)
db.entities.CultivationRecord.filter(...)
db.entities.WeatherData.filter(...)
db.entities.Location.list(...)
db.entities.Buyer.list(...)
db.entities.BuyerDemand.filter(...)
db.entities.FestivalCalendar.filter(...)
db.entities.GovernmentPolicy.filter(...)
db.entities.Lot.filter(...)
db.entities.Offer.list(...)
db.entities.Transaction.filter(...)
db.entities.StorageAvailability.filter(...)
db.entities.TransportationCost.filter(...)
db.entities.DataSource.list(...)
db.entities.RawDataRecord.list(...)
db.entities.BacktestRun.filter(...)
db.entities.Crop.list(...)
db.entities.LandCropPlan.create(...)
db.entities.Forecast.create(...)
```

Also uses Open-Meteo (keyless, CORS-open) for weather: `buildForecastUrl(lat, lng, days)` → direct `fetch()`.

### 2.5 Four Agent Implementations (Frontend-Resident)
All four agents are already implemented entirely in JavaScript inside `src/lib/`:

| Agent | File | Status | Data Sources Used |
|---|---|---|---|
| Crop Suitability Agent | `cropSuitability.js` | **COMPLETE, real-data-only** | Location, WeatherData (Open-Meteo direct), SoilData; CROP_REF reference knowledge |
| Market Risk Agent | `marketRisk.js` | **COMPLETE, real-data-only** | MarketPrice, MarketArrival, BuyerDemand, CultivationRecord, WeatherData |
| Soil Health Agent | `soilHealth.js` | **COMPLETE, real-data-only** | SoilData; ICAR reference ranges |
| Sustainability Agent | `sustainability.js` | **COMPLETE, real-data-only** | WeatherData, SoilData, CultivationRecord |

All four agents:
- Return `DATA_UNAVAILABLE` properly
- Show evidence, source, timestamp, verification status per component
- Never fabricate missing values
- Are already wired to frontend screens

### 2.6 ML in Frontend
`src/lib/forecast.js` implements:
- `buildSeries(prices)` — deduplicates time-series from real MarketPrice records
- `baselineForecast(series, horizons)` — 7-day MA + linear drift, 95% bounds
- `evaluateForecast(series)` — chronological train/test split, MAE/RMSE/MAPE

This is a pure JavaScript baseline model running in-browser.  
No Python ML exists anywhere.

### 2.7 Other Key Frontend Libs

| File | Purpose | Status |
|---|---|---|
| `realData.js` | All entity reads — real-only, `isReal()` filter | Complete |
| `marketIngest.js` | AGMARKNET/data.gov.in ingestion — server-side only | Complete logic, needs backend |
| `supplyDemand.js` | SDBI engine (Supply-Demand Balance Index) | Complete |
| `festivalDemand.js` | Festival × harvest overlap analysis | Complete (demo profiles clearly labelled) |
| `priceAlerts.js` | Price swing detection | Complete |
| `dataSourceStatus.js` | DataSource status updater | Complete |
| `council.js` | AI council orchestration | Exists |
| `agronomy.js` | Crop calendar reference | Exists |
| `balanceAllocation.js` | FPO lot matching | Exists |
| `weatherOpenMeteo.js` | Open-Meteo URL builder | Complete |
| `i18n.jsx` | Language context (EN/TA/MR/HI) | Exists |

---

## 3. BASE44 ENTITY SCHEMA AUDIT

### 3.1 Valid Entity Files (properly structured JSON)

| Entity | Key Fields | Provenance Fields | Status |
|---|---|---|---|
| `MarketPrice` | market_name, commodity, min/max/modal_price, trading_date | source, source_url, verification_status, fetched_at | **VALID** |
| `MarketArrival` | market_name, crop_id, arrival_quantity, date | source, source_url, fetched_at | **VALID** |
| `SoilData` | location_id, ph, N/P/K, organic_carbon, soil_type | source, verification_status, source_type | **VALID** |
| `CultivationRecord` | location_id, crop_id, cultivated_area, admin_level | source, source_url, verification_status | **VALID** |
| `Location` | state, district, taluk, village, lat/lng | source, verification_status | **VALID** |
| `Buyer` | buyer_name, buyer_type, crops_supported | verification_source, verification_status | **VALID** |
| `BuyerDemand` | buyer_id, crop_id, required_quantity, expected_price | source, verification_status | **VALID** |
| `FestivalCalendar` | festival_name, state, start_date, associated_crops | source, verification_status | **VALID** |
| `GovernmentPolicy` | policy_name, crop, policy_type, price | source, verification_status | **VALID** |
| `Forecast` | commodity, predicted_price, lower/upper_bound, model_name | model_version, training_period, mae, rmse, mape | **VALID** |
| `Lot` | crop_id, quantity, quality_grade, harvest_date | source, verification_status | **VALID** |
| `DataSource` | source_name, base_url, status | last_successful_fetch, error_message | **VALID** |
| `BacktestRun` | crop_id, district, predicted_action, correct | run_at, actual_pct_change | **VALID** |

### 3.2 CORRUPT Entity Files

These entity files contain the full "KrishiBalance AI" product brief text instead of JSON:

| File | Actual Content | Fix Required |
|---|---|---|
| `base44/entities/WeatherData.jsonc` | KrishiBalance AI product brief (~6000 words) | **MUST RESTORE** |
| `src/data/mockData.js` | KrishiBalance AI product brief (~6000 words) | **MUST RESTORE** (file is imported by Dashboard.jsx) |

---

## 4. EXISTING ML AUDIT

### 4.1 JavaScript (Frontend) Models

| Model | File | Type | Data | Trained? | Real Data? | Safe for Demo? |
|---|---|---|---|---|---|---|
| Baseline price forecast | `src/lib/forecast.js` | 7-day MA + linear drift | MarketPrice entity | No training — pure algorithm | Yes (if real prices exist) | Yes — transparent |
| Forecast evaluation | `src/lib/forecast.js` | Chronological train/test split | MarketPrice entity | In-browser, per request | Yes | Yes |

### 4.2 Python ML

**None exists.** Backend is empty.

---

## 5. EXISTING DATA AUDIT

### 5.1 `data/` Directory
The `data/` directory contains only an empty `data/metadata/` folder. **No CSV, JSON, or any data files exist.**

### 5.2 Entity Data (Runtime, not files)
Data is stored in the Base44 in-memory entity store at runtime. No persistent database is connected. Entity data is wiped on restart (`base44 dev`).

### 5.3 Data Classification

| Dataset | Status | Notes |
|---|---|---|
| MarketPrice records | **EMPTY** (no ingestion run) | AGMARKNET ingestion code exists in `marketIngest.js` but requires `DATA_GOV_IN_API_KEY` |
| MarketArrival records | **EMPTY** | |
| SoilData records | **EMPTY** | Farmer must upload Soil Health Card |
| CultivationRecord | **EMPTY** | |
| Location records | **EMPTY** | Must be seeded or created by user |
| Buyer records | **EMPTY** | |
| BuyerDemand records | **EMPTY** | |
| FestivalCalendar | **EMPTY** | Festival profiles exist as JS constants (labelled DEMO) |
| GovernmentPolicy / MSP | **EMPTY** | |
| WeatherData | **EMPTY** + entity file corrupt | Open-Meteo is fetched directly (no storage) |

---

## 6. EXISTING BACKEND AUDIT

### 6.1 Python Backend
**None.** The `backend/` directory tree exists (agents/, api/, decision/, llm/, ml/, schemas/, services/, utils/) but all directories are completely empty — zero Python files.

### 6.2 Environment Variables
No `.env` or `.env.local` found. No `requirements.txt` found.

### 6.3 Existing API Endpoints
None. The frontend uses Base44's entity SDK, not a custom HTTP API.

---

## 7. WHAT ALREADY WORKS

| Component | Works? | Notes |
|---|---|---|
| React frontend shell | ✅ | Full TerraMindShell with navigation |
| 4 agent implementations | ✅ | In JavaScript in `src/lib/` |
| Market data ingestion logic | ✅ | `marketIngest.js` — needs API key + backend trigger |
| Open-Meteo weather (live) | ✅ | Direct fetch in `cropSuitability.js` |
| Baseline price forecast | ✅ | In `forecast.js` — runs in browser |
| SDBI engine | ✅ | `supplyDemand.js` |
| Festival demand analysis | ✅ | `festivalDemand.js` |
| Provenance / real-data enforcement | ✅ | `isReal()` in `realData.js` |
| Data freshness labels | ✅ | Freshness state in UI |
| Multilingual i18n | ✅ | `i18n.jsx` |
| Entity schema (most) | ✅ | 23 of 25 entity files valid |

---

## 8. WHAT IS MISSING / BROKEN

| Item | Status | Priority |
|---|---|---|
| `WeatherData.jsonc` entity file | **CORRUPT** — contains KrishiBalance brief | P0 — fix immediately |
| `src/data/mockData.js` | **CORRUPT** — contains KrishiBalance brief | P1 — fix or empty safely |
| Python FastAPI backend | **MISSING** — zero files | P0 |
| Market data (AGMARKNET records) | **EMPTY** — no ingestion run | P0 |
| Location seed data | **EMPTY** — no records | P0 |
| Crop reference seed | **EMPTY** — no Crop entity records | P0 |
| Festival calendar seed | **EMPTY** | P1 |
| MSP/Government policy seed | **EMPTY** | P1 |
| `requirements.txt` | **MISSING** | P0 |
| `.env.example` | **MISSING** | P0 |
| Any Python ML model | **MISSING** | P1 |
| Any test file | **MISSING** | P1 |
| Model registry | **MISSING** | P1 |
| LLM explanation layer | **MISSING** | P1 |
| `data_provenance.json` | **MISSING** | P1 |

---

## 9. OLD 5-AGENT / DUPLICATE CODE

No old 5-agent code found. The existing JS agents are correctly structured as exactly 4. No duplicate or conflicting agent implementations exist.

---

## 10. FRONTEND → BACKEND INTEGRATION STRATEGY

The frontend does **NOT** call a custom FastAPI backend. It reads from the Base44 entity store. The correct integration strategy is:

1. Build a **Python FastAPI backend** that ingests real data (AGMARKNET, Open-Meteo storage, government data) and writes into the Base44 entity store via the Base44 SDK.
2. Alternatively, build a thin **API adapter** that the frontend calls directly (requires updating `src/lib/realData.js` to call FastAPI endpoints instead of `db.entities.*`).

**Recommended approach:** Implement the FastAPI backend with data ingestion + ML + agents, then expose REST endpoints. Update `src/lib/realData.js` to call FastAPI when available, falling back to `db.entities.*` when not.

---

## 11. PHASED IMPLEMENTATION PLAN

| Phase | Action |
|---|---|
| PHASE 1 (this document) | Audit complete |
| PHASE 2 | Fix corrupt files + FastAPI skeleton + requirements.txt + .env.example |
| PHASE 3 | Data ingestion (AGMARKNET, Open-Meteo, crop reference seed) |
| PHASE 4 | PostgreSQL schema + Alembic migrations + data provenance |
| PHASE 5 | ML pipeline (baseline forecast + crop suitability rule engine) |
| PHASE 6 | Python 4-agent implementations (mirroring existing JS logic) |
| PHASE 7 | Decision engine orchestrator |
| PHASE 8 | LLM explanation layer (Groq/Gemini) |
| PHASE 9 | FastAPI endpoints + OpenAPI docs |
| PHASE 10 | Frontend integration + tests |

---

## 12. KNOWN CRITICAL ISSUES TO FIX BEFORE IMPLEMENTATION

1. **Restore `base44/entities/WeatherData.jsonc`** — currently corrupt, frontend `WeatherData` entity will not function correctly.
2. **Fix `src/data/mockData.js`** — currently a product brief; Dashboard imports it (will fail/be ignored).
3. **Create `requirements.txt`** for Python backend.
4. **Create `.env.example`** with all required keys.
5. **Seed Location + Crop entities** before any agent can run (agents return `no_location` without them).
