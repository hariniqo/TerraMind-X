# Phase 1 Requirements and Existing Implementation Inventory

Inventory date: 2026-09-29  
Project: TerraMind-X-Merged  
Scope: roadmap Phase 1 only; no RAG retrieval/indexing implementation.

## Roadmap Basis

`roadmap_extracted.txt` is not present in the repository or Downloads root. The original PDF is present at `C:\Users\admin\Downloads\TerraMind-X_Hybrid_RAG_Roadmap.pdf`; its browser view has no extractable text layer in this environment. The exact Phase 1 requirements and gate below are transcribed from the roadmap text supplied in the task context.

## PHASE 1 REQUIREMENTS

- Structured agricultural observations are collected into SQL, not RAG: AGMARKNET prices and arrivals with a daily scheduled job and retries; Open-Meteo and NASA POWER weather; SoilGrids priors labeled modeled, not measured; Earth Engine NDVI/NDWI; real field soil data from an NGO/device pipeline when available.
- Knowledge-source collection covers TNAU cultivation guides, ICAR and agriculture department documents, quality standards, FPO/buyer specifications, and research papers.
- Every collected item retains source, URL, type, published date, retrieved date, location, crop, and verification status.
- No synthetic prices or buyers. Missing values remain NULL and unavailable status is explicit. Freshness and coverage are tracked in a `data_quality` table.
- Phase 1 gate: 2-3 years of daily prices for target crop/market pairs and 100+ curated documents with complete provenance.
- Phase 1 does not include embeddings, vector search, BM25, hybrid retrieval, or reranking; these remain out of scope until their roadmap phases.

## Requirement-to-Code Map

Status vocabulary: EXISTING, PARTIAL, MISSING, BROKEN.

