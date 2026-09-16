# TerraMind-X — Technical Architecture Specification (SIH Grand Finale)

## 1. Architectural Philosophy
TerraMind-X is built upon a strict separation of concerns that ensures complete explainability and auditability:
$$\textbf{Multimodal Telemetry} \longrightarrow \textbf{Deterministic ML/Rule Engine} \longrightarrow \textbf{AI Agronomist Council} \longrightarrow \textbf{Explainability Layer} \longrightarrow \textbf{Farmer Action UI}$$

Raw generative LLMs are never allowed to fabricate agronomic scores, soil pH limits, or mandi prices. Instead, deterministic physics, differential equations, and ground-truth registries govern the decisions, and the AI synthesizes natural multilingual explanations.

```
+-----------------------------------------------------------------------------------+
|                            REACT / PWA FRONTEND                                   |
|   Tailwind CSS  •  Framer Motion  •  Recharts  •  Leaflet GIS  •  Web Speech API  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | REST / JSON
                                          v
+-----------------------------------------------------------------------------------+
|                        FASTAPI API GATEWAY (Python 3.14)                          |
|   Security Headers  •  CORS Whitelist  •  Pydantic v2 Contracts  •  Auth & Logs   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                   LANGGRAPH 5-AGENT DECISION ORCHESTRATOR                         |
|                                                                                   |
|   +-----------------------+     +-----------------------+                         |
|   |  🌱 Soil Guardian    | --> |  🌦 Climate Intel     |                         |
|   |  NBSS&LUP Carbon / pH |     |  NASA POWER & CMIP6   |                         |
|   +-----------------------+     +-----------------------+                         |
|               |                             |                                     |
|               v                             v                                     |
|   +-----------------------+     +-----------------------+                         |
|   |  🌾 Agronomy Agent    | --> |  📈 Market Intel      |                         |
|   |  Phenology & Yield    |     |  AGMARKNET & SIS ODE  |                         |
|   +-----------------------+     +-----------------------+                         |
|               |                             |                                     |
|               +------------+   +------------+                                     |
|                            |   |                                                  |
|                            v   v                                                  |
|                 +-----------------------+                                         |
|                 | 🌍 Sustainability    |                                         |
|                 | FAO-56 Water Footprint|                                         |
|                 +-----------------------+                                         |
|                            |                                                      |
|                            v                                                      |
|                 +-----------------------+                                         |
|                 | 🧠 Decision Consensus |                                         |
|                 | Causal Penalty Engine |                                         |
|                 +-----------------------+                                         |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                    EXPLAINABILITY & MULTILINGUAL ADVISORY                         |
|   NVIDIA NIM Provider  •  Tamil / English / Tanglish  •  Evidence Ledger Trace    |
+-----------------------------------------------------------------------------------+
```

## 2. Core Subsystems

### A. Data Ingestion Tier
1. **AGMARKNET Directorate of Marketing**: Multi-state Mandi pricing across Tamil Nadu and Maharashtra with automated local SQLite/PostgreSQL caching.
2. **NASA POWER Meteorology**: Real-time surface solar radiation, precipitation, and temperature telemetry.
3. **NBSS&LUP Soil Carbon Benchmark**: High-resolution soil pH, organic carbon, and NPK ground-truth benchmarks.
4. **Zenodo CMIP6 Downscaling**: High-resolution climate anomaly models (SSP2-4.5 and SSP5-8.5) predicting drought and extreme heat shifts through 2080.
5. **IoT Hardware Gateway**: ESP32 MQTT/REST gateway receiving physical soil telemetry with automatic simulated fallback.

### B. SIS Crop Diffusion Network (Anti-Herd Engine)
Epidemic-style non-linear differential equation model ($dI/dt = \beta S I - \gamma I$) calculating collective adoption velocity across farming communities. If collective adoption exceeds critical saturation ($R_{crit} = 55\%$), the Decision Engine automatically triggers an oversupply penalty and diverts farmers to high-demand alternative crops.

### C. 5-Agent Council Consensus Protocol
- **Land & Soil Guardian**: Assesses cation exchange capacity, pH buffers, and soil degradation index.
- **Climate Intelligence**: Cross-references precipitation, growing-degree days, and CMIP6 stress projections.
- **Agronomy Agent**: Evaluates phenology cycle, optimal spacing, and seedbed preparation.
- **Market Intelligence**: Evaluates Mandi price trends and festival demand spikes.
- **Sustainability Agent**: Enforces water stewardship and carbon sequestration scoring.

---
