# TERRAMIND-X: MASTER ENTERPRISE ARCHITECTURE

**System Version:** v2.0.0-Enterprise  
**Classification:** Enterprise Agricultural Intelligence & Decision Orchestration  
**Status:** Validated / Production Candidate  

---

## 1. System Overview

TerraMind-X is an enterprise-grade agricultural decision support platform designed to provide smallholder farmers, agribusinesses, and cooperatives with actionable, conflict-resolved agronomic, market, sustainability, and hardware-verified crop directives.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  - Web Command Console (React 18 + Vite + Tailwind/Vanilla CSS + Lucide + Recharts)
|  - Progressive Web App (PWA) Offline Shell & Service Worker                       |
|  - Enterprise Farm Audit Printable Engine (/reports/print)                       |
|  - Multi-Lingual Advisory Dispatch (English, Tamil, Marathi WhatsApp Intent)      |
+-----------------------------------------------------------------------------------+
                                         │ HTTPS / WSS
                                         ▼
+-----------------------------------------------------------------------------------+
|                                 GATEWAY & API LAYER                               |
|  - FastAPI Asynchronous Framework (Lifespan Handlers, CORS, Security Headers)   |
|  - Rate Limiting, Input Sanitization, Geometric Bounds Validation                |
|  - Standardized JSON Response Wrappers with Machine-Readable Contracts           |
+-----------------------------------------------------------------------------------+
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
+──────────────────+           +──────────────────+           +──────────────────+
| DOMAIN AGENTS    |           | HARDWARE / IOT   |           | STORAGE & ENGINE |
| 1. Land Agent    |           | - ESP32 Gateway  |           | - SQLite/Asyncpg |
| 2. Soil Agent    |           | - Calibration    |           | - GIS Engine     |
| 3. Market Agent  |           | - Anomaly Filter |           | - Quality Audit  |
| 4. Sustain Agent |           | - Deduplication  |           | - Historical Log |
+──────────────────+           +──────────────────+           +──────────────────+
        │                                │                                │
        └────────────────────────────────┬────────────────────────────────┘
                                         ▼
+-----------------------------------------------------------------------------------+
|                        CENTRAL DECISION ORCHESTRATOR                              |
|  - Multi-Agent Contract Aggregator & Confidence Normalizer                       |
|  - Deterministic Conflict Detection Engine (Soil vs Market, Water vs Crop)       |
|  - Normalized Multi-Criteria Evidence Weighting Matrix                           |
|  - 3-Tier Temporal Action Formulation (Immediate 24-48h, 7-Day, Seasonal)        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1 The 6-Agent Coordination Matrix

| Agent | Core Responsibilities | Upstream Data Providers | Contract Schema |
| :--- | :--- | :--- | :--- |
| **1. Land Intelligence** | Parcel polygon area, geodetic coordinates, Sentinel-2 Level-2A NDVI vigor, crop rotation history, HHI crop concentration. | ESA Copernicus Sentinel-2, OpenStreetMap GIS, Indian District Boundaries | `app.schemas.land_intelligence.LandIntelligenceResponse` |
| **2. Soil Intelligence** | Soil pH, SOC (Organic Carbon %), NPK fertility, electrical conductivity, degradation risk, soil amendments. | ICAR-NBSS&LUP Soil Profiles, Soil Health Card Records | `app.schemas.soil_intelligence.SoilHealthResponse` |
| **3. Market Intelligence** | Observed mandi spot prices, 30-day forecast projection, price volatility, oversupply risk (SIS), mandi arrival volume. | AGMARKNET, Ministry of Agriculture & Farmers Welfare, OGD India | `app.schemas.market_intelligence.MarketAnalysisResponse` |
| **4. Sustainability** | FAO-56 crop water demand, seasonal evapotranspiration, drip irrigation efficiency index, Verra VM0042 Tier 1 carbon metrics. | FAO Irrigation Water Paper 56, IPCC Tier 1 Soil Carbon Guidelines | `app.schemas.sustainability.SustainabilityResponse` |
| **5. Hardware / IoT Gateway** | ESP32 telemetry ingestion, dielectric soil moisture, electrode temperature, battery/link health, physical bounds validation. | Sub-field ESP32 IoT Probes, MQTT / HTTP Rest Telemetry | `app.schemas.agent_contracts.AgentContractResponse` |
| **6. Central Orchestrator** | Multi-agent synthesis, conflict detection & resolution, explainable trust, structured 3-tier action plans, multilingual advisory. | Synthesizes Agents 1–5 | `app.schemas.agent_contracts.OrchestratedDecisionResponse` |

---

## 3. Hardware Abstraction Layer & IoT Pipeline

Real ESP32 hardware and future LoRaWAN/MQTT gateways connect through a decoupled sensor abstraction pipeline:

```
[ Field Sensor Probe ] ──(ADC/I2C)──> [ ESP32 Microcontroller ]
                                              │ HTTP POST / MQTT
                                              ▼
                                 [ /api/v1/devices/{id}/telemetry ]
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                   [ Physical Bounds Check ]         [ Duplicate Filter ]
                   (moisture: 0-100%, pH: 3-11)      (within 10-30s window)
                              │                               │
                              └───────────────┬───────────────┘
                                              ▼
                                 [ SQLite / PostgreSQL DB ]
                                 (SensorTelemetryRecord)
                                              │
                                              ▼
                                  [ Soil Agent / Orchestrator ]
```

---

## 4. Multi-Tenant Farm & Device Database Schema

The database model is built on SQLAlchemy 2.0 Async with SQLite (local development) and PostgreSQL/TimescaleDB (cloud production) compatibility:
- `FarmProfileRecord` (`farm_profiles`): `farm_id` (PK), `farmer_name`, `state`, `district`, `village`, `latitude`, `longitude`, `area_acres`, `soil_type`, `current_crop`, `irrigation_type`, `water_source`.
- `SensorDeviceRecord` (`sensor_devices`): `device_id` (PK), `farm_id` (FK), `device_name`, `hardware_model`, `firmware_version`, `status`, `battery_level_pct`, `calibration_metadata`, `last_seen`.
- `SensorTelemetryRecord` (`sensor_telemetry`): `id` (PK, Auto), `device_id` (FK), `farm_id` (FK), `sensor_type`, `value`, `unit`, `source_type`, `is_outlier`, `quality_score`, `timestamp`.
- `OrchestratorDecisionRecord` (`orchestrator_decisions`): `decision_id` (PK), `farm_id` (FK), `primary_crop`, `composite_score`, `overall_confidence`, `risk_level`, `conflicts_detected`, `immediate_actions`, `long_term_actions`, `raw_audit_payload`.
