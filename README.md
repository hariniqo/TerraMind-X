# TerraMind-X — AI-Powered Pre-Sowing Agricultural Decision Intelligence Platform

> **SIH Grand Finale Quality Benchmark**  
> *"ML/Rules Decide → AI Explains → UI Visualizes → Farmer Acts"*

TerraMind-X is an enterprise-grade agricultural decision-intelligence platform built for smallholder farmers and regional agricultural authorities. Before a single seed is sown, the platform analyzes soil chemistry, meteorology, high-resolution CMIP6 climate projections, AGMARKNET market demand, and collective herd-planting behavior to generate **explainable, risk-calibrated crop recommendations**.

---

## 🌟 Key Differentiators & Features

1. **Pre-Sowing Decision Command Center**:
   - Answers **"What should I plant and why?"** before planting.
   - Outputs: Primary Recommended Crop, Resilience Alternative, Suitability Score, Market Realization, Oversupply Risk, and Decision Confidence.
2. **SIS Crop Diffusion & Anti-Herd Oversupply Engine**:
   - Non-linear epidemiological network model ($dI/dt = \beta S I - \gamma I$) calculating collective farmer adoption velocity.
   - Dynamically penalizes suitability when regional saturation exceeds critical thresholds ($R_{crit} = 55\%$) to prevent catastrophic price crashes.
3. **LangGraph 5-Agent AI Agronomist Council**:
   - 🌱 **Soil Guardian Agent**: pH buffers, organic carbon, and degradation hazard index.
   - 🌦 **Climate Intelligence Agent**: NASA POWER telemetry + Zenodo CMIP6 downscaling up to 2080.
   - 🌾 **Agronomy Agent**: Spacing, phenology cycles, and trained XGBoost yield models ($R^2 = 0.912$).
   - 📈 **Market Intelligence Agent**: AGMARKNET multi-state Mandi price discovery.
   - 🌍 **Sustainability Agent**: FAO-56 crop water footprint and carbon sequestration credits.
4. **Interactive What-If Counterfactual Simulator (`/what-if`)**:
   - Real-time stress testing against rainfall anomalies ($\pm 50\%$), heatwaves ($+1\text{--}4^\circ\text{C}$), price swings ($\pm 40\%$), and regional cultivation shifts.
   - Side-by-side comparison of **Current Baseline** vs **Simulated Stress Decision** with automated rank inversion explanations.
5. **Explainability & Sensitivity Layer**:
   - Every recommendation explains **"WHY was this recommended?"** with ground-truth evidence and **"WHAT COULD CHANGE THIS DECISION?"** triggers.
6. **Multilingual & Voice Interaction**:
   - Supports natural Tamil (தமிழ்), English, Thanglish, and Marathi (मराठी) with Web Speech API integration.
7. **Transparent Data Provenance**:
   - Every metric displays verification provenance tags (`LIVE`, `CACHED`, `FALLBACK`, `SIMULATED`, `DEMO_DATASET`).
8. **System Health & Observability (`/system-status`)**:
   - Real-time uptime, latency, and error-rate monitoring across all 9 infrastructure tiers.

---

## 🏗️ Technical Architecture

```
React 18 / Vite PWA (TypeScript + Tailwind CSS + Leaflet GIS + Recharts)
                            |
                            v
       FastAPI ASGI Web Gateway (Pydantic v2 + Security Headers)
                            |
                            v
   LangGraph 5-Agent Council Orchestrator (Soil, Climate, Agronomy, Market, Sustainability)
                            |
                            v
         Deterministic Decision Engine & Causal Oversupply Penalty
                            |
                            v
     Explainability & Multilingual Advisory Layer (NVIDIA NIM / Local Rule Fallback)
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### 1. Backend Setup
```bash
# Clone the repository
git clone <repo-url>
cd "Agri New"

# Create and activate Python virtual environment
python -m venv .venv
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

### Run Backend Test Suite (202 Passing Tests)
```bash
.\.venv\Scripts\python.exe -m pytest -v
```

### Run Frontend Production Build & Typecheck
```bash
npm run build
```

---

## 📚 Project Documentation

- [Technical Architecture](docs/ARCHITECTURE.md)
- [Product Engineering Audit](docs/PRODUCT_AUDIT.md)
- [SIH Grand Finale Demo & Evaluation Guide](docs/DEMO_GUIDE.md)
- [Data Provenance & Ingestion](TERRAMIND-X-DATA-PROVENANCE.md)
- [API Contract Specification](TERRAMIND-X-API-CONTRACT.md)
- [Security & Compliance Audit](TERRAMIND-X-SECURITY-AUDIT.md)
- [Multi-State AGMARKNET Integration](docs/AGMARKNET_MULTISTATE_INTEGRATION.md)
- [Zenodo Climate Dataset Specification](docs/zenodo_climate_dataset.md)

---

## ⚖️ Quality & Verification Checklist

- [x] No broken routes or 404s
- [x] Strict separation: ML/Rules decide $\rightarrow$ AI explains
- [x] 202 backend tests passing with zero errors
- [x] Zero TypeScript compilation errors
- [x] Transparent data provenance on all metrics
- [x] Route-based code-splitting with React.lazy
- [x] Interactive What-If counterfactual simulator
- [x] SIH Demo mode with 3 pre-configured judge scenarios
- [x] Full platform status & health monitor at `/system-status`
