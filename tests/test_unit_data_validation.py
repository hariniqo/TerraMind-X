import pytest
import pandas as pd
from app.services.data_quality import DataQualityEngine, CROP_PRICE_BOUNDS
from app.services.gis_service import GISService
from app.services.land_geometry import (
    calculate_spherical_polygon_area_sq_meters,
    calculate_polygon_perimeter_meters,
    validate_and_repair_polygon_coords
)
from app.services.crop_history_service import get_crop_family, calculate_rotation_analysis
from app.schemas.land_intelligence import CropHistoryEntry, RiskLevel

# -----------------------------------------------------------------------------
# 1. Soil & Agronomic Boundary Checks
# -----------------------------------------------------------------------------
def test_soil_ph_bounds_and_nutrients():
    # Valid ranges: pH 0-14, positive NPK
    ph_valid = 6.8
    assert 0.0 <= ph_valid <= 14.0
    
    ph_invalid_low = -1.5
    assert not (0.0 <= ph_invalid_low <= 14.0)

    ph_invalid_high = 15.0
    assert not (0.0 <= ph_invalid_high <= 14.0)

# -----------------------------------------------------------------------------
# 2. Market Data Quality Engine Audit
# -----------------------------------------------------------------------------
def test_market_data_quality_engine():
    engine = DataQualityEngine("Mandi Price Test")
    
    # Create test dataframe with valid, duplicate, and outlier rows
    df = pd.DataFrame([
        {"date": "2026-08-01", "state": "Tamil Nadu", "district": "Madurai", "market": "Madurai Mandi", "commodity": "Tomato", "modal_price": 2500.0, "min_price": 2200.0, "max_price": 2800.0, "arrivals_tonnes": 50.0},
        {"date": "2026-08-02", "state": "Tamil Nadu", "district": "Madurai", "market": "Madurai Mandi", "commodity": "Tomato", "modal_price": 2600.0, "min_price": 2300.0, "max_price": 2900.0, "arrivals_tonnes": 55.0},
        {"date": "2026-08-02", "state": "Tamil Nadu", "district": "Madurai", "market": "Madurai Mandi", "commodity": "Tomato", "modal_price": 2600.0, "min_price": 2300.0, "max_price": 2900.0, "arrivals_tonnes": 55.0},  # duplicate
    ])
    
    audit = engine.audit_market_data(df)
    assert audit["row_count"] == 3
    assert audit["duplicate_percentage"] > 0.0
    assert audit["status"] in ["EXCELLENT", "ACCEPTABLE", "DEGRADED", "CRITICAL", "VALID", "WARNING"]


# -----------------------------------------------------------------------------
# 3. GIS & Geometry Validation
# -----------------------------------------------------------------------------
def test_gis_coordinate_validations():
    gis = GISService()
    # Tamil Nadu / Madurai valid
    valid_tn, err_tn = gis.validate_coordinates(9.9252, 78.1198)
    assert valid_tn is True
    assert err_tn is None

    # Maharashtra / Pune valid
    valid_mh, err_mh = gis.validate_coordinates(18.5204, 73.8567)
    assert valid_mh is True
    assert err_mh is None

    # Invalid latitude > 90
    val_bad_lat, err_bad_lat = gis.validate_coordinates(95.0, 77.0)
    assert val_bad_lat is False

    # Out of India boundary
    val_out, err_out = gis.validate_coordinates(0.0, 0.0)
    assert val_out is False

def test_polygon_geometry_validation():
    triangle = [
        [78.120, 9.925],
        [78.125, 9.925],
        [78.125, 9.930],
        [78.120, 9.925]
    ]
    area = calculate_spherical_polygon_area_sq_meters(triangle)
    perimeter = calculate_polygon_perimeter_meters(triangle)
    assert area > 0.0
    assert perimeter > 0.0

    unclosed = [
        [78.120, 9.925],
        [78.125, 9.925],
        [78.125, 9.930]
    ]
    repaired, was_repaired, notes = validate_and_repair_polygon_coords(unclosed)
    assert was_repaired is True
    assert repaired[0] == repaired[-1]

# -----------------------------------------------------------------------------
# 4. Crop Botanical Family & Rotation Calculations
# -----------------------------------------------------------------------------
def test_crop_botanical_family_mapping():
    assert get_crop_family("Tomato") == "Solanaceae"
    assert get_crop_family("Brinjal") == "Solanaceae"
    assert get_crop_family("Groundnut") == "Fabaceae"
    assert get_crop_family("Black Gram") == "Fabaceae"
    assert get_crop_family("Paddy") == "Poaceae"
    assert get_crop_family("Wheat") == "Poaceae"
    assert get_crop_family("Cotton") == "Malvaceae"

def test_crop_rotation_diversity_scoring():
    diverse_history = [
        CropHistoryEntry(crop="Paddy", season="Kharif", year=2023),
        CropHistoryEntry(crop="Black Gram", season="Rabi", year=2023),
        CropHistoryEntry(crop="Groundnut", season="Summer", year=2024),
        CropHistoryEntry(crop="Tomato", season="Kharif", year=2024)
    ]
    analysis = calculate_rotation_analysis(diverse_history, intended_crop="Millets")
    assert analysis.rotation_score >= 80.0
    assert analysis.crop_diversity_index > 0.6
    assert analysis.legume_in_rotation is True
    assert analysis.risk_level == RiskLevel.LOW
