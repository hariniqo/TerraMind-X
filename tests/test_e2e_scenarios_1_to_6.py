import pytest
from app.agents.council import CouncilOrchestrator
from app.agents.agronomy_agent import agronomy_agent
from app.services.soil_service import SoilService
from app.services.market_service import MarketService
from app.services.weather_service import WeatherService
from app.services.ndvi_service import get_sentinel_ndvi

# -----------------------------------------------------------------------------
# Scenario 1: Soil-based Recommendation
# -----------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_1_soil_based_recommendation():
    soil_service = SoilService()
    # Red Loam soil in Madurai with optimal pH 6.8
    soil_profile = soil_service.get_soil_data(
        location="Madurai, Tamil Nadu",
        crop="Groundnut",
        ph=6.8,
        nitrogen=45.0,
        phosphorus=22.0,
        potassium=35.0,
        organic_carbon=0.68
    )
    assert soil_profile is not None
    assert soil_profile.get("ph") == 6.8
    assert soil_profile.get("status") == "available"
    assert soil_profile.get("nitrogen") == 45.0

# -----------------------------------------------------------------------------
# Scenario 2: Market Intelligence Pipeline
# -----------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_2_market_intelligence():
    market_service = MarketService()
    market_data = await market_service.get_market_data("Tomato", "Madurai", "Tamil Nadu")
    assert market_data is not None
    assert "status" in market_data
    assert "confidence" in market_data
    if market_data.get("live_price") is not None:
        assert market_data["live_price"] > 0
    if market_data.get("modal_price") is not None:
        assert market_data["modal_price"] > 0

# -----------------------------------------------------------------------------
# Scenario 3: Agronomy Multi-Crop Advisory
# -----------------------------------------------------------------------------
def test_scenario_3_agronomy_recommendation():
    state = {
        "crop": "Groundnut",
        "soil_type": "Red Loam",
        "ph": 6.5,
        "temperature": 29.0,
        "rainfall": 800.0,
        "humidity": 70.0,
        "season": "Kharif",
        "location": "Madurai, Tamil Nadu",
        "nitrogen": 42.0,
        "phosphorus": 25.0,
        "potassium": 38.0
    }
    res = agronomy_agent(state)
    assert res is not None
    assert "agronomy_plan" in res
    plan = res["agronomy_plan"]
    assert plan is not None
    assert "suitability_score" in plan or "confidence_score" in plan or "sowing_window" in plan or "fertilizer_plan" in plan

# -----------------------------------------------------------------------------
# Scenario 4: Weather & Anomaly Handling
# -----------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_4_weather_pipeline():
    weather_service = WeatherService()
    weather = await weather_service.get_weather_data(9.9252, 78.1198)
    assert weather is not None
    assert "temperature" in weather
    assert "rainfall" in weather
    assert "humidity" in weather
    assert weather["temperature"] is not None
    assert weather["rainfall"] >= 0.0

# -----------------------------------------------------------------------------
# Scenario 5: Satellite / NDVI Time-Series & Data Status Classification
# -----------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_5_satellite_ndvi():
    ndvi_res = await get_sentinel_ndvi(9.9833, 78.3333, "farm_pilot_scenario5")
    assert ndvi_res["status"] == "success"
    assert 0.0 <= ndvi_res["value"] <= 1.0
    assert "time_series" in ndvi_res
    ts = ndvi_res["time_series"]
    assert ts["provider"] in ["Sentinel-2 MSI Level-2A", "Sentinel-2 MSI Level-2A (ESA / Copernicus)"]
    assert ts["quality_status"] in ["VALID", "LOW_QUALITY", "MISSING"]
    assert ts["is_real_data"] in [True, False]
    assert ndvi_res["vegetation_condition"] in [
        "DENSE_HEALTHY_VIGOR",
        "MODERATE_HEALTHY_GROWTH",
        "SPARSE_OR_EARLY_VEGETATION",
        "STRESSED_OR_FALLOW_LAND",
        "BARREN_OR_WATER_SURFACE"
    ]

# -----------------------------------------------------------------------------
# Scenario 6: Multi-Agent Council & Conflict Resolution
# -----------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_6_multi_agent_council():
    orchestrator = CouncilOrchestrator()
    input_state = {
        "crop": "Groundnut",
        "latitude": 9.9833,
        "longitude": 78.3333,
        "district": "Madurai",
        "state": "Tamil Nadu",
        "season": "Kharif",
        "soil_data": {
            "ph": 6.8,
            "organic_carbon": 0.65,
            "nitrogen": 48.0,
            "phosphorus": 24.0,
            "potassium": 38.0,
            "moisture": 28.0
        },
        "weather_data": {
            "temperature": 29.5,
            "rainfall": 60.0,
            "humidity": 65.0
        },
        "crop_data": [
            {"crop": "Tomato", "season": "Kharif", "year": 2024},
            {"crop": "Black Gram", "season": "Rabi", "year": 2024}
        ]
    }
    
    final_output = await orchestrator.run(input_state)
    assert final_output is not None
    assert "recommendation" in final_output
    rec = final_output["recommendation"]
    assert rec is not None
    assert "crop" in rec
    assert rec["crop"].lower() == "groundnut"
    
    audit = final_output.get("decision_audit") or final_output.get("audit")
    assert audit is not None
