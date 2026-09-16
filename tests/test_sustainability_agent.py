import pytest
from app.schemas.sustainability import (
    SustainabilityInput,
    FarmLocationInput,
    SoilInput,
    CropInput,
    WaterInput,
    FarmManagementInput,
    ClimateInput,
    SatelliteInput,
    IrrigationMethod,
    RiskLevel,
    CarbonEstimateStatus,
    SequestrationCategory,
    CreditEligibilityStatus,
    DataLevel
)
from app.services.sustainability_engine import SustainabilityEngine
from app.services.maharashtra_sustainability_service import MaharashtraSustainabilityService
from app.config.sustainability_sources import (
    SUSTAINABILITY_SOURCES_CATALOG,
    EMISSION_FACTORS,
    MAHARASHTRA_CROP_WATER_REQUIREMENTS_M3_PER_HA,
    IRRIGATION_EFFICIENCY_BENCHMARKS
)
from app.agents.soil_sustainability_agent import soil_sustainability_agent


# -----------------------------------------------------------------------------
# 1. Soil Organic Carbon (SOC) Tests
# -----------------------------------------------------------------------------

def test_soil_organic_carbon_single_observation():
    engine = SustainabilityEngine()
    soil = SoilInput(organic_carbon_pct=0.68, ph=7.2)
    res = engine.evaluate_soil_organic_carbon(soil, "Pune")
    
    assert res.status == "AVAILABLE"
    assert res.current_carbon_pct == 0.68
    assert res.carbon_status == "MEDIUM"
    assert res.carbon_trend == "INSUFFICIENT_OBSERVATIONS"
    assert res.previous_carbon_pct is None
    assert res.confidence == 0.85


def test_soil_organic_carbon_multi_temporal_trend():
    engine = SustainabilityEngine()
    soil = SoilInput(
        organic_carbon_pct=0.74,
        previous_organic_carbon_pct=0.62,
        soil_test_date="2026-06-10",
        previous_soil_test_date="2023-05-15"
    )
    res = engine.evaluate_soil_organic_carbon(soil, "Nashik")
    
    assert res.status == "AVAILABLE"
    assert res.current_carbon_pct == 0.74
    assert res.previous_carbon_pct == 0.62
    assert res.absolute_change_pct == 0.12
    assert res.percentage_change == 19.35
    assert res.carbon_trend == "IMPROVING"
    assert res.confidence == 0.94


def test_soil_organic_carbon_missing():
    engine = SustainabilityEngine()
    soil = SoilInput(organic_carbon_pct=None)
    res = engine.evaluate_soil_organic_carbon(soil, "Solapur")
    
    assert res.status == "DATA_UNAVAILABLE"
    assert res.current_carbon_pct is None
    assert res.carbon_status == "UNKNOWN"
    assert res.carbon_trend == "UNKNOWN"
    assert res.confidence <= 0.50


# -----------------------------------------------------------------------------
# 2. Soil Degradation Risk Tests
# -----------------------------------------------------------------------------

def test_soil_degradation_high_risk_acidification_and_monoculture():
    engine = SustainabilityEngine()
    soil = SoilInput(ph=4.8, organic_carbon_pct=0.35, soil_texture="Sandy Loam")
    crop = CropInput(current_crop="Cotton", crop_rotation_history=["Cotton", "Cotton", "Cotton"])
    mgmt = FarmManagementInput(residue_management="Burned", tillage_practice="Conventional")
    climate = ClimateInput(rainfall_mm=160.0)
    
    res = engine.evaluate_soil_degradation_risk(soil, crop, mgmt, climate, "Yavatmal")
    
    assert res.risk_level == RiskLevel.HIGH
    assert res.soil_degradation_risk is not None
    assert res.soil_degradation_risk > 0.55
    assert any("acidification" in d.lower() for d in res.drivers)
    assert any("burning" in d.lower() for d in res.drivers)
    assert any("monocropping" in d.lower() for d in res.drivers)


