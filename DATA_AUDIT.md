# TerraMind-X Data Audit

**Phase:** 1 - Data Audit  
**Audit date:** 2026-09-11  
**Scope:** Existing files in `Backend/`, `Frontend/src/`, project configuration, and generated frontend output.  
**Status:** Documentation-only audit. No data or runtime code was modified in this phase.

## Executive Summary

The repository contains a FastAPI backend and a React/Vite frontend. It does **not** currently contain a database, migrations, ORM models, ingestion jobs, scrapers, external data connectors, CSV/JSON source datasets, ML training data, trained model artifacts, or satellite/weather/market data files.

The current data path is:

```text
Frontend fixture data / user input
        |
        v
React context and API client
        |
        v
FastAPI hardcoded responses and deterministic decision calculations
        |
        v
Frontend screens
```

The existing market, climate, soil, cultivation, buyer, and agent values are either hardcoded in source files or generated from hardcoded constants. They must not be treated as production data until a source registry, ingestion pipeline, validation, database, and provenance layer are implemented.

## Project Data Surface

| Data source | Data type | Format | Geography | Time period | Freshness | Current usage | Missing fields | Quality | Real / Mock |
|---|---|---|---|---|---|---|---|---|---|
| `Backend/main.py` `Soil`, `FarmInput` | Farmer soil/farm input contract | Pydantic models / JSON API | User-supplied; defaults are Tamil Nadu-oriented | Current request; defaults have no observation date | Request-time only | Land analysis and deterministic recommendation scoring | Measurement source, sample date, units, lab/sensor identity, coordinates, provenance | Schema validation only; no source validation | Mixed: user input supported, defaults/demo values |
| `Backend/main.py` `RECOMMENDATION` | Crop recommendation, price, yield, profit, sowing window | Python dictionary | Unspecified; values reference Tamil Nadu/Madurai/Thoothukudi context | Mostly 2025/2026-style fixture values; no period metadata | Static until code change | Legacy recommendation endpoint and dashboard fallback | Source, timestamp, market, variety metadata, uncertainty, model version, validation metrics | Not independently validated | Mock/demo |
| `Backend/main.py` `build_decision()` | Derived soil suitability and competition scores | Deterministic Python calculation | Input district, with hardcoded district branches | Current request; no historical source period | Request-time calculation | `/api/v1/decision`, recommendation, council | Actual cultivation/arrival series, trained model, feature version, reproducible source datasets | Explainable formula, but inputs are not sourced | Derived from input plus hardcoded constants |
| `Backend/main.py` `AGENTS` | Five agent findings and scores | Python dictionary | Unspecified; findings mention turmeric and regional conditions | No agent observation period | Static until code change | Council endpoint and frontend council views | Agent input contracts, evidence references, model/version metadata, conflict checks | No automated evidence validation | Mock/demo |
| `Backend/main.py` `market_payload()` | Market price, trend, supply pressure, price history | Python dictionary / JSON API | Requested location string; default Thoothukudi | Month labels only; no year or observation dates | Static | `/api/market/{crop}` and decision packet snapshot | Commodity variety, market ID, arrival quantity, min/max/modal price units, source, date, retrieval time, quality | No range/freshness/source validation | Mock/demo |
| `Backend/main.py` `selling_window()` | Selling window and expected price range | Python dictionary / JSON API | Default recommended market is Thoothukudi APMC | Window is calculated from server date; prices are fixed | Date changes at request time, price does not | Selling-window API client method | Price series, maturity date, arrivals, storage/transport costs, source, confidence, model metadata | No evidence or quality checks | Mock/demo |
| `Backend/main.py` `buyers()` | Buyer/FPO-like market linkage records | Python list / JSON API | District query plus Erode | No last-verified source date beyond generated decision linkage | Static; decision linkage uses request timestamp as `last_verified` | Buyers API and decision packet | Legal entity identity, contact, capacity units, commodity, address, verification authority, verification history | No verification service | Mock/demo; explicitly marked `UNVERIFIED` in decision linkage |
| `Backend/main.py` `weather()` | Temperature, rainfall, humidity, forecast placeholder, climate risk | Python dictionary / JSON API | Requested location string | No forecast dates or observation period | Static | Weather API | Provider, coordinates, forecast timestamp, data age, units, forecast entries, extreme events | No source/freshness checks | Mock/demo |
| `Backend/main.py` `soil()` | Soil health, degradation, organic carbon, actions | Python dictionary / JSON API | Farmer ID only | No observation date | Static | Soil API | pH, NPK, moisture, EC, sample/source type, lab/sensor metadata, units | No source or value validation beyond request models elsewhere | Mock/demo |
| `Backend/main.py` `sustainability()` | Sustainability score and long-term actions | Python dictionary / JSON API | Farmer ID only | No assessment period | Static | Sustainability API | Water use, crop history, climate/soil evidence, calculation version, source | No reproducible calculation inputs | Mock/demo |
| `Backend/main.py` `analytics()` | Historical performance and prediction accuracy | Python dictionary / JSON API | Farmer ID only | Empty history; accuracy is fixed | Static | Analytics API | Actual observations, evaluation split, model version, metrics, training period | Not a measured model evaluation | Mock/demo |
| `Frontend/src/data.ts` `farmData` | Farmer, farm, soil, season, weather alert | TypeScript object | Kovilpatti, Thoothukudi, Tamil Nadu | Kharif 2025-26 | Bundled at build time | Dashboard, profile, report, field screens | Source, timestamps, consent, canonical IDs, Maharashtra coverage | No runtime validation | Mock/demo |
| `Frontend/src/data.ts` `cropRecommendation` | Crop recommendation narrative and metrics | TypeScript object | Thoothukudi/Tamil Nadu context | 2025-2026 references | Bundled at build time | Screens and report/fallback content | Evidence records, source URLs, market series, model metadata, uncertainty | No validation | Mock/demo |
| `Frontend/src/data.ts` `agentCouncil` | Four static agent cards | TypeScript array | Local farm context | 2025/2026 references | Bundled at build time | Fallback council UI | Fifth guardian agent contract, evidence, version, timestamps | UI fixture only; shape differs from live backend in places | Mock/demo |
| `Frontend/src/data.ts` `marketData` | Price history, adoption, diffusion curves | TypeScript object | Tamil Nadu districts such as Thoothukudi, Tirunelveli, Madurai | 2022-2027 labels | Bundled at build time | Market charts, adoption and simulator tabs | Source, dates, units, arrivals, cultivated area, method, confidence | No source or quality metadata | Mock/demo |
| `Frontend/src/data.ts` `soilData` | Soil health, NPK, radar, actions | TypeScript object | Unspecified farm; narrative says Red Sandy Loam | Current/fixture | Bundled at build time | Soil Guardian and report | Observation source/date, units, lab/sensor identity, raw measurements | No validation | Mock/demo |
| `Frontend/src/data.ts` `weatherData` | Current weather, seven-day forecast, crop risks | TypeScript object | Unspecified; narrative references Tamil Nadu | Relative labels such as Today/Thu/Tue | Bundled at build time | Weather screen and dashboard | Coordinates, provider, forecast dates, retrieved time, actual values, quality | No validation | Mock/demo |
| `Frontend/src/data.ts` `sustainabilityData` | Water, fertilizer, carbon, biodiversity, trend | TypeScript object | Unspecified local farm | Rabi 2023 to Kharif 2025 labels | Bundled at build time | Sustainability screen | Measurement sources, methodology, units, land history, calculation version | No validation | Mock/demo |
| `Frontend/src/data.ts` `analyticsData` | Yield, profit, input cost histories | TypeScript object | Unspecified local farm | Kharif 2023 to Kharif 2025 | Bundled at build time | Analytics screen | Transaction/harvest records, source, currency/unit definitions, accounting period | No validation | Mock/demo |
| `Frontend/src/data.ts` `notifications` | Market, soil, weather, council alerts | TypeScript array | Thoothukudi references | Relative times and 2025 references | Bundled at build time | Notifications screen | Event source, event timestamp, severity rules, acknowledgement audit | No validation | Mock/demo |
| `Frontend/src/screens/Chatbot.tsx` scripted responses | Chat answers and source labels | TypeScript object | Tamil Nadu/Thoothukudi references | Jun/Dec/Oct 2025 and Mar 2026 references | Bundled at build time | Chatbot quick intents and fallback | Intent provenance, retrieved records, language model contract, freshness | Not connected to decision engine for scripted intents | Mock/demo |
| `Frontend/src/farmDefaults.ts` | Default farmer/farm/soil input | TypeScript object | Kovilpatti, Thoothukudi, Tamil Nadu | No date | Build/runtime default | Onboarding and context initialization | State field, source type, measurement dates, coordinates, provenance | Input defaults only | Mock/demo |
| `Frontend/src/screens/*` hardcoded values | UI labels, chart values, dates, task actions | TSX literals | Primarily Tamil Nadu context; some Maharashtra wording | Several 2025 and 2026 references | Bundled at build time | Dashboard, recommendation, market, agronomy, weather, report, soil, profile | API binding, source, freshness, locale/date strategy | Presentation-only; can contradict live API | Mock/demo |
| `Frontend/src/api.ts` API methods | API response contracts | TypeScript interfaces and fetch | Backend local API | Request-time for live calls | Request-time when backend is available | Context and screens | Runtime schema validation, request IDs, timeout, error body, provenance for every response | TypeScript compile-time only | Integration surface, not a dataset |
| `Frontend/dist/` | Generated compiled frontend assets | HTML/JS/CSS | Same as source | Build timestamp not data timestamp | Rebuilt artifact | Browser serving/deployment | Source map/data traceability at runtime | Generated output; not an authoritative source | Build artifact |
| `Frontend.zip` | Packaged project archive | ZIP | Unknown; appears to mirror project | Unknown | Unknown | Not referenced by runtime | Archive manifest, provenance, checksum | Not audited as runtime data | Packaged source artifact |

