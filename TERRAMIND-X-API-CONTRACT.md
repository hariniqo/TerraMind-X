# TERRAMIND-X: API CONTRACT & SPECIFICATION

**API Version:** `v1` (Base URL: `/api/v1`)  
**Specification Standard:** OpenAPI 3.1.0  
**Transport:** JSON over HTTPS  

---

## 1. Authentication & Security Headers

All responses include enterprise security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 2. Core API Endpoints

### 2.1 Central Orchestrator
- **`POST /api/v1/orchestrator/decide`**
  - **Description**: Synthesizes Land, Soil, Market, Sustainability, and IoT telemetry into a conflict-resolved decision.
  - **Request Body**:
    ```json
    {
      "farm_id": "farm-01",
      "district": "Madurai",
      "state": "Tamil Nadu",
      "crop": "Groundnut",
      "latitude": 9.9252,
      "longitude": 78.1198,
      "area_acres": 2.4
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "decision_id": "TMX-DEC-A1B2C3D4",
      "status": "DECISION_FINALIZED",
      "timestamp": "2026-08-26T12:00:00Z",
      "primary_recommendation": {
        "crop": "Groundnut",
        "composite_score": 88.5,
        "suitability_score": 86.0,
        "soil_compatibility_score": 90.0,
        "market_opportunity_score": 85.0,
        "sustainability_score": 88.0,
        "risk_level": "LOW",
        "why_recommended": "Optimal multi-agent balance..."
      },
      "conflict_resolution": {
        "conflicts_count": 0,
        "conflicts": [],
        "status": "NO_CONFLICTS_DETECTED"
      },
      "action_plan": {
        "immediate_actions": ["Seed treatment with bio-fungicide 24h before sowing..."],
        "operational_actions_7d": ["Complete field laser leveling..."],
        "long_term_actions": ["Legume crop rotation in succeeding cycle..."]
      },
      "confidence": {
        "overall_score": 0.88,
        "confidence_tier": "HIGH",
        "confidence_reasons": ["Sentinel-2 NDVI verified", "AGMARKNET mandi price verified"],
        "missing_data_requirements": []
      }
    }
    ```

- **`GET /api/v1/orchestrator/decision/{farm_id}`**
  - Fetches the active decision for a farm parcel.

- **`GET /api/v1/orchestrator/history/{farm_id}`**
  - Replays historical decision audits for seasonal retrospective review.

### 2.2 Hardware / IoT Gateway
- **`POST /api/v1/devices/register`**: Registers an ESP32 or LoRa sensor node with calibration metadata.
- **`GET /api/v1/devices`**: Lists all registered IoT sensor nodes.
- **`GET /api/v1/devices/{device_id}`**: Retrieves device calibration, firmware, and telemetry status.
- **`POST /api/v1/devices/{device_id}/telemetry`**: Ingests sub-hourly soil and microclimate readings with physical bounds validation and duplicate protection.
- **`GET /api/v1/sensors/readings?farm_id={farm_id}`**: Fetches recent validated sensor timeseries.

### 2.3 Farm Profiles & History
- **`GET /api/v1/farms`**: Lists all managed farm parcels.
- **`GET /api/v1/farms/{farm_id}`**: Retrieves parcel geometry, soil baseline, and farmer metadata.
- **`POST /api/v1/farms`**: Creates a new verified farm parcel profile.

### 2.4 Enterprise Reports & Multilingual Advisory
- **`GET /api/v1/reports/{farm_id}`**: Compiles full multi-agent audit data packet.
- **`GET /api/v1/reports/{farm_id}/pdf`**: Generates high-fidelity PDF farm audit certificate.
- **`GET /api/v1/reports/{farm_id}/whatsapp?language={en|ta|mr}`**: Formats farmer-friendly WhatsApp advisory intent payload.

### 2.5 Observability & Agent Health
- **`GET /api/v1/health/agents`**: Real-time latency, data freshness, and operational status of all 6 agents.