def test_soil_degradation_low_risk_regenerative_practices():
    engine = SustainabilityEngine()
    soil = SoilInput(ph=7.2, organic_carbon_pct=0.82, soil_texture="Clay / Black Cotton (Vertisol)")
    crop = CropInput(current_crop="Soybean", crop_rotation_history=["Cotton", "Chickpea (Gram)", "Jowar"])
    mgmt = FarmManagementInput(
        residue_management="Incorporated / Mulched",
        tillage_practice="Minimum / Reduced",
        organic_manure_tonnes=5.0
    )
    climate = ClimateInput(rainfall_mm=60.0)
    
    res = engine.evaluate_soil_degradation_risk(soil, crop, mgmt, climate, "Kolhapur")
    
    assert res.risk_level == RiskLevel.LOW
    assert res.soil_degradation_risk is not None
    assert res.soil_degradation_risk < 0.35


# -----------------------------------------------------------------------------
# 3. Water Intelligence & Irrigation Analysis Tests
# -----------------------------------------------------------------------------

def test_water_sustainability_drip_vs_flood():
    engine = SustainabilityEngine()
    crop = CropInput(current_crop="Sugarcane", yield_quintals_per_acre=450.0)
    climate = ClimateInput(rainfall_mm=80.0)
    
    # Drip
    water_drip = WaterInput(irrigation_type=IrrigationMethod.DRIP, irrigation_quantity_m3=14000.0)
    res_drip = engine.evaluate_water_sustainability(water_drip, crop, climate, "Pune")
    
    # Flood
    water_flood = WaterInput(irrigation_type=IrrigationMethod.FLOOD, irrigation_quantity_m3=24000.0)
    res_flood = engine.evaluate_water_sustainability(water_flood, crop, climate, "Pune")
    
    assert res_drip.water_efficiency_pct == 88.0
    assert res_flood.water_efficiency_pct == 42.0
    assert res_flood.savings_opportunity is not None
    assert "drip" in res_flood.savings_opportunity.lower()
    assert res_drip.water_productivity_kg_per_m3 is not None
    assert res_drip.water_productivity_kg_per_m3 > res_flood.water_productivity_kg_per_m3


def test_water_sustainability_missing_water_quantity():
    engine = SustainabilityEngine()
    crop = CropInput(current_crop="Cotton")
    climate = ClimateInput(rainfall_mm=None)
    water = WaterInput(irrigation_type=IrrigationMethod.SPRINKLER, irrigation_quantity_m3=None)
    
    res = engine.evaluate_water_sustainability(water, crop, climate, "Wardha")
    
    assert res.status == "DATA_UNAVAILABLE"
    assert res.water_used_m3_per_ha is None
    assert res.water_productivity_kg_per_m3 is None
    assert res.water_efficiency_pct == 72.0  # Method benchmark only
    assert res.confidence < 0.50


# -----------------------------------------------------------------------------
# 4. Crop Rotation & Agricultural Biodiversity Tests
# -----------------------------------------------------------------------------

def test_crop_rotation_diversity_and_legume_inclusion():
    engine = SustainabilityEngine()
    crop = CropInput(
        current_crop="Wheat",
        crop_rotation_history=["Soybean", "Chickpea (Gram)", "Sorghum (Jowar)"]
    )
    mgmt = FarmManagementInput(cover_crop_grown=True)
    
    rot, bio = engine.evaluate_crop_rotation_and_biodiversity(crop, mgmt, "Ahmednagar")
    
    assert rot.rotation_score is not None
    assert rot.rotation_score >= 75.0
    assert rot.legume_inclusion is True
    assert rot.unique_botanical_families >= 2
    assert rot.repeated_crop_penalty == 0.0
    assert bio.status == "DIVERSIFIED"
    assert bio.indicator_score >= 70.0


def test_crop_rotation_monoculture_penalty():
    engine = SustainabilityEngine()
    crop = CropInput(
        current_crop="Sugarcane",
        crop_rotation_history=["Sugarcane", "Sugarcane", "Sugarcane"]
    )
    mgmt = FarmManagementInput(cover_crop_grown=False)
    
    rot, bio = engine.evaluate_crop_rotation_and_biodiversity(crop, mgmt, "Kolhapur")
    
    assert rot.rotation_score is not None
    assert rot.rotation_score < 50.0
    assert rot.repeated_crop_penalty >= 25.0
    assert rot.risk == RiskLevel.HIGH
    assert bio.status == "MONOCULTURE_DOMINANT"


