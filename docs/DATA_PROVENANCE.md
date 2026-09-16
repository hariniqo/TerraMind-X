# TerraMind-X Data Provenance & Trust Matrix

Transparency and data integrity are core design pillars of TerraMind-X. All datasets and model predictions display explicit provenance badges in the UI.

---

## 1. Provenance Badges & Tier Definitions

| Badge | Color | Description |
|---|---|---|
| `LIVE` | Emerald / Green | Real-time verified upstream API connection (e.g. live AGMARKNET or NASA POWER fetch). |
| `CACHED` | Blue | High-fidelity persisted cache refreshed within 24 hours. |
| `FALLBACK` | Amber | Localized statistical baseline used when network connection is offline. |
| `SIMULATED` | Purple | Deterministic ODE / synthetic sensor simulation for what-if scenarios or offline testing. |
| `DEMO_DATASET` | Gray | Certified benchmark test scenario dataset for Smart India Hackathon jury review. |

---

## 2. Ingest Data Sources Matrix

### 1. Market Data
- **Source**: AGMARKNET (Directorate of Marketing & Inspection, Ministry of Agriculture & Farmers Welfare, Govt of India).
- **Scope**: Multi-state mandi daily spot prices (Tamil Nadu: Madurai, Dindigul, Coimbatore; Maharashtra: Nashik, Pune, Nagpur).
- **Update Frequency**: Daily sync with SQLite/PostgreSQL caching layer.

### 2. Weather & Climate Telemetry
- **Source**: NASA Prediction of Worldwide Energy Resources (POWER) API.
- **Parameters**: Solar radiation ($MJ/m^2$), precipitation ($mm$), 2m ambient temperature ($^\circ C$), relative humidity ($%$).
- **Resolution**: $0.5^\circ \times 0.5^\circ$ spatial grid.

### 3. Soil Benchmark Datasets
- **Source**: ICAR - National Bureau of Soil Survey and Land Use Planning (NBSS&LUP) & TNAU Agronomy Datasets.
- **Parameters**: Soil taxonomy, Organic Carbon %, Cation Exchange Capacity (CEC), micronutrient availability.

### 4. CMIP6 Climate Downscaling Projections
- **Source**: Zenodo High-Resolution Downscaled CMIP6 Dataset for South Asia.
- **Scenarios**: Shared Socioeconomic Pathways SSP2-4.5 (moderate mitigation) & SSP5-8.5 (high emissions).
- **Projection Windows**: Baseline, 2030, 2050, 2080.

### 5. Sentinel-2 Satellite Spectral Imagery
- **Source**: European Space Agency (ESA) Copernicus Sentinel-2.
- **Parameters**: Normalized Difference Vegetation Index (NDVI) 10m spatial resolution.
