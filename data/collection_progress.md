# TerraMind data collection progress

**Workspace:** `C:\Users\admin\Downloads\TerraMind-X-Merged`
**Scope:** Tamil Nadu + Maharashtra, agriculture, target 2015–2025
**Rule:** no fabricated, invented, simulated or estimated observations. Every row in
`data/processed` and `data/combined` must trace back to a real file in `data/raw/`
listed in `data/metadata/source_registry.csv`.

Legend: `[ ]` NOT_STARTED · `[~]` IN_PROGRESS · `[✓]` COMPLETE · `[!]` BLOCKED · `[↻]` RETRYING

---

## Phase 0 — Project inspection

| Item | Status | Notes |
|---|---|---|
| Inspect project tree | `[✓]` | 2026-09-27 |
| Find existing `data/`, `scripts/`, `backend/`, docs | `[✓]` | `data/` contained only an empty `data/metadata/` |
| Reuse existing collectors | `[✓]` | Reused `scripts/_probe_sources.py`; referenced `backend/scripts/agmarknet_ceda/ingest_agmarknet.py` |
| Do not delete / overwrite working code | `[✓]` | Only additive changes |
| Create `data/collection_progress.md` | `[✓]` | This file |

**Pre-existing state (from `docs/final_data_audit.md`):** 0 observation files, 0 rows.
`src/data_pipeline/fetch_weather_b44.py` and `fetch_soil_b44.py` are 3-byte stubs.

## Phase 1 — Infrastructure

| Item | Status | Notes |
|---|---|---|
| Create `data/` directory tree | `[✓]` | `raw/{tamil_nadu,maharashtra,national,reference}`, `processed/*`, `combined`, `metadata`, `failures`, `reports/*` |
| Shared collection helpers | `[✓]` | `scripts/collect/tdcommon.py` (retry, failure taxonomy, hashing) |
| Endpoint reachability probe | `[~]` | `scripts/collect/probe_endpoints.py` → `data/metadata/endpoint_probe.json` |
| `data/metadata/source_registry.csv` | `[ ]` | Populated as downloads succeed |
| `docs/data_sources.md` | `[ ]` | |
| `scripts/validate_data.py` | `[ ]` | Flagged missing in `docs/next_actions.md` |

## Phase 2 — Data collection (by category)

| Category | Tamil Nadu | Maharashtra | Status |
|---|---|---|---|
| A. Crop history (area/production/yield) | `[ ]` | `[ ]` | NOT_STARTED |
| B. Weather (rainfall, temperature) | `[ ]` | `[ ]` | NOT_STARTED |
| C. Market / APMC prices | `[ ]` | `[ ]` | NOT_STARTED |
| D. Soil | `[ ]` | `[ ]` | NOT_STARTED |
| E. Irrigation / water | `[ ]` | `[ ]` | NOT_STARTED |
| F. Agricultural inputs | `[ ]` | `[ ]` | NOT_STARTED |
| G. Extreme events / crop damage | `[ ]` | `[ ]` | NOT_STARTED |

## Phase 3 — Processing & QA

| Item | Status | Notes |
|---|---|---|
| Clean / standardize raw → processed | `[ ]` | |
| Merge-safety checks (row counts) | `[ ]` | |
| Combined standardized datasets | `[ ]` | |
| Master dataset (if grain-compatible) | `[ ]` | |
| Data quality report | `[ ]` | `docs/data_quality_report.md` |
| Coverage report | `[ ]` | `docs/data_coverage_report.md` |
| Missing-data report | `[ ]` | `docs/missing_data_report.md` |
| Failure log | `[ ]` | `docs/collection_failures.md` |
| Manual download log | `[ ]` | `docs/manual_download_required.md` |
| Analysis + charts | `[ ]` | `reports/charts`, `reports/tables` |
| ML readiness assessment | `[ ]` | No accuracy claim without real training |
| Final report | `[ ]` | `docs/final_data_collection_report.md` |

---

## Change log

| Time (UTC) | Event |
|---|---|
| 2026-09-27 | Initial inspection; `data/` tree created; helpers written; endpoint probe started. |