# -----------------------------------------------------------------------------
# 5. Carbon Footprint & Sequestration Tests
# -----------------------------------------------------------------------------

def test_carbon_footprint_calculation():
    engine = SustainabilityEngine()
    mgmt = FarmManagementInput(
        nitrogen_applied_kg=50.0,
        phosphorus_applied_kg=25.0,
        potassium_applied_kg=15.0,
        diesel_used_litres=30.0,
        electricity_used_kwh=100.0,
        residue_management="Incorporated"
    )
    water = WaterInput(irrigation_type=IrrigationMethod.DRIP)
    
    res = engine.evaluate_carbon_footprint(mgmt, water, "Pune")
    
    assert res.status == CarbonEstimateStatus.COMPLETE
    assert res.estimated_emissions_kg_co2e_per_ha is not None
    # 50*4.88 (244) + 25*1.12 (28) + 15*0.68 (10.2) + 30*2.68 (80.4) + 100*0.82 (82) = ~444.6 kg CO2e
    assert 400.0 <= res.estimated_emissions_kg_co2e_per_ha <= 500.0
    assert res.confidence >= 0.85
    assert len(res.emission_factors_used) >= 4


def test_carbon_footprint_missing_inputs():
    engine = SustainabilityEngine()
    mgmt = FarmManagementInput(nitrogen_applied_kg=None, diesel_used_litres=None)
    water = WaterInput()
    
    res = engine.evaluate_carbon_footprint(mgmt, water, "Nagpur")
    
    assert res.status == CarbonEstimateStatus.CARBON_ESTIMATE_INCOMPLETE
    assert res.estimated_emissions_kg_co2e_per_ha is None
    assert res.confidence <= 0.40


def test_carbon_sequestration_and_credit_claims_restriction():
    engine = SustainabilityEngine()
    soil = SoilInput(organic_carbon_pct=0.72)
    mgmt = FarmManagementInput(
        organic_manure_tonnes=6.0,
        tillage_practice="Minimum Tillage",
        residue_management="Mulched",
        cover_crop_grown=True
    )
    
    footprint = engine.evaluate_carbon_footprint(mgmt, WaterInput(), "Amravati")
    seq = engine.evaluate_carbon_sequestration(soil, mgmt, "Amravati")
    credit = engine.evaluate_carbon_credit_eligibility(footprint, seq, mgmt)
    
    assert seq.status == SequestrationCategory.MODELLED
    assert seq.sequestration_rate_t_co2e_per_ha_yr is not None
    assert seq.sequestration_rate_t_co2e_per_ha_yr > 0.5
    
    # CRITICAL RULE: Tradable credits claimed MUST be strictly 0.0
    assert credit.tradable_credits_claimed == 0.0
    assert credit.potential_eligibility == CreditEligibilityStatus.PRELIMINARY_ONLY
    assert len(credit.required_data_for_verification) >= 3
    assert "no tradable carbon credit" in credit.disclaimer.lower()


# -----------------------------------------------------------------------------
# 6. Climate Resilience & CMIP6 Tests
# -----------------------------------------------------------------------------

def test_climate_resilience_vidarbha_vs_konkan():
    engine = SustainabilityEngine()
    
    # Vidarbha
    res_vid = engine.evaluate_climate_resilience(ClimateInput(scenario="ssp245", projection_period="2050"), "Nagpur")
    assert res_vid.drought_risk == RiskLevel.HIGH
    assert res_vid.temp_anomaly_c is not None
    assert res_vid.temp_anomaly_c > 1.0
    assert any("drought" in a.lower() or "bbf" in a.lower() or "shettale" in a.lower() for a in res_vid.adaptation_priorities)
    
    # Konkan
    res_kon = engine.evaluate_climate_resilience(ClimateInput(scenario="ssp245", projection_period="2050"), "Ratnagiri")
    assert res_kon.excess_rainfall_risk == RiskLevel.HIGH
    assert res_kon.precip_anomaly_pct is not None
    assert res_kon.precip_anomaly_pct > 5.0


