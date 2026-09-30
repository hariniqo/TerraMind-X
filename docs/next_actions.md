# Next actions — TerraMind file-pipeline data gaps

**Based on:** `docs/final_data_audit.md` (snapshot 2026-09-27).  
**Constraint:** do not invent rows. Download official extracts into `data/raw/`, then process with documented steps.

All requested 2015–2025 Tamil Nadu and Maharashtra observation files are currently **missing** (`data/raw`, `data/processed`, `data/combined` empty or absent).

---

## Blockers that prevent claiming completeness

1. No `scripts/validate_data.py`, no `docs/data_sources.md`, no metadata `processing_steps`.
2. `fetch_weather_b44.py` and `fetch_soil_b44.py` are empty stubs; README still marks weather as working.
3. App demo generators (`syntheticHistory`, `terraData.js`) must stay labeled demo and must **not** be copied into `data/processed` as observations.

---

## Missing datasets (exact) and official sources to try next

### 1. Crop statistics — Tamil Nadu Season & Crop / DES

| Field | Value |
|---|---|
| Status | **NOT_FOUND** |
| Why unavailable | No PDF/XLS/CSV on disk |
| Try next | Tamil Nadu Open Data / Agriculture statistics; DES Season and Crop Report publications |
| URLs | https://www.data.tn.gov.in/ — search “Season and Crop” / “Crop Area Production”; https://www.tn.gov.in/department/2 (Agriculture); national DES APY: https://desagri.gov.in/ ; OGD crop production: https://www.data.gov.in/ (search “District-wise, season-wise crop production statistics”) |

### 2. Crop statistics — Maharashtra SDB / DES

| Field | Value |
|---|---|
| Status | **NOT_FOUND** |
| Why unavailable | No SDB/DES district-crop-year files |
| Try next | Maharashtra State Data Bank / DES crop reports |
| URLs | https://mahades.maharashtra.gov.in/ ; https://mahasdb.maharashtra.gov.in/ (if live); https://www.data.gov.in/ filtered State=Maharashtra |

### 3. Market prices — Agmarknet / data.gov.in

| Field | Value |
|---|---|
| Status | **NOT_FOUND** (code exists, no extract) |
| Why unavailable | No CSV/JSON under `data/raw`; Base44 fetch is not a file archive. Resource IDs in repo **conflict** (`9ef84268-d588-448a-a48b-15f1c5718621` vs `9ef84268-d588-465a-a308-a864a43d0070`) — resolve against live OGD catalog before bulk download |
| Try next | Confirm resource on data.gov.in; save daily/historical JSON+CSV to `data/raw/agmarknet/` |
| URLs | https://agmarknet.gov.in/ ; https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi ; API pattern `https://api.data.gov.in/resource/<resource_id>` (requires free API key) |
| Alternate historical | CEDA: https://agmarknet.ceda.ashoka.edu.in/ — use `backend/scripts/agmarknet_ceda/` **and persist checkpoints as files**, not only a local Postgres that is not in git |

### 4. Weather — IMD rainfall / temperature

| Field | Value |
|---|---|
| Status | **NOT_FOUND** |
| Why unavailable | No IMD grids or district monthly series on disk; Open-Meteo stub not executed into `data/raw` |
| Try next | IMD Pune gridded rainfall / district rainfall data download pages; OGD IMD datasets |
| URLs | https://www.imdpune.gov.in/Clim_Pred_LRF_New/Grided_Data_Download.html ; https://www.imd.gov.in/ ; https://www.data.gov.in/ (search “rainfall district”) |
| Optional archive | Open-Meteo Historical: https://open-meteo.com/en/docs/historical-weather-api — only if documented as reanalysis, not IMD station observations |

### 5. Soil

| Field | Value |
|---|---|
| Status | **NOT_FOUND** file; SoilGrids REST **BLOCKED** per pipeline README |
| Why unavailable | Empty `fetch_soil_b44.py`; ISRIC REST reported paused (Sep 2026) |
| Try next | Soil Health Card portal (often **manual** district export); ISRIC GeoTIFF if REST remains down |
| URLs | https://soilhealth.dac.gov.in/ ; https://www.isric.org/explore/soilgrids ; https://soilgrids.org/ |

### 6. Irrigation

| Field | Value |
|---|---|
| Status | **NOT_FOUND** |
| Why unavailable | No minor irrigation census / WRIS extracts |
| Try next | 6th Minor Irrigation Census; India-WRIS |
| URLs | https://micensus.gov.in/ ; https://indiawris.gov.in/ ; https://www.data.gov.in/ (search “minor irrigation”) |

### 7. Agricultural inputs (fertilizer, seed)

| Field | Value |
|---|---|
| Status | **NOT_FOUND** |
| Why unavailable | No FAI/DAC input statistics files |
| Try next | DAC fertilizer statistics; OGD fertilizer consumption |
| URLs | https://www.faidelhi.org/ (FAI publications, often paid/manual); https://www.data.gov.in/ (search “fertilizer consumption district”); https://www.fert.nic.in/ |

### 8. Extreme events (drought, flood, cyclone)

| Field | Value |
|---|---|
| Status | **NOT_FOUND** |
| Why unavailable | No event tables |
| Try next | IMD disaster / cyclone archives; NDMA; drought bulletins |
| URLs | https://www.imd.gov.in/ ; https://ndma.gov.in/ ; https://www.data.gov.in/ (search drought / cyclone) |

---

## Immediate engineering actions (no fake data)

1. Create `data/raw/{crop,weather,market,soil,irrigation,inputs,extreme}/` and write **only** official downloads.
2. Add `docs/data_sources.md` with organization, URL, license, retrieval date, and file hash.
3. Add `data/metadata/*.json` with `processing_steps` after any transform.
4. Implement or restore `scripts/validate_data.py` to fail if row counts are zero or years 2015–2025 are missing per state.
5. Fix `src/data_pipeline/README.md` so stub fetchers are not marked working.
6. Do not promote `src/data/terraData.js` or `syntheticHistory()` into the master combined tables.
7. Re-run this post-collection verification after real files appear (including if a parallel collector finishes).