## Data Asset Inventory

### Present

- Pydantic request models for soil and farm input in `Backend/main.py`.
- API response dictionaries for recommendation, market, weather, soil, sustainability, analytics, buyers, and selling windows in `Backend/main.py`.
- Deterministic competition calculation in `Backend/main.py`.
- TypeScript fixture objects in `Frontend/src/data.ts`.
- Default farm input in `Frontend/src/farmDefaults.ts`.
- TypeScript API interfaces and fetch methods in `Frontend/src/api.ts`.
- React context state and offline fallback recommendation in `Frontend/src/TerraMindContext.tsx`.
- Generated `Frontend/dist/` build output.

### Absent

- CSV, Parquet, Excel, JSON, or other source data files.
- SQLite, PostgreSQL, MySQL, or other database files/configuration.
- SQL schema, migrations, ORM models, repositories, or database indexes.
- Market price or arrival ingestion connector.
- AGMARKNET/eNAM or other government API client.
- Maharashtra cultivation/production dataset.
- Weather forecast or historical climate connector.
- Soil laboratory, sensor, or government soil connector.
- Satellite/remote-sensing connector or NDVI/NDWI/EVI observations.
- Crop knowledge-base records outside frontend prose/constants.
- Data cleaning, normalization, duplicate detection, or rejection tables.
- Data quality scoring implementation based on source records.
- Data fusion or feature-store implementation.
- ML training, validation, test datasets, model artifacts, or experiment metadata.
- SIS/network adoption dataset or anonymized farmer recommendation feedback store.
- Scheduled jobs, retry queues, refresh logs, or ingestion monitoring.
- Provenance database or source registry.
- Automated unit, integration, or data-pipeline tests.

