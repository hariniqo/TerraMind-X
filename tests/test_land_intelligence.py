import pytest
import math
from datetime import date
from app.schemas.land_intelligence import (
    CropHistoryEntry,
    FarmLocationInput,
    GeoJSONGeometry,
    LandIntelligenceRequest,
    RiskLevel,
    SatelliteQuality,
    NDVITrendEnum
)
from app.services.gis_service import GISService
from app.services.land_geometry import (
    analyze_farm_boundary,
    calculate_polygon_perimeter_meters,
    calculate_spherical_polygon_area_sq_meters,
    validate_and_repair_polygon_coords
)
from app.services.ndvi_service import (
    calculate_linear_trend,
    get_sentinel_ndvi,
    evaluate_vegetation_condition
)
from app.services.crop_history_service import (
    calculate_rotation_analysis,
    calculate_overcropping_risk,
    get_crop_family
)
from app.services.regional_cultivation_service import (
    calculate_hhi,
    RegionalCultivationService
)
from app.services.land_intelligence_engine import LandIntelligenceEngine
from app.agents.land_agent import land_agent


# 1. Coordinate Validation Tests
def test_coordinate_validation_valid():
    gis = GISService()
    valid, err = gis.validate_coordinates(9.9252, 78.1198)
    assert valid is True
    assert err is None


def test_coordinate_validation_invalid():
    gis = GISService()
    # Out of bounds
    valid, err = gis.validate_coordinates(105.0, 78.0)
    assert valid is False
    assert "Latitude 105.0 out of valid range" in err

    # Non-India coordinate (London)
    valid_india, err_india = gis.validate_coordinates(51.5074, -0.1278)
    assert valid_india is False
    assert "outside the standard India agricultural domain" in err_india


# 2. Polygon Geometry & Geodesic Area Tests
def test_polygon_geodesic_area_and_perimeter():
    # Square ~ 100m x 100m near equator/Tamil Nadu (0.001 deg approx 111m)
    # [lng, lat]
    coords = [
        [78.3325, 9.9820],
        [78.3345, 9.9820],
        [78.3345, 9.9840],
        [78.3325, 9.9840],
        [78.3325, 9.9820]
    ]
    area_sq_m = calculate_spherical_polygon_area_sq_meters(coords)
    perimeter_m = calculate_polygon_perimeter_meters(coords)

    assert area_sq_m > 40000.0  # Approx 4-5 hectares
    assert perimeter_m > 800.0


def test_polygon_repair_open_ring_and_duplicates():
    # Open ring with duplicate adjacent vertex
    coords = [
        [78.3325, 9.9820],
        [78.3325, 9.9820],  # Duplicate
        [78.3345, 9.9820],
        [78.3345, 9.9840],
        [78.3325, 9.9840]   # Not closed
    ]
    repaired, was_repaired, notes = validate_and_repair_polygon_coords(coords)
    assert was_repaired is True
    assert repaired[0] == repaired[-1]  # Closed
    assert len(repaired) == 5  # 4 unique vertices + 1 closing vertex


def test_analyze_farm_boundary_polygon():
    geo = {
        "type": "Polygon",
        "coordinates": [
            [
                [78.3325, 9.9820],
                [78.3340, 9.9825],
                [78.3345, 9.9845],
                [78.3325, 9.9840],
                [78.3325, 9.9820]
            ]
        ]
    }
    analysis = analyze_farm_boundary(
        declared_area_acres=2.5,
        latitude=9.9833,
        longitude=78.3333,
        boundary_geo=geo
    )
    assert analysis.is_valid is True
    assert analysis.status == "BOUNDARY_AVAILABLE"
    assert analysis.calculated_area_acres is not None
    assert analysis.calculated_area_acres > 0
    assert analysis.centroid is not None


# 3. Satellite NDVI Pipeline Tests
def test_linear_trend_calculation():
    dates = ["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"]
    values_increasing = [0.55, 0.62, 0.70, 0.78]
    trend_inc, slope_inc = calculate_linear_trend(dates, values_increasing)
    assert trend_inc == NDVITrendEnum.INCREASING
    assert slope_inc > 0.04

    values_decreasing = [0.78, 0.70, 0.61, 0.52]
    trend_dec, slope_dec = calculate_linear_trend(dates, values_decreasing)
    assert trend_dec == NDVITrendEnum.DECREASING
    assert slope_dec < -0.04


def test_vegetation_condition_classifier():
    assert evaluate_vegetation_condition(0.78) == "DENSE_HEALTHY_VIGOR"
    assert evaluate_vegetation_condition(0.55) == "MODERATE_HEALTHY_GROWTH"
    assert evaluate_vegetation_condition(0.35) == "SPARSE_OR_EARLY_VEGETATION"
    assert evaluate_vegetation_condition(0.20) == "STRESSED_OR_FALLOW_LAND"


@pytest.mark.anyio
async def test_sentinel_ndvi_service_time_series():
    res = await get_sentinel_ndvi(9.9833, 78.3333, "farm_test_01")
    assert res["status"] == "success"
    assert 0.4 <= res["value"] <= 1.0
    assert "time_series" in res
    ts = res["time_series"]
    assert len(ts["observations"]) >= 3
    assert ts["quality_status"] == "VALID"


