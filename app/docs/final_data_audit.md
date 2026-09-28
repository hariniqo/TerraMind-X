# TerraMind agriculture data pipeline — post-collection verification

**Audit time (local):** 2026-09-27 ~19:27 IST  
**Workspace:** `C:\Users\admin\Downloads\TerraMind-X-Merged`  
**Method:** inspect on-disk trees with `os.walk` / `os.stat`; pandas 2.2.3 available; **no new collection performed**.  
**Rule:** missing masters documented as `NOT_FOUND` / `PARTIALLY_AVAILABLE`; no fabricated rows written.

This is **not** a model evaluation. No accuracy percentage is claimed.

## Verdict

The file-based agriculture master pipeline **does not exist on disk**. Expected folders `data/raw/`, `data/processed/`, and `data/combined/` are absent. `data/metadata/` exists and is **empty**. Root `scripts/` is **absent**. `docs/data_sources.md` is **absent**. There are **zero** CSV / XLSX / XLS / Parquet / GeoJSON observation files in the repository (excluding `node_modules`).

**Project data collection is not complete.** Collectors and README claims exist in source; downloaded datasets do not.

---

## 1. Disk inventory (requested trees)

| Path | Exists | File count | Total bytes | Notes |
|---|---|---|---|---|
| `data/raw/` | **No** | 0 | 0 | Directory missing |
| `data/processed/` | **No** | 0 | 0 | Directory missing |
| `data/combined/` | **No** | 0 | 0 | Directory missing |
| `data/metadata/` | Yes | 0 | 0 | Empty directory (mtime 2026-09-27 14:00) |
| `docs/` | Yes | 1 | 14,220 | Only `backend_ai_ml_audit.md` |
| `scripts/` (repo root) | **No** | 0 | 0 | `python scripts/validate_data.py` cannot run |

### Files actually present under those trees

| filename (repo-relative) | source organization | source URL | file size (bytes) | row count | column count | year range | states | district count + sample | crop count | missing-value % | duplicate count |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `docs/backend_ai_ml_audit.md` | UNKNOWN (internal audit) | none (local markdown) | 14,220 | N/A (not tabular) | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `data/metadata/` (directory) | UNKNOWN | none | 0 | 0 | 0 | none | none | 0 | 0 | N/A | N/A |

**How numbers were counted:** `os.walk` of `data/`, `docs/`, `scripts/`; `Path.stat().st_size` for bytes; SHA-256 prefix of `docs/backend_ai_ml_audit.md` = `5c8f51fe99d88c45`. Pandas was **not** applied to observation tables because **none exist**.

### Broader tabular search (repo, excluding `node_modules` / `.git` / `dist`)

JSON found is **application config**, not agriculture observations:

| file | bytes | role |
|---|---|---|
| `components.json` | 444 | UI config |
| `export-report.json` | 681 | export metadata |
| `jsconfig.json` | 583 | JS config |
| `package.json` | 3,272 | npm package |
| `package-lock.json` | 350,653 | lockfile |
| `skills-lock.json` | 6,637 | skills lock |

**SQLite / `.db` files:** 0.

---

## 2. Claims vs files