## API Data Inventory

| Endpoint | Data returned | Backing implementation | Provenance status |
|---|---|---|---|
| `GET /health` | Static service status | FastAPI route | No data source metadata |
| `POST /api/land/analyze` | Echoed validated farm input | Pydantic request model | User input has no persisted provenance |
| `POST /api/recommendation` | Recommendation object | `build_decision()` plus constants | Evidence fields exist in `/api/v1/decision`, but market/climate inputs remain demo/baseline |
| `POST /api/council/analyze` | Five-agent result | Static agent records plus derived score | No agent-level source lineage |
| `POST /api/v1/decision` | Decision packet with evidence, competition, market linkage, validation | `build_decision()` | Explicitly labels market snapshot as `DEMO_DATA_REQUIRES_REFRESH`; no database-backed lineage |
| `GET /api/market/{crop}` | Price/trend/history/supply pressure | `market_payload()` constants | No source, date, arrival, or retrieval metadata |
| `GET /api/dashboard/{farmer_id}` | Farmer dashboard summary | Constants plus recommendation | No persisted farmer or source records |
| `POST /api/chat` | Scripted chat response | Fixed string | Source labels are descriptive only, not retrieved evidence |
| `POST /api/voice` | Same chat response | Delegates to `chat()` | No speech service or data lineage |
| `GET /api/weather/{location}` | Fixed weather summary | Constants | No weather provider, timestamp, or forecast data |
| `GET /api/soil/{farmer_id}` | Fixed soil summary | Constants | No soil observation source/date |
| `GET /api/sustainability/{farmer_id}` | Fixed sustainability summary | Constants | No measurement source/methodology |
| `GET /api/analytics/{farmer_id}` | Empty history and fixed accuracy | Constants | No model evaluation provenance |
| `GET /api/selling-window` | Date-relative window and fixed prices | Constants plus server date | No price/arrival/maturity evidence |
| `GET /api/buyers` | Two fixed buyer-like records | Constants | No verification authority or source |