# -----------------------------------------------------------------------------
# 7. Geographic Fallback Hierarchy Tests
# -----------------------------------------------------------------------------

def test_geographic_fallback_village_to_state():
    engine = SustainabilityEngine()
    
    # Village level
    inp_v = SustainabilityInput(
        farm=FarmLocationInput(village="Baramati Rural", taluka="Baramati", district="Pune")
    )
    res_v = engine.analyze(inp_v)
    assert res_v.data_level_used == DataLevel.VILLAGE
    
    # Taluka level
    inp_t = SustainabilityInput(
        farm=FarmLocationInput(village=None, taluka="Haveli", district="Pune")
    )
    res_t = engine.analyze(inp_t)
    assert res_t.data_level_used == DataLevel.TALUKA
    
    # District level
    inp_d = SustainabilityInput(
        farm=FarmLocationInput(village=None, taluka=None, district="Nashik")
    )
    res_d = engine.analyze(inp_d)
    assert res_d.data_level_used == DataLevel.DISTRICT


# -----------------------------------------------------------------------------
# 8. All 36 Maharashtra Districts Coverage Test
# -----------------------------------------------------------------------------

def test_all_maharashtra_districts_summary():
    service = MaharashtraSustainabilityService()
    districts = service.get_all_maharashtra_districts_summary()
    
    assert len(districts) >= 35
    district_names = set(d["district"] for d in districts)
    assert "Pune" in district_names
    assert "Nashik" in district_names
    assert "Nagpur" in district_names
    assert "Kolhapur" in district_names
    assert "Solapur" in district_names
    assert "Amravati" in district_names
    assert "Nanded" in district_names
    assert "Ratnagiri" in district_names


# -----------------------------------------------------------------------------
# 9. No Fake Data & Graceful Degradation Tests
# -----------------------------------------------------------------------------

def test_no_fake_data_empty_input_degradation():
    engine = SustainabilityEngine()
    empty_input = SustainabilityInput(
        farm=FarmLocationInput(district="Dhule"),
        soil=SoilInput(),
        crop=CropInput(),
        water=WaterInput(),
        management=FarmManagementInput(),
        climate=ClimateInput()
    )
    
    res = engine.analyze(empty_input)
    
    assert res.soil_carbon.status == "DATA_UNAVAILABLE"
    assert res.soil_carbon.current_carbon_pct is None
    assert res.water_sustainability.status == "DATA_UNAVAILABLE"
    assert res.water_sustainability.water_used_m3_per_ha is None
    assert res.carbon_footprint.status == CarbonEstimateStatus.CARBON_ESTIMATE_INCOMPLETE
    assert res.carbon_footprint.estimated_emissions_kg_co2e_per_ha is None
    assert res.score_confidence_pct < 50.0


# -----------------------------------------------------------------------------
# 10. LangGraph Soil Sustainability Agent Node Test
# -----------------------------------------------------------------------------

def test_langgraph_soil_sustainability_agent_node():
    state = {
        "crop": "Soybean",
        "state": "Maharashtra",
        "district": "Pune",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "soil_data": {
            "ph": 7.1,
            "organic_carbon": 0.70,
            "nitrogen": 190.0,
            "phosphorus": 24.0,
            "potassium": 280.0,
            "moisture": 32.0
        },
        "weather_data": {
            "rainfall": 55.0,
            "temperature": 28.5
        },
        "climate_data": {
            "status": "available",
            "projection": {
                "temp_anomaly_c": 1.1,
                "precip_change_pct": 3.5,
                "extreme_events_frequency": 2
            }
        },
        "agronomy_plan": {
            "irrigation_action": "Apply Drip irrigation scheduled every 4 days."
        }
    }
    
    node_out = soil_sustainability_agent(state)
    
    assert "soil_sustainability" in node_out
    ss = node_out["soil_sustainability"]
    assert ss["soil_status"] == "available"
    assert ss["sustainability_score"] is not None
    assert ss["degradation_index"] is not None
    assert ss["carbon_status"] in ["MEDIUM", "HIGH"]
    assert ss["carbon_credit_status"] == "PRELIMINARY_ONLY"
    assert len(ss["sustainability_actions"]) > 0