| Claim location | Claim | On-disk evidence | Flag |
|---|---|---|---|
| (missing) `docs/data_sources.md` | Would list sources | **File not found** | CLAIM DOCUMENT MISSING |
| `data/metadata/` records | Processing metadata / `processing_steps` | **Zero files** | UNDOCUMENTED TRANSFORMS (none to document either) |
| `src/data_pipeline/README.md` | AGMARKNET fetch “✅ working”; Open-Meteo “✅ working”; SoilGrids script ready | **No downloaded market/weather/soil files.** `fetch_weather_b44.py` and `fetch_soil_b44.py` are **3-byte stubs** (`"""` only). `fetch_agmarknet_b44.py` is real Python (~6.2 KB) but produces Base44 API writes, not `data/raw/` files | **FALSE / OVERSTATED** relative to this file pipeline |
| `src/data_pipeline/README.md` | Festivals/crops “already seeded in-app” | Seed **code** exists (`backend/app/data/seed/crop_reference_seed.py`); not a downloaded 2015–2025 panel | Not a master CSV |
| `backend/scripts/agmarknet_ceda/README.md` | CEDA MH+TN 2007–2026 importer | Importer code present; **no checkpoints, CSVs, or DB dumps** in repo | Code ≠ data |
| `backend/app/services/ingestion/base.py` comment | Raw payloads persisted to `data/raw/` | `data/raw/` **does not exist** | CLAIM WITHOUT FILES |
| `src/data_pipeline/fetch_agmarknet_b44.py` | Resource ID `9ef84268-d588-465a-a308-a864a43d0070` | Other modules use `9ef84268-d588-448a-a48b-15f1c5718621` | **Inconsistent resource IDs** in source (cannot verify which OGD resource is live without fetching) |
| `src/data/terraData.js` | Sample farm, prices, IMD-style findings, confidence scores | Explicit comment: “Sample data for demo” | **DEMO / NOT A DATASET DOWNLOAD** |
| `src/lib/marketEngine.js` | `syntheticHistory()` / `demoQuery()` | Comment: “demo data (fallback when Agmarknet is unavailable)” | **SYNTHETIC GENERATOR IN APP CODE** |

No metadata JSON/CSV was found to cross-check URLs.

---

## 3. Domain classification (exactly one class each)

Classes used: `AVAILABLE` | `PARTIALLY_AVAILABLE` | `NOT_FOUND` | `BLOCKED` | `REQUIRES_MANUAL_DOWNLOAD`.

| Domain | Class | Evidence |
|---|---|---|
| Crop (area / production / yield, season-crop) | **NOT_FOUND** | No DES/APY, Season & Crop Report, or similar files under `data/` |
| Weather | **NOT_FOUND** | No IMD / Open-Meteo / station files. Weather collector **code** exists; fetch stub empty |
| Market prices | **NOT_FOUND** | No Agmarknet/CEDA/OGD extracts on disk. Collector + CEDA importer **code** only |
| Soil | **NOT_FOUND** | No Soil Health Card / SoilGrids extracts. README states ISRIC REST paused (Sep 2026) — that is a **source outage note in docs**, not a file. Class remains **NOT_FOUND** for this pipeline (see source-level SoilGrids as BLOCKED) |
| Irrigation | **NOT_FOUND** | No census/minor-irrigation files |
| Agricultural inputs | **NOT_FOUND** | No fertilizer/seed/pesticide statistics files |
| Extreme events | **NOT_FOUND** | No drought/flood/cyclone event tables |
| Economic / sustainability (optional) | **NOT_FOUND** | Not documented as collected; no files |

### Notable source-level datasets

| Source dataset | Class | Evidence |
|---|---|---|
| Tamil Nadu Season & Crop Report | **NOT_FOUND** | No PDF/XLS/CSV |
| IMD district/gridded rainfall | **NOT_FOUND** | No IMD files |
| Agmarknet / data.gov.in daily mandi | **NOT_FOUND** | No extracts; API client code present |
| CEDA Agmarknet (Ashoka) | **NOT_FOUND** | Importer only; no monthly checkpoints |
| Maharashtra SDB / DES | **NOT_FOUND** | No SDB extracts |
| Open-Meteo archive | **NOT_FOUND** | `fetch_weather_b44.py` stub; no JSON/CSV |
| ISRIC SoilGrids REST | **BLOCKED** | `src/data_pipeline/README.md` states REST API paused Sep 2026; no GeoTIFF/CSV captured |
| Soil Health Card (DAC) | **REQUIRES_MANUAL_DOWNLOAD** | No automated files; portal typically needs interactive download |
| Festival / crop reference seed | **PARTIALLY_AVAILABLE** | In-repo **seed/demo catalogs**, not 2015–2025 observational panels |