| ID | Requirement | Status | Evidence and remaining gap |
|---|---|---|---|
| R1 | SQL structured market, weather, soil, cultivation, location, and buyer data; no RAG | PARTIAL | Active tables exist in `backend/app/db/models.py`; no RAG exists. Real populated structured coverage is absent from the connected in-memory DB. |
| R2 | Daily AGMARKNET price/arrival collection with retry | PARTIAL | `AgmarknetCollector`, `run_market_ingestion`, scheduler, retry/backoff, source ID, and upsert exist. `DATA_GOV_IN_API_KEY` is unset; market raw directories contain 0 files; CEDA download log shows repeated 429s; runtime has no persisted cursor/checkpoint. |
| R3 | Open-Meteo and NASA POWER weather | PARTIAL | Both connectors and raw download scripts exist. 159 Tamil Nadu ERA5 JSON files span 2015-2025 but cover only some district points; Maharashtra ERA5 directory is absent. No persisted backend observations were verified. |
| R4 | SoilGrids priors labeled modeled, not measured | BROKEN | Connector fetches pH and organic carbon only, but `run_soilgrids_ingestion` writes `provenance="REAL"` and `source_type="soilgrids"` into the soil-observation table. This must be labeled as modeled/estimated before ingestion is trusted. |
| R5 | Earth Engine NDVI/NDWI observations | PARTIAL | Bhuvan/Sentinel adapter exists but requires `TERRAMIND_EE_ENDPOINT`, which is unset; there is no configured connector endpoint or verified record. |
| R6 | Real field soil data from NGO/device pipeline when available | MISSING | Soil schema can hold nullable test measurements; no NGO/device connector or field observations were found. |
| R7 | Curated knowledge-source documents from TNAU/ICAR/departments/FPO specs/research | PARTIAL | 93 PDFs exist in raw data, mostly government portal publications and report sources. There is no curated-document registry, per-file review/verification, or evidence that 100 are the roadmap's knowledge types. |
| R8 | Complete per-item provenance (source, URL/type, published/retrieved dates, location, crop, verification) | PARTIAL | Raw manifest has organization, URLs, retrieval date, coverage, license, and hashes for many files. Runtime observation models have uneven source fields; `published_at`, source type, crop/location links, or verification are missing in several models. Manifest records may refer to missing files. |
| R9 | No fabricated observations; missing data NULL/unavailable | PARTIAL | Backend collectors generally return unavailable/no-key and avoid synthetic fallback. Market values can bypass `validate_batch`; SoilGrids is mislabeled REAL. Demo values exist in explicitly labeled UI areas and must remain outside ingestion. |
| R10 | Persist freshness and geographic/temporal coverage in `data_quality` table | MISSING | `/api/v1/data-quality` computes a transient market summary; `/api/v1/ingestion/quality` computes transient per-source metrics. There is no `data_quality` model/table or persistent coverage snapshot. |
| R11 | Shared connector contract for fetch, validate, normalize, deduplicate, persist | PARTIAL | `BaseCollector` standardizes fetch result/retry and individual collectors normalize. Shared persistence exists only in service helpers. `BaseIngestionPipeline` claims shared machinery but imports missing `app.core.database` and is not the active pipeline. |
| R12 | Reproducible raw response retention with source ID/hash | PARTIAL | Runtime stores raw JSON/text in `RawIngestion`; that model lacks source URL, content hash, retention limit, and checkpoint link. File download helper computes SHA-256 and retains a JSONL manifest. |
| R13 | Market field validation, min <= modal <= max, invalid rows rejected/logged | BROKEN | `market_validator.py` checks required fields, modal price, and min <= max only; it does not check min <= modal <= max or validate negative min/max. `run_market_ingestion` cleans/upserts without calling `validate_batch`. |
| R14 | Weather coordinate/value/date validation and forecast/observation distinction | PARTIAL | Weather model has `data_type`, `observation_time`, units, source, and forecast/reanalysis labels. No general validation is called before persistence; Open-Meteo `current` model output is currently stored as `data_type="forecast"`; no separate read routes are registered. |
| R15 | Soil only contains supported fields; no average imputation | PARTIAL | Soil fields are nullable and SoilGrids populates only pH/SOC. Existing values are not averaged, but source classification is wrong and no per-record validation/read API exists. |
| R16 | Geographic hierarchy and source granularity | PARTIAL | `states -> districts -> taluks -> villages -> gis_farms` exists. `CultivationRecord` stores free-text geography plus `admin_level`, without FK links to that hierarchy; no source coverage is loaded. |
| R17 | Distinguish verified buyers, reported demand, observed transactions, inferred demand | PARTIAL | Buyer and BuyerDemand tables have verification fields; BuyerDemand has buyer FK. No authoritative buyer/demand connector exists; no evidence-type field distinguishes reported/inferred demand; no SQL transaction observation model. |
| R18 | PostgreSQL/PostGIS support without removing SQLite development | PARTIAL | SQLAlchemy geometry/geography and GIST indexes exist; Alembic migrations 0001/0002 exist. Local PostgreSQL/PostGIS was unavailable. SQLite startup requires excluding spatial tables because SpatiaLite is absent; the other 19 non-spatial tables remain usable. |
| R19 | Dataset-specific validation and deterministic source-ID dedupe | BROKEN | Market validator is not wired into ingestion. Market ETL deduplicates by state/district/market/commodity/date, ignoring variety/grade/source ID, and AGMARKNET collector can also discard distinct IDs under a value-like key. |
| R20 | Resumable ingestion and complete run counts/checkpoint | PARTIAL | CEDA file collector skips already-present monthly files and bisects capped date slices. Runtime `IngestionRun` has received/accepted/rejected/duplicates but no updated/skipped/failed/checkpoint; the alternative BaseIngestionPipeline is broken/unwired. |
| R21 | Timeouts, exponential backoff, rate-limit handling | PARTIAL | `BaseCollector` and `source_http` retry with timeouts/backoff; CEDA/Open-Meteo file collectors have rate-limit waits. No shared concurrency/rate budget; observed source logs include 429. |
| R22 | Fresh/stale/expired/unknown without deleting history | PARTIAL | Quality endpoints derive staleness from latest successful ingestion; row-level freshness policy and persistent quality table are absent. Historical rows are not intentionally deleted by these paths. |
| R23 | Read APIs for verified market/weather/soil/crops/locations/buyers/demand | PARTIAL | Market routes and health/data-quality routes are registered. `backend/app/api/{weather,soil,crops,buyers,cultivation,gis}.py` are TODO stubs and are not registered by `main.py` or `main_merged.py`. |
| R24 | Empty/unavailable responses, invalid parameter and location/date filtering | PARTIAL | Market API exposes an empty `DATA_UNAVAILABLE` response and filters commodity/state/district/date window. Equivalent read contracts for weather/soil/crops/locations/buyers/demand are missing. |
| R25 | Connector/validation/dedupe/provenance/API tests | PARTIAL | Existing market ETL/validator/persistence tests exist. There are no full fake-HTTP connector tests for success/empty/malformed/429/timeout, no weather/soil persistence validation suite, and no complete provenance coverage. Full backend baseline: 63 passed, 16 failed. |
| R26 | Machine-readable ingestion report with counts/checkpoint/errors | PARTIAL | `IngestionRun`, `RawIngestion`, `/ingestion/runs`, and source quality responses exist. Missing per-run records_updated/skipped/failed, checkpoint, raw hash, and consistent schema across collectors. |
| R27 | Secrets via environment and documented sources/limitations | PARTIAL | `backend/.env.example` and `.env.local.example` exist; no real env files are present. `docs/data_sources.md` is absent; `data/metadata/source_registry.csv` is absent though `scripts/build_registry.py` exists. |
| R28 | Do not implement RAG retrieval during Phase 1 | EXISTING | No document chunks, embeddings, pgvector, BM25, hybrid retrieval, or reranker found. Keep it absent in this phase. |
| R29 | Gate requires real prices + 100 curated, provenance-complete documents | MISSING | No market files or connected market rows exist; only 93 raw PDFs and no curated review/provenance set. External credentials/source rate limits block the required evidence. |