# 4. Crop History & Rotation Engine Tests
def test_botanical_family_classification():
    assert get_crop_family("Tomato") == "Solanaceae"
    assert get_crop_family("Chilli") == "Solanaceae"
    assert get_crop_family("Groundnut") == "Fabaceae"
    assert get_crop_family("Black Gram") == "Fabaceae"
    assert get_crop_family("Paddy") == "Poaceae"
    assert get_crop_family("Rice") == "Poaceae"


def test_rotation_analysis_healthy_legume_cycle():
    history = [
        CropHistoryEntry(crop="Tomato", season="Kharif", year=2023),
        CropHistoryEntry(crop="Paddy", season="Rabi", year=2023),
        CropHistoryEntry(crop="Black Gram", season="Summer", year=2024),
        CropHistoryEntry(crop="Groundnut", season="Kharif", year=2024)
    ]
    analysis = calculate_rotation_analysis(history, intended_crop="Paddy")
    assert analysis.rotation_score >= 80.0
    assert analysis.legume_in_rotation is True
    assert analysis.risk_level == RiskLevel.LOW


def test_rotation_analysis_monocropping_penalty():
    # 3 consecutive seasons of Tomato (Solanaceae)
    history = [
        CropHistoryEntry(crop="Tomato", season="Kharif", year=2023),
        CropHistoryEntry(crop="Tomato", season="Rabi", year=2023),
        CropHistoryEntry(crop="Tomato", season="Kharif", year=2024)
    ]
    analysis = calculate_rotation_analysis(history, intended_crop="Tomato")
    assert analysis.rotation_score < 55.0
    assert analysis.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert analysis.consecutive_crop_count >= 3


def test_overcropping_risk_evaluation():
    history = [
        CropHistoryEntry(crop="Groundnut", season="Kharif", year=2023),
        CropHistoryEntry(crop="Groundnut", season="Kharif", year=2024),
        CropHistoryEntry(crop="Groundnut", season="Rabi", year=2024)
    ]
    overcrop = calculate_overcropping_risk("Groundnut", history)
    assert overcrop.risk_level == RiskLevel.HIGH
    assert overcrop.consecutive_seasons == 3
    assert len(overcrop.recommended_rotation_crops) > 0


# 5. Regional Cultivation & HHI Concentration Tests
def test_hhi_calculation():
    # Diversified: 5 equal crops of 20% -> HHI = 5 * 400 = 2000
    shares_div = [20.0, 20.0, 20.0, 20.0, 20.0]
    assert calculate_hhi(shares_div) == 2000.0

    # Highly Concentrated: 1 dominant crop 80%, two 10% -> 6400 + 100 + 100 = 6600
    shares_conc = [80.0, 10.0, 10.0]
    assert calculate_hhi(shares_conc) == 6600.0


@pytest.mark.anyio
async def test_regional_cultivation_service():
    service = RegionalCultivationService()
    conc = await service.get_regional_crop_concentration(
        state="Tamil Nadu",
        district="Madurai"
    )
    assert conc.dominant_crop == "Paddy"
    assert conc.herfindahl_index > 0
    assert len(conc.crops) >= 3
    assert conc.data_level_used == "District"


# 6. Full Land Intelligence Engine End-to-End Test
@pytest.mark.anyio
async def test_land_intelligence_engine_full_flow():
    engine = LandIntelligenceEngine()
    req = LandIntelligenceRequest(
        farm_id="farm_pilot_99",
        farm_name="Melur Test Plot",
        declared_area_acres=2.5,
        location=FarmLocationInput(
            latitude=9.9833,
            longitude=78.3333,
            village="Melur",
            district="Madurai",
            state="Tamil Nadu"
        ),
        boundary=GeoJSONGeometry(
            type="Polygon",
            coordinates=[
                [
                    [78.3325, 9.9820],
                    [78.3340, 9.9825],
                    [78.3345, 9.9845],
                    [78.3325, 9.9840],
                    [78.3325, 9.9820]
                ]
            ]
        ),
        current_crop="Groundnut",
        crop_history=[
            CropHistoryEntry(crop="Tomato", season="Kharif", year=2024),
            CropHistoryEntry(crop="Tomato", season="Rabi", year=2024),
            CropHistoryEntry(crop="Black Gram", season="Summer", year=2025)
        ]
    )

    resp = await engine.analyze(req)
    assert resp.farm_id == "farm_pilot_99"
    assert resp.boundary.is_valid is True
    assert resp.satellite_ndvi.current_ndvi is not None
    assert resp.rotation_analysis.rotation_score > 60.0
    assert resp.regional_concentration.herfindahl_index > 0
    assert len(resp.structured_evidence) >= 4
    assert resp.confidence.overall_confidence > 75.0
    assert resp.data_quality.overall_quality_score > 75.0


# 7. Agent Integration & Council State Compatibility
def test_upgraded_land_agent_council_node():
    state = {
        "crop": "groundnut",
        "latitude": 9.9252,
        "longitude": 78.1198,
        "district": "Madurai",
        "state": "Tamil Nadu",
        "features": {},
        "climate_data": {
            "status": "available",
            "projection": {"temp_anomaly_c": 0.8}
        },
        "crop_data": [
            {"crop": "Tomato", "season": "Kharif", "year": 2024},
            {"crop": "Black Gram", "season": "Rabi", "year": 2024}
        ]
    }
    result = land_agent(state)
    assert "land_suitability" in result
    suit = result["land_suitability"]
    assert "score" in suit
    assert "evidence" in suit
    assert "intelligence" in suit
    assert suit["score"] is not None