---

## 4. Tamil Nadu coverage (from actual columns)

**No observation table exists.** Therefore:

| Metric | Measured value |
|---|---|
| Districts | 0 (no district column to read) |
| Years | none |
| Crops | 0 |
| Missing years 2015–2025 | **2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025** (all datasets) |

`src/data/terraData.js` names Thoothukudi / Kovilpatti as **demo** geography, not a verified TN panel.

---

## 5. Maharashtra coverage (from actual columns)

**No observation table exists.** Therefore:

| Metric | Measured value |
|---|---|
| Districts | 0 |
| Years | none |
| Crops | 0 |
| Missing years 2015–2025 | **2015–2025 inclusive (all 11 years)** for every requested domain |

`src/lib/marketEngine.js` `demoQuery()` uses district `"Nashik"` as **demo fallback**, not measured MH coverage.

---

## 6. Period 2015–2025 — missing years per dataset / state

Because **zero** datasets have rows, every requested dataset is missing **all** years 2015–2025 for both Tamil Nadu and Maharashtra.

| Dataset (requested) | TN missing years | MH missing years |
|---|---|---|
| Crop statistics | 2015–2025 | 2015–2025 |
| Weather | 2015–2025 | 2015–2025 |
| Market prices | 2015–2025 | 2015–2025 |
| Soil | 2015–2025 | 2015–2025 |
| Irrigation | 2015–2025 | 2015–2025 |
| Agricultural inputs | 2015–2025 | 2015–2025 |
| Extreme events | 2015–2025 | 2015–2025 |

---

## 7. Master combined files — join / duplication check

`data/combined/` **does not exist**. No master join was performed.

| Check | Result |
|---|---|
| False joins | **N/A — no combined file** |
| Duplicate keys `(state, district, year, season, crop)` | **N/A** |
| Conflicting values on same key | **N/A** |
| Cartesian-product symptoms | **N/A** |

No evidence of a bad join **in files**, because there are no joined files. This is **absence**, not a clean join.

---

## 8. Raw vs processed integrity

| Check | Result |
|---|---|
| Original PDF/XLS still present | **No** original download formats found |
| File hashes raw vs processed | **Cannot compare** — both sides missing |
| Processed derived from raw | **Unverifiable** — no processed files |
| Raw still looks like original downloads | **No raw downloads** |

---

## 9. Transformation documentation

| Expected artifact | Status |
|---|---|
| `docs/data_sources.md` | **MISSING** |
| Metadata `processing_steps` | **MISSING** (empty `data/metadata/`) |
| Cleaning/combine scripts at `scripts/` | **MISSING** |

**Undocumented transforms:** any transform that might run inside FastAPI collectors (`backend/app/data/collectors/`) or Base44 fetchers is **not** recorded as a pipeline processing step with input/output hashes. Flag: **ALL FILE-PIPELINE TRANSFORMS UNDOCUMENTED** because the file pipeline has no outputs.

---

## 10. Fabrication / synthetic observation check

### File pipeline

No generated CSV of “real-world” crop/weather/market rows was found under `data/`. **No CRITICAL dummy-row generator was executed against `data/` in this audit.**

### Application / seed code (prominent)

| Location | Finding | Severity |
|---|---|---|
| `src/lib/marketEngine.js` `syntheticHistory()` | Explicit RNG lognormal price series labeled as demo fallback | **CRITICAL** if presented as Agmarknet history |
| `src/lib/marketEngine.js` `demoQuery()` | Hard-coded village, Nashik, prices, weather, soil | **CRITICAL** if presented as observed data |
| `src/data/terraData.js` | Header: “Sample data for demo”; turmeric price history, agent confidence 86–94, IMD-like rainfall 720–780 mm | **CRITICAL** for research/master-data use |
| `src/data_pipeline/README.md` | Marks weather fetch “✅ working” while `fetch_weather_b44.py` is empty stub | **HIGH** documentation false claim |
| `src/data_pipeline/run_all_b44.py` | File is a long product-spec dump (37,904 bytes), not a verified collector runner | **HIGH** misleading filename |
| `src/lib/marketIngest.js` / collectors | Comments forbid synthetic fills; abort without API key | **OK as policy**; does not create `data/` files |