## Data Volume and Source Coverage

Measured 2026-09-29:

- `data/` contains 1,305 files / 168,738,853 bytes; `data/raw/` contains 1,216 files / 168,465,498 bytes.
- Raw extensions: 848 CSV, 237 JSON, 93 PDF, 18 XLS, 5 XLSX, 14 HTML, plus logs/metadata.
- All 848 CSV files are under extracted `pdf_tables` folders: 705 national and 143 Maharashtra tables. They are raw table extracts, not verified/normalized daily market observations.
- `data/raw/tamil_nadu/weather/openmeteo_era5/` contains 159 JSON files covering 15 district points across 2015-2025. Maharashtra has no corresponding ERA5 directory. No raw market directory/data exists for either target state (`maharashtra/market/ceda` has 0 files; Tamil Nadu `market` is absent).
- The JSONL download manifest has 154 entries marked DOWNLOADED; 124 entries name a file and all 124 paths resolve. The remaining 30 entries have no `file_name` and include portal/index records, so their status means inspected/reached, not a file download. No canonical source registry exists yet.
- `data/processed` contains no tabular files; `data/combined` is empty. 93 PDFs are not automatically curated knowledge documents.
- The connected backend is in-memory SQLite only. `/api/v1/data-quality` reports 0 market prices and an empty `data_sources` list. Other table row counts are not exposed and no persistent DB is configured, so they are NOT MEASURED. Base44 counts are unavailable because the app is unlinked.

## Live SQLAlchemy Model Inventory

Authoritative runtime model source: `backend/app/db/models.py` (29 tables, `Base` from `backend/app/db/database.py`). There is no persistent database in the verified setup. Current live counts: market prices 0, data source registry 0; other counts NOT MEASURED.

