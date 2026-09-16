# TERRAMIND-X: DATA PROVENANCE & NON-FABRICATION POLICY

**Policy Document:** DP-POL-2026-V2  
**Classification:** Enterprise Data Governance & Truth Invariants  
**Effective Date:** August 26, 2026  

---

## 1. Core Non-Fabrication Invariants

TerraMind-X operates under strict data integrity mandates to ensure farmer livelihood safety and institutional trust:

1. **No Simulated Data Disguised as Live Telemetry**:
   Every data point consumed or displayed must declare its strict origin tier. If no physical IoT node is connected to a farm, the UI and API explicitly tag the reading as `DEMO / SIMULATION MODE` and apply a confidence score penalty.
2. **Strict Separation of Observed Mandi Prices vs 30-Day Forecasts**:
   Observed spot prices from AGMARKNET are never mixed with statistical or ML price projections. Reports explicitly label historical spot records as `OBSERVED REAL-TIME MANDI PRICE` and projections as `30-DAY STATISTICAL FORECAST (ESTIMATE)`.
3. **No Unsubstantiated Accuracy Claims**:
   Confidence metrics represent explainable multi-factor evidence sums (data completeness, data freshness, sensor calibration, and cross-agent consensus), never arbitrary marketing percentages.
4. **Transparent Carbon Credit Calculations**:
   All carbon sequestration numbers are declared as preliminary calculations adhering to IPCC Tier 1 and Verra VM0042 methodology guidelines with documented baseline audit notes.

---

## 2. 5-Tier Data Provenance Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LIVE VERIFIED DATA                                       │
│    - ESP32 Sub-Field Sensor Telemetry (passed bounds check) │
│    - Sentinel-2 Level-2A surface reflectance within 5 days  │
├─────────────────────────────────────────────────────────────┤
│ 2. RECENT EXTERNAL DATA                                     │
│    - AGMARKNET daily mandi records (< 48 hours)             │
│    - NASA POWER / IMD weather observations (< 24 hours)     │
├─────────────────────────────────────────────────────────────┤
│ 3. VERIFIED HISTORICAL DATA                                 │
│    - ICAR-NBSS&LUP Soil Resource Mapping Datasets           │
│    - Regional 10-Year Mandi Seasonality Patterns            │
├─────────────────────────────────────────────────────────────┤
│ 4. USER VERIFIED INPUT                                      │
│    - Laboratory Soil Health Card physical slip input        │
│    - Farmer declared parcel boundary coordinates & acreage  │
├─────────────────────────────────────────────────────────────┤
│ 5. DEMO / SIMULATION DATA                                   │
│    - Synthetic fallback when external network is offline    │
│    - Clearly labelled in UI with warning banners            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Source Catalog

| Data Domain | Official Provider | Geographical Granularity | Refresh Frequency | Provenance Key |
| :--- | :--- | :--- | :--- | :--- |
| **Vegetation Vigor & NDVI** | European Space Agency (ESA) Copernicus Sentinel-2 MSI | $10\,\text{m} \times 10\,\text{m}$ Parcel Level | 5 Days | `satellite_ndvi` |
| **Wholesale Mandi Prices** | Ministry of Agriculture & Farmers Welfare / AGMARKNET | APMC Mandi / District | Daily | `observed_price` |
| **Soil Properties & Nutrients** | ICAR-NBSS&LUP & Soil Health Card Scheme | Sub-District / Benchmark Grid | Seasonal / Annual | `soil_profile` |
| **Crop Water Requirements** | FAO Irrigation & Drainage Paper 56 (Allen et al.) | Agro-Climatic Zone | Standard Reference | `fao_56_benchmark` |
| **Microclimate & Soil Physics** | TerraMind ESP32 Agro Sensor Nodes | In-Situ Sub-Field Probe | 15 Minutes | `iot_telemetry` |
