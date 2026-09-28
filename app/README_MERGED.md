# TerraMind-X Merged Project

This project combines **Namma** (Base44-based agricultural intelligence platform) with **TerraMind-X** (provenance-first data architecture with GIS capabilities) to create a comprehensive agricultural intelligence system.

## 🎯 What Was Merged

### Base Project: Namma
- React frontend with Base44 integration
- FastAPI backend with agent-based ML system
- Agricultural data analysis and decision engine
- Real-time market data processing

### Integrated: TerraMind-X
- **Provenance-First Data Architecture**: Every data point has documented source and verification status
- **Advanced GIS Capabilities**: PostGIS integration for spatial analysis of farms, markets, and weather
- **Robust Ingestion Framework**: Production-ready data pipeline with validation and quality control
- **Time-Series Processing**: Advanced aggregation and forecasting capabilities

## 🏗️ Project Structure

```
TerraMind-X-Merged/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── agents/            # ML agents (from Namma)
│   │   ├── api/
│   │   │   ├── routes/        # Namma API routes
│   │   │   ├── gis.py         # TerraMind-X GIS API
│   │   │   ├── market.py      # TerraMind-X market API
│   │   │   └── ...            # Additional APIs
│   │   ├── models/            # TerraMind-X provenance models
│   │   │   ├── provenance.py  # Core provenance tracking
│   │   │   ├── location.py    # Geographic hierarchy
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── ingestion/     # TerraMind-X ingestion framework
│   │   │   ├── validation/    # Data quality validators
│   │   │   ├── gis/           # GIS spatial services
│   │   │   └── ...
│   │   ├── db/
│   │   │   └── models.py      # Namma comprehensive models
│   │   └── main_merged.py     # Merged FastAPI entry point
│   ├── alembic/               # Database migrations
│   └── requirements.txt       # Combined dependencies
├── src/                       # React frontend (from Namma)
├── base44/                    # Base44 configuration
├── data/                      # Data storage directory
├── MERGE_REPORT.md            # Detailed merge documentation
└── README_MERGED.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL with PostGIS extension
- Base44 CLI (`npm install -g base44@latest`)
- Deno (for Base44 local backend)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

5. **Set up database**
   ```bash
   # Ensure PostgreSQL with PostGIS is running
   alembic upgrade head
   ```

6. **Run backend**
   ```bash
   uvicorn app.main_merged:app --reload --port 8000
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Base44**
   ```bash
   base44 login    # One-time per machine
   base44 link     # One-time per clone
   base44 dev      # Start local backend + frontend
   ```

3. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## 🔑 Key Features

### Provenance-First Data Architecture
- **Source Tracking**: Every data point has documented source (GOVERNMENT_API, RESEARCH_PAPER, etc.)
- **Verification Status**: VERIFIED, UNVERIFIED, DISPUTED, UNAVAILABLE
- **Data Classification**: OBSERVED, DERIVED, FORECAST, UNAVAILABLE
- **Quality Scoring**: Data quality scores for filtering and prioritization

### Advanced GIS Capabilities
- **Geographic Hierarchy**: Village → Taluk → District → State → Country
- **Spatial Queries**: Distance calculations, radius searches, boundary analysis
- **Farm Mapping**: GPS coordinates and boundary polygons
- **Market Analysis**: Nearest market calculations and transport cost estimation

### Robust Data Pipeline
- **Chunked Processing**: Handle large files without memory issues
- **Validation Framework**: Automatic data quality checks
- **Error Handling**: Retry with backoff, quarantine of bad data
- **Audit Trail**: Complete tracking of data ingestion runs

### Time-Series Analysis
- **Multiple Aggregations**: Daily, weekly, monthly, seasonal, yearly
- **Statistical Functions**: Mean, median, min, max, std dev, CoV
- **Trend Analysis**: Moving averages, volatility, price changes
- **Forecasting**: ML-based price and crop yield predictions

## 📊 API Endpoints

### Core Namma Endpoints
- `GET /health` - Health check
- `GET /api/v1/analyze/*` - Analysis endpoints
- `GET /api/v1/market/*` - Market data
- `GET /api/v1/agents/*` - Agent orchestration
- `POST /api/v1/ingestion/*` - Data ingestion
- `GET /api/v1/models/*` - ML model endpoints

### TerraMind-X Additional Endpoints (To be integrated)
- `GET /api/v1/gis/*` - GIS spatial queries
- `GET /api/v1/soil/*` - Soil data with provenance
- `GET /api/v1/weather/*` - Weather observations
- `GET /api/v1/crops/*` - Crop reference data
- `GET /api/v1/buyers/*` - Buyer information
- `GET /api/v1/cultivation/*` - Cultivation records
- `GET /api/v1/forecasts/*` - Forecast outputs

## 🔧 Configuration

### Environment Variables

Key environment variables needed in `.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/terramind_merged

# API Configuration
API_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# External APIs
OPEN_METEO_API_KEY=
AGMARKNET_API_KEY=
NASA_POWER_API_KEY=
SOILGRIDS_API_KEY=

# Base44
BASE44_APP_ID=
BASE44_API_KEY=

# Scheduler
SCHEDULER_ENABLED=true

# Development
APP_ENV=development
DEMO_MODE=false
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
npm test
```

### Integration Tests
```bash
# Test data ingestion
python -m scripts.ingest.run_weather_ingest --location-id <uuid> --lat 9.4392 --lon 78.0862

# Test GIS queries
curl http://localhost:8000/api/v1/gis/nearby-markets?lat=9.4392&lon=78.0862&radius=50
```

## 📈 Next Steps for Full Integration

1. **Database Schema Unification**
   - Merge Namma models with TerraMind-X provenance system
   - Add provenance mixin to existing Namma models
   - Create unified Alembic migrations

2. **Complete API Integration**
   - Uncomment and integrate TerraMind-X API routes in `main_merged.py`
   - Update frontend to use new GIS and provenance endpoints
   - Ensure consistent API versioning and documentation

3. **Frontend Enhancements**
   - Add GIS visualization components (maps, spatial overlays)
   - Implement provenance display in data tables
   - Create data quality dashboards
   - Add real-time data ingestion monitoring

4. **Performance Optimization**
   - Implement database indexing for GIS queries
   - Add caching for frequently accessed data
   - Optimize large file processing pipelines

5. **Documentation**
   - Update API documentation with merged endpoints
   - Create user guides for new GIS features
   - Document provenance tracking workflow

## 🤝 Contributing

This is a merged project combining two agricultural intelligence platforms. When contributing:

1. **Maintain Provenance Standards**: All new data models must include provenance tracking
2. **GIS First**: Consider spatial aspects of any new feature
3. **Data Quality**: Implement validation for all data ingestion
4. **Documentation**: Update docs for any new features

## 📄 License

This project combines components from both Namma and TerraMind-X projects. Refer to individual project licenses for specific component licensing.

## 🆘 Support

For issues specific to:
- **Base44 Integration**: https://docs.db.com/developers/
- **TerraMind-X Architecture**: See `MERGE_REPORT.md`
- **Namma Platform**: See original Namma documentation

---

**Status**: 🟡 Integration Phase - Core structure merged, API integration in progress

**Version**: 2.0.0-merged