| Table/model | Purpose; PK; FKs | Geography | Timestamp/date fields | Source/provenance and verification | Current volume |
|---|---|---|---|---|---|
| `states` / State | Administrative lookup; `id`; no FK | State | `created_at` | None | Not measured |
| `districts` / District | Administrative lookup/boundary; `id`; `state_id -> states.id` | State name/id, boundary, centroid | `created_at` | None | Not measured |
| `taluks` / Taluk | Administrative lookup/boundary; `id`; `district_id -> districts.id` | District/state names, boundary, centroid | `created_at` | None | Not measured |
| `villages` / Village | Administrative lookup/coordinates; `id`; taluk/district FKs | Village, taluk, district/state names, coordinates/boundary | `created_at` | None | Not measured |
| `gis_farms` / GisFarm | Farm geometry/area; `id`; village/district/state FKs | Farmer ID, hierarchy IDs, geometry | `created_at`, `updated_at` | Geometry source/confidence only | Not measured |
| `gis_market_locations` / GisMarketLocation | Market registry/coordinates; `id`; district/state FKs | Market, district/state, coordinates | `created_at`, `updated_at` | `source`, `source_url`, `provenance`, `verification_status` | Not measured |
| `gis_satellite_observations` / GisSatelliteObservation | NDVI/NDWI/EVI; `id`; farm/village/district FKs | Farm/village/district geometry | `acquisition_date`, `retrieved_at`, `created_at` | `source`, `source_url`, `provenance`; no verification field | Not measured |
| `gis_water_features` / GisWaterFeature | Water geometry; `id`; district/state FKs | District/state geometry | `retrieved_at`, `created_at` | `source`, `source_url`, `provenance`; no verification field | Not measured |
| `gis_road_network` / GisRoadNetwork | Road geometry; `id`; district/state FKs | District/state geometry | `retrieved_at`, `created_at` | `source`, `source_url`, `provenance`; no verification field | Not measured |
| `gis_crop_clusters` / GisCropCluster | Aggregated crop cluster; `id`; no FK | State/district/taluk/village strings + geometry | Year, `retrieved_at`, `created_at` | `source`, `source_url`, `provenance`; no verification field | Not measured |
| `crop_reference` / CropReference | Agronomic/MSP lookup; `id`; no FK | No location field | Publication year, `retrieved_at`, `created_at`, `updated_at` | `source_name`, `source_url`, `source_document`, `provenance`; no verification field | Not measured |
| `market_prices` / MarketPrice | Daily market price; `id`; no location/crop FK; natural-key unique constraint | State/district/taluk/market strings | `trading_date`, `data_timestamp`, `retrieved_at`, `fetched_at` | `source`, URL, record ID, provenance, verification, quality flags | 0 in live DB |
| `market_arrivals` / MarketArrival | Daily arrivals; `id`; no market/location/crop FK | State/district/market strings | `arrival_date`, `retrieved_at` | `source`, URL, record ID, provenance, verification | Not measured |
| `weather_observations` / WeatherObservation | Weather/reanalysis/forecast; `id`; no location FK | State/district strings + coordinates | `observation_time`, `retrieved_at` | `weather_source`, URL, model, provenance, verification; no record ID | Not measured |
| `soil_observations` / SoilObservation | Soil measurement/prior; `id`; no location/farm FK; spatial fields | State/district/taluk/village + coordinates | `test_date`, `retrieved_at`, `created_at` | `source_type`, `source`, URL, provenance, verification; no record ID | Not measured |
| `cultivation_records` / CultivationRecord | Crop area/season statistics; `id`; no crop/location FK | State/district/taluk/village strings + `admin_level` | Cultivation year, `retrieved_at`, `created_at` | `source`, URL, source record ID, provenance, verification | Not measured |
| `buyers` / Buyer | Buyer directory; `id`; no FK | Location/state/district strings | `retrieved_at`, `last_verified_at`, `created_at` | `verification_source`, `source`, URL, provenance, verification | Not measured |
| `buyer_demand` / BuyerDemand | Procurement requirements; `id`; `buyer_id -> buyers.id` | Delivery location string | `demand_date`, `retrieved_at`, `created_at` | `source`, URL, provenance, verification; no source record ID or evidence kind | Not measured |
| `festival_calendar` / FestivalCalendar | Festival reference/signal; `id`; no FK | State/district strings | `start_date`, `end_date`, `retrieved_at`, `created_at` | `source`, URL, provenance, verification, evidence type | Not measured |
| `government_policies` / GovernmentPolicy | Policy/MSP reference; `id`; no FK | Applicable state/district strings | Effective/expiry dates, `retrieved_at`, `created_at` | `source`, URL, provenance, verification | Not measured |
| `market_aliases` / MarketAlias | Source-name canonicalization; `id`; no FK | State string | `created_at` | `source_name`; no verification | Not measured |
| `data_sources` / DataSource | Source registry and last attempt/success; `id`; no FK | None | `last_successful_fetch`, `last_attempted_fetch`, `created_at`, `updated_at` | Source name/type/base URL/API-key variable name/status/error | 0 in live DB |
| `data_provenance` / DataProvenance | Dataset-level provenance summary; `id`; no FK | Geography/state/district strings | Collection/start/end dates, `last_updated`, `created_at` | Source name/URL, quality status, provenance, synthetic flag | Not measured |
| `raw_ingestion` / RawIngestion | Raw external payload audit; `id`; no FK | None | `retrieved_at` | `source`, HTTP/status/error; no URL/hash/checkpoint | Not measured |
| `ingestion_runs` / IngestionRun | Run counters/status; `id`; no FK | None | `started_at`, `completed_at` | Source name/URL/status/HTTP/error; no updated/skipped/checkpoint counters | Not measured |
| `ml_models` / MLModel | Model registry; `id`; no FK | Training geography embedded in name/notes | Training period, trained/created dates | Training sources text, not observation provenance | Not measured |
| `prediction_logs` / PredictionLog | Model output; `id`; `model_id -> ml_models.id` | State/district/commodity | `generated_at`, `actual_date` | Data-source count and model metadata; prediction, not observation | Not measured |
| `agent_results` / AgentResult | Agent result; `id`; no FK | State/district/commodity | `generated_at` | Result/evidence counts; not observation provenance | Not measured |
| `decision_logs` / DecisionLog | Decision/explanation; `id`; no FK | State/district/taluk/village/commodity | `generated_at` | Evidence summary and missing-data text; not observation provenance | Not measured |

