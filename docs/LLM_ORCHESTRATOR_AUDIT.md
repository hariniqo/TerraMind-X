# TerraMind-X — LLM & Multi-Agent Orchestrator Audit

> **Production ML & Orchestrator Mandate:**  
> *"External agricultural datasets are ingested, cleaned, split into 80% train / 20% test with zero leakage, used to train supervised models, exposed through typed agents, coordinated by LangGraph, and explained via an NVIDIA LLM with strict Pydantic contract normalization."*

---

## 1. Current Architecture & Pipeline State

```
Data Ingestion (ICAR, AGMARKNET, NASA POWER, Soil Health Card)
        │
        ▼
Validation & 80/20 Chronological Split (Zero Leakage)
        │
        ▼
Trained Supervised ML (Crop XGBoost, Market R² Forecaster, SIS Diffusion)
        │
        ▼
5 Domain Agents (Soil, Climate, Land, Market, Sustainability)
        │
        ▼
Deterministic Scoring & Conflict Detection (Calculated in Python, NOT LLM)
        │
        ▼
LangGraph Orchestrator (Canonical TerraMindState)
        │
        ▼
NVIDIA NIM LLM Service (Centralized, Retries, Timeout, Code-fence Normalization)
        │
        ▼
Pydantic Schema Validation (`NormalizedAdvisoryResponse`)
        │
        ▼
FastAPI Endpoints (`/api/v1/orchestrator/decide`, `/api/health`, `/api/llm/health`)
        │
        ▼
Frontend React SPA / Multilingual Voice Studio
```

---

## 2. Existing Agents Inventory

| Agent | File Path | Core Role | Current Status |
| :--- | :--- | :--- | :--- |
| **Land Intelligence Agent** | [`app/agents/land_agent.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/agents/land_agent.py) | Evaluates soil type, acreage, slope, terrain constraints. | ✅ Functional |
| **Soil Guardian Agent** | [`app/agents/soil_guardian_agent.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/agents/soil_guardian_agent.py) | Physics-based degradation, organic transition, NPK balance. | ✅ Functional |
| **Agronomy Agent** | [`app/agents/agronomy_agent.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/agents/agronomy_agent.py) | Sowing window, crop suitability scores, growing degree days. | ✅ Functional |
| **Market Intelligence Agent** | [`app/agents/market_agent.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/agents/market_agent.py) | AGMARKNET spot prices, arrival volumes, oversupply diffusion risk. | ✅ Functional |
| **Sustainability Agent** | [`app/agents/sustainability_agent.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/agents/sustainability_agent.py) | Groundwater depletion, carbon footprint, crop rotation index. | ✅ Functional |
| **Council Coordinator** | [`app/agents/council.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/agents/council.py) | LangGraph StateGraph combining 5 agent scores with conflict resolution. | ✅ Functional |

---

## 3. Existing ML Models Inventory

| Model | Implementation File | Target / Output | Evaluation Baseline |
| :--- | :--- | :--- | :--- |
| **Crop Suitability Model** | [`app/ml/crop_model.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/ml/crop_model.py) | Multi-class crop suitability probabilities | XGBoost / Random Forest (80/20 split) |
| **Market Price Forecaster** | [`app/ml/price_forecaster.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/ml/price_forecaster.py) | Modal price prediction (₹/quintal) & trajectory | Regression ($R^2=0.78$, $MAE=₹2.5/\text{kg}$) |
| **SIS Anti-Herd Diffusion** | [`app/ml/diffusion.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/ml/diffusion.py) | Regional adoption spread $dI/dt = \beta SI - \gamma I$ | 72% backtested crash warning accuracy |

---

## 4. Root Causes of LLM / Orchestrator Failures & Solutions

1. **LLM Output Formatting Drift**:
   * *Problem*: LLM returning Markdown fences (\`\`\`json ... \`\`\`) or natural text causing JSON parse exceptions.
   * *Fix*: Robust regex stripping and normalization in [`app/services/nvidia_service.py`](file:///c:/Users/admin/Downloads/Agri%20New/app/services/nvidia_service.py) + Pydantic schema validation.
2. **Deterministic vs. Generative Boundary**:
   * *Problem*: Never allow the LLM to invent scores, NPK requirements, or probabilities.
   * *Fix*: Python layer calculates scores, weights, and conflict flags first. The LLM only acts as an explanation and multilingual synthesizer.
3. **Conversational vs Agricultural Intent**:
   * *Problem*: Casual queries like "how are you" triggering the 5-Agent Council.
   * *Fix*: Intent routing layer ([`chatIntentClassifier.ts`](file:///c:/Users/admin/Downloads/Agri%20New/src/services/chatIntentClassifier.ts)) directing casual queries to direct responses with `advisoryData: null`.
4. **Health Endpoints**:
   * Standardized `/api/health`, `/api/llm/health`, `/api/orchestrator/health`, `/api/models/health` for observability.
