# TerraMind-X API Reference

TerraMind-X exposes an enterprise-grade RESTful API powered by FastAPI, with asynchronous database sessions and deterministic validation.

---

## Base URL
```
http://localhost:8000/api/v1
```

---

## 1. Central Decision Orchestrator
### `POST /orchestrator/decide`
Executes full 5-Agent Council coordination, conflict resolution, oversupply risk penalty, and returns the final sowing decision.

**Request Body:**
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

**Response (200 OK):**
```json
{
  "decision_id": "dec-9b4c-20260901",
  "recommended_crop": "Onion (Bellary)",
  "suitability_score": 88.5,
  "oversupply_risk_score": 24.5,
  "consensus_status": "UNANIMOUS",
  "agent_scores": {
    "soil_guardian": 88.0,
    "climate_intelligence": 82.0,
    "agronomy": 91.0,
    "market_intelligence": 84.0,
    "sustainability": 89.0
  },
  "tamil_advisory": "மண் மற்றும் சந்தை நிலவரப்படி இந்த பருவத்திற்கு வெங்காயம் மிகவும் உகந்தது.",
  "tanglish_advisory": "Soil pH nalla iruku, market oversupply risk kamiya iruku, onion podalam.",
  "provenance_tier": "LIVE"
}
```

---

## 2. Market Intelligence & Mandi Pricing
### `GET /market/prices/live`
Retrieves live & cached AGMARKNET mandi spot prices across Tamil Nadu & Maharashtra.

**Query Parameters:**
- `state` (optional): `Tamil Nadu` | `Maharashtra`
- `district` (optional): e.g. `Madurai`, `Nashik`, `Pune`
- `commodity` (optional): e.g. `Onion`, `Cotton`, `Tomato`

### `POST /market/what-if`
Runs the SIS differential epidemiological crop diffusion model to evaluate oversupply risk and price crash probabilities.

---

## 3. Soil & Geospatial Intelligence
### `POST /land-intelligence/analyze`
Processes farm boundary coordinates, Sentinel-2 NDVI spectral trends, and NBSS&LUP soil carbon benchmarks.

### `GET /soil/profile`
Returns soil health metrics ($pH$, Organic Carbon %, $N$, $P$, $K$, Soil Degradation Index).

---

## 4. Weather & CMIP6 Climate Downscaling
### `GET /weather/forecast`
Fetches NASA POWER meteorological telemetry and solar radiation data.

### `GET /climate/projections`
Fetches Zenodo downscaled CMIP6 climate anomaly projections for 2030, 2050, and 2080 (SSP2-4.5 & SSP5-8.5).

---

## 5. System Observability & Health Center
### `GET /health/agents`
Returns real-time telemetry, latency (ms), and data provenance badges across all 8 subsystems.