### Requested Entities: Key Gaps

- There is no active SQL `Location` table (the hierarchy is four tables); no active SQL `Crop` lookup (only `CropReference`). `CultivationRecord` stores crop/geography names without FKs.
- `PriceAlert` is Base44-only; no active SQL model exists.
- Buyer and demand tables have source/verification columns but no connector, no classified evidence type, and no observed transaction model in the active SQL layer.
- Most observation tables do not have a complete shared provenance contract; source fields and verification vary by table.

## Base44 Entity Schema Inventory

These are separate Base44 JSONC schemas, not SQLAlchemy tables. Their service-side rows cannot be counted without an app link. Base44-generated primary `id` is implicit; string `*_id` fields do not establish SQL foreign keys here.

| Entity | Purpose and references/location | Time fields | Provenance/verification fields | Volume |
|---|---|---|---|---|
| `BacktestRun` | Backtest result; crop ID, district | Cutoff date, run time | None | Unavailable |
| `Buyer` | Buyer directory; location/state implicit text | Retrieved time | Verification source, URL, status | Unavailable |
| `BuyerDemand` | Buyer requirement; buyer/crop IDs | Demand date, retrieved time | Source, URL, status | Unavailable |
| `Crop` | Crop master | Retrieved time | Source, URL, status | Unavailable |
| `CropCalendar` | Crop/season calendar; state/district text | Sowing and harvest date ranges, retrieved time | Source, URL, status | Unavailable |
| `CultivationRecord` | Area records; location/crop IDs and admin level | Cultivation year, retrieved time | Source, URL, source ID, status | Unavailable |
| `DataSource` | External source registry | Last attempt/success | Source name/type/status | Unavailable |
| `FestivalCalendar` | Festival reference and demand signal; state/district | Start/end/retrieved dates | Source, URL, status | Unavailable |
| `GovernmentPolicy` | Policy/MSP reference; state/district/crop | Effective/expiry/retrieved dates | Source, URL, status | Unavailable |
| `LandCropPlan` | Farmer plan; state/district/cluster text | Sowing/sale dates, retrieved time | Source only | Unavailable |
| `Location` | Hierarchy represented as state/district/taluk/village strings + coordinates | Retrieved time | Source, URL, status | Unavailable |
| `Lot` | Harvest lot; farmer/location/crop IDs | Harvest/retrieved dates | Source, status | Unavailable |
| `MarketArrival` | Arrival record; crop ID/market text | Date/fetched time | Source, URL, source ID | Unavailable |
| `MarketPrice` | Price record; location/crop IDs plus geography text | Trading/data/retrieved/fetched times | Source, URL, source ID, verification | Unavailable |
| `Offer` | Offer; lot/buyer/demand IDs | Retrieved time | Source, verification | Unavailable |
| `PriceAlert` | Derived alert, not a source observation | Trading/check times | No source/provenance field | Unavailable |
| `RawDataRecord` | Raw API response audit | Request/response times | Source, URL, endpoint, source ID, checksum, validation/processing status | Unavailable |
| `SoilData` | Soil test/prior; location/farm IDs | Test/measurement/retrieved times | Source, URL, source/raw IDs, type, verification | Unavailable |
| `SowingRecord` | Sowing record; plot/crop text | Sowing/retrieved dates | Source, verification | Unavailable |
| `StorageAvailability` | Storage capacity; location text | Observation/retrieved dates | Source, URL, verification | Unavailable |
| `SyncLog` | Sync run | Request/response times | Source/status/counts/errors | Unavailable |
| `Transaction` | Offer/lot/buyer/farmer/location IDs | Retrieved time | Source, verification | Unavailable |
| `TransportationCost` | Route/crop/mode quote | Observation/retrieved dates | Source, URL, verification | Unavailable |
| `User` | Application identity | Schema JSONC has parse comments; not an agricultural observation | Authentication-controlled | Unavailable |
| `WeatherData` | Weather/reanalysis/forecast; location ID + coordinates | Observation/retrieved times | Source, URL, model, verification | Unavailable |