Placeholder district names in **demo JS** (Demo Village, Nashik, Thoothukudi sample farm) are **not** a harvested district list.

**False-join findings:** none in combined masters (none exist).

---

## 11. CSV/XLSX/JSON quality (corruption, units, names)

No agriculture CSV/XLSX to scan.

JSON files inspected by extension search are package/config, not district-crop panels. No negative area/production, yield outliers, or district spelling variants **in observation tables** because those tables are absent.

---

## 12. Validation scripts

### `python scripts/validate_data.py`

```
C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe: can't open file
'C:\Users\admin\Downloads\TerraMind-X-Merged\scripts\validate_data.py':
[Errno 2] No such file or directory
```

**Exit code:** 2  
**stderr:** as above  
**stdout:** (empty)

Clean/combine scripts were **not** run (they are missing; running them would not overwrite real data because there is none).

Related: `backend/scripts/audit_data.py` audits a **database**, not `data/raw`. It was **not** run (would require app DB credentials and is out of the file-pipeline scope). No `docs/data_audit_report.json` exists.

---

## 13. Actual totals (from files, not README claims)

| Total | Value | How counted |
|---|---|---|
| Observational datasets with ≥1 real row | **0** | Count of CSV/XLSX/Parquet under `data/raw|processed|combined` with `len(df) > 0` |
| Files verified in requested trees | **1** | `docs/backend_ai_ml_audit.md` only |
| Empty dirs | `data/`, `data/metadata/` | `os.walk` |
| Rows (agriculture observations) | **0** | No pandas DataFrame of observations |
| Columns | **N/A** (0 tables) | Would be `df.shape[1]` per file, summed only if defined; **not summed across config JSON** |
| Distinct districts | **0** | No district column |
| Distinct crops | **0** | No crop column |
| Distinct years | **none** | No year/date column |
| Collector/script files (adjacent, not in `scripts/`) | several | e.g. `src/data_pipeline/*.py`, `backend/app/data/collectors/*.py`, `backend/scripts/agmarknet_ceda/` |

---

## 14. Stub / adjacent pipeline files (not under `data/`)

Measured with `os.stat` (not observation rows):

| path | bytes | note |
|---|---|---|
| `src/data_pipeline/fetch_soil_b44.py` | 3 | stub `"""` |
| `src/data_pipeline/fetch_weather_b44.py` | 3 | stub `"""` |
| `src/data_pipeline/fetch_agmarknet_b44.py` | 6,221 | OGD client → Base44, not `data/raw` |
| `src/data_pipeline/run_all_b44.py` | 37,904 | product spec text, not a runner |
| `src/data_pipeline/README.md` | 4,588 | overstates working fetchers |
| `backend/app/data/collectors/agmarknet_collector.py` | 9,068 | code only |
| `backend/app/data/collectors/weather_collector.py` | 7,703 | code only |
| `backend/scripts/agmarknet_ceda/ingest_agmarknet.py` | (present) | code only; no output data in repo |

---

## 15. Completeness statement

**The agriculture file pipeline is not complete.** Completeness would require populated `data/raw` originals, derived `data/processed`, documented `data/metadata`, combined masters, and `docs/data_sources.md` with processing steps. None of those data artifacts are present in this snapshot.

A parallel collector, if still running, had **not** written any files into these directories at audit time.

---

## 16. Next document

See `docs/next_actions.md` for official URLs and why each domain is currently unavailable.