## Configuration and Dependencies

- `Backend/requirements.txt` contains FastAPI, Uvicorn, and Pydantic only. It contains no database driver, HTTP data-ingestion client, scheduler, ML framework, test framework, or data-processing library.
- `Frontend/package.json` contains React, Recharts, Vite, TypeScript, Tailwind/Vite tooling, and formatting. It contains no runtime schema validator, data-fetching cache, or testing framework.
- `Frontend/vite.config.ts` configures a local Vite server on port `8443`; it does not configure data ingestion or persistence.
- No `.env.example`, environment variable registry, deployment database configuration, or external data credentials were found.
- No attached PDF or project document was available in the workspace for source extraction during this audit.

## Main Data Risks

1. **Geography mismatch:** defaults and many fixtures are for Tamil Nadu, while the target plan is Maharashtra.
2. **No real-source boundary:** hardcoded prices, arrivals/adoption proxies, weather, climate, soil, buyer, and cultivation values are mixed with user inputs.
3. **No temporal integrity:** several values have month/year labels without observation or retrieval timestamps.
4. **No units contract:** price units vary in UI narrative (`/kg`, `q/ac`, MSP claims) and are not normalized.
5. **No canonical IDs:** crops, markets, districts, buyers, and farmers are represented by display strings.
6. **No persistence:** farmer observations, recommendations, feedback, source records, and audit trails are not stored.
7. **No quality gates:** stale, missing, suspicious, and fabricated-looking values cannot be automatically blocked or downgraded.
8. **No model evidence:** scores are deterministic fixtures/formulas; no training period, validation metrics, feature version, or model artifact exists.
9. **Frontend duplication:** screens and `data.ts` contain agricultural claims that can diverge from backend values.
10. **Fallback ambiguity:** the frontend fallback is useful for offline display but is not consistently marked as fallback/demo data.

## Phase 1 Verification

- Repository file inventory completed.
- Text search completed across Python, TypeScript/TSX, JSON, Markdown, TXT, and HTML files.
- No runtime data files or database artifacts found.
- Existing Python backend and frontend data surfaces identified.
- No files other than this audit document are intentionally modified for Phase 1.

## Next Phase Boundary

Phase 2 should create the source registry and `data_sources` persistence model. It should not yet claim that market, weather, cultivation, or soil data is integrated until each connector has a source, access method, freshness policy, validation rules, and recorded provenance.