## Architecture and Migration Findings

- Existing active pattern: `backend/app/data/collectors/BaseCollector` + source-specific collectors + `backend/app/services/ingestion_service.py` + `backend/app/db/models.py` + registered `/api/v1/market`, `/api/v1/ingestion`, `/api/v1/data-quality` routes.
- A second `backend/app/services/ingestion/BaseIngestionPipeline` imports `app.core.database.session_scope`; that module does not exist. `backend/app/models/*` also imports that missing module. This path is broken/unwired and must not be expanded as a parallel architecture.
- Alembic is the only schema migration mechanism (`0001_initial_schema.py`, `0002_market_etl_audit.py`). New SQL tables/columns must use an Alembic revision; do not add create-all-only schema changes.
- SQLAlchemy PostGIS types/GIST indexes are present. No PostgreSQL/PostGIS service is available locally. SQLite remains the supported non-spatial dev/test path; spatial models are omitted from SQLite `create_all` because SpatiaLite functions are unavailable.
- Environment names are documented in `.env.local.example` and `backend/.env.example`; values are not included here. Market collection requires `DATA_GOV_IN_API_KEY`. Open-Meteo/NASA POWER are keyless. Satellite requires `TERRAMIND_EE_ENDPOINT`; TN portal requires an authorized `TNAGRISNET_DATA_URL`. Database defaults to SQLite; PostgreSQL needs `DATABASE_URL`.

## Inventory Decision

This inventory is complete before Phase 1 implementation begins. Highest-risk implementation defects to address first are: incorrect SoilGrids classification, market validation not enforced, source-ID deduplication collisions, no persistent `data_quality` table/checkpoint fields, incomplete observation provenance, missing read APIs, unverified registry-file references, and absent connector failure/provenance tests.

The roadmap's numeric Phase 1 gate cannot currently pass: market history is unavailable due absent files/API key and observed CEDA rate limiting; the 100-document curated/provenance-reviewed set is not established. Code can improve trustworthy collection and reporting, but no records will be invented to make this gate appear complete.
