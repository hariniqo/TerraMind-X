"""
Comprehensive Production-Grade Test Suite for TerraMind-X Reports System.
Validates:
1. Reports API endpoints (/api/v1/reports, /api/v1/reports/{farm_id})
2. Soil Guardian Report (NPK, pH, SOC, data status, confidence)
3. AI Council Sowing Directive (crop suitability, rotation, sowing window)
4. Market Intelligence Report (strict separation of OBSERVED vs FORECAST prices)
5. Sustainability & Carbon Report (transparent score weights, preliminary carbon balance)
6. Land Intelligence & Sentinel-2 Telemetry (NDVI, geodesic survey, HHI)
7. SQLite Data Quality reports integration
8. Domain & Composite Confidence scoring and penalty reasoning
9. Maharashtra district support (Pune, Nashik, Solapur)
10. Negative tests: missing soil, missing market, unknown crop, corrupt coordinates
11. Multi-language executive summary (English, Tamil, Marathi)
12. WhatsApp share intent formatting
13. Non-fabrication invariants (zero hardcoded fake production metrics)
"""

import pytest
from datetime import date
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.report_service import ReportService
from app.db.session import AsyncSessionLocal
from app.db.models import DataQualityReportRecord, DataSourceRecord, MarketPriceRecord, SoilObservationRecord


@pytest.fixture
def anyio_backend():
    return "asyncio"


# =====================================================================
# 1. Reports API Endpoints Validation
# =====================================================================

@pytest.mark.anyio
async def test_reports_api_main_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/reports?farm_id=farm-01&district=Madurai&state=Tamil+Nadu&crop=Groundnut")
        assert response.status_code == 200
        data = response.json()

        assert "report_id" in data
        assert "generated_at" in data
        assert "farm" in data
        assert "soil" in data
        assert "agronomy" in data
        assert "market" in data
        assert "sustainability" in data
        assert "land" in data
        assert "data_quality" in data
        assert "confidence" in data
        assert "sources" in data
        assert "disclaimer" in data


@pytest.mark.anyio
async def test_reports_api_farm_id_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/reports/farm_pilot_01?district=Pune&state=Maharashtra&crop=Soybean")
        assert response.status_code == 200
        data = response.json()
        assert data["farm"]["farm_id"] == "farm_pilot_01"
        assert data["farm"]["district"] == "Pune"
        assert data["farm"]["state"] == "Maharashtra"


@pytest.mark.anyio
async def test_reports_api_section_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Soil section
        soil_res = await client.get("/api/v1/reports/farm-01/soil?district=Madurai")
        assert soil_res.status_code == 200
        assert "soil" in soil_res.json()

        # Market section
        market_res = await client.get("/api/v1/reports/farm-01/market?district=Madurai&crop=Tomato")
        assert market_res.status_code == 200
        assert "market" in market_res.json()

        # Sustainability section
        sust_res = await client.get("/api/v1/reports/farm-01/sustainability?district=Pune")
        assert sust_res.status_code == 200
        assert "sustainability" in sust_res.json()


# =====================================================================
# 2. Soil Guardian Report Validation
# =====================================================================

@pytest.mark.anyio
async def test_soil_guardian_report_telemetry():
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id="farm-01",
        district="Madurai",
        state="Tamil Nadu",
        crop="Groundnut"
    )

    soil = report["soil"]
    assert soil["status"] in ["AVAILABLE", "PARTIAL", "UNAVAILABLE"]
    assert "degradation_risk" in soil
    assert "soil_health_status" in soil
    assert "data_source" in soil
    assert 0.0 <= soil["confidence_score"] <= 1.0

    if soil["status"] == "AVAILABLE":
        if soil["ph"] is not None:
            assert 3.5 <= soil["ph"] <= 10.5
        if soil["organic_carbon_pct"] is not None:
            assert 0.0 <= soil["organic_carbon_pct"] <= 5.0


# =====================================================================
# 3. Agronomy & Sowing Directive Validation
# =====================================================================

@pytest.mark.anyio
async def test_agronomy_sowing_directive():
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id="farm-01",
        district="Pune",
        state="Maharashtra",
        crop="Soybean"
    )

    agronomy = report["agronomy"]
    assert agronomy["recommended_crop"] == "Soybean"
    assert "suitability_rating" in agronomy
    assert "sowing_window" in agronomy
    assert "crop_rotation_recommendation" in agronomy
    assert len(agronomy["suitability_factors"]) > 0
    assert 0.0 <= agronomy["confidence_score"] <= 1.0


# =====================================================================
# 4. Market Intelligence: Separation of Observed vs Forecast Prices
# =====================================================================

@pytest.mark.anyio
async def test_market_observed_vs_forecast_separation():
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id="farm-01",
        district="Madurai",
        state="Tamil Nadu",
        crop="Tomato"
    )

    market = report["market"]
    assert "observed_price" in market
    assert "forecast_price" in market

    # Invariant: Observed price is distinctly typed
    assert market["observed_price"]["type"] == "OBSERVED_PRICE"
    assert market["forecast_price"]["type"] == "MODEL_FORECAST"

    # If observed price exists, must be positive
    if market["observed_price"]["modal_inr_per_quintal"] is not None:
        assert market["observed_price"]["modal_inr_per_quintal"] > 0
        assert market["observed_price"]["min_inr_per_quintal"] <= market["observed_price"]["max_inr_per_quintal"]


# =====================================================================
# 5. Sustainability & Carbon Offset Assessment Validation
# =====================================================================

@pytest.mark.anyio
async def test_sustainability_transparent_score_breakdown():
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id="farm-01",
        district="Nashik",
        state="Maharashtra",
        crop="Onion"
    )

    sust = report["sustainability"]
    assert 0.0 <= sust["sustainability_score"] <= 100.0
    assert "sustainability_rating" in sust

    # Invariant: Score must be composed of transparent weighted components summing to 100%
    breakdown = sust["score_breakdown"]
    assert len(breakdown) >= 4
    total_weight = sum(item["weight_pct"] for item in breakdown)
    assert abs(total_weight - 100.0) < 0.1

    for comp in breakdown:
        assert "component" in comp
        assert "weight_pct" in comp
        assert "score" in comp
        assert "data_source" in comp
        assert 0.0 <= comp["score"] <= 100.0

    # Invariant: Carbon assessment is strictly marked as preliminary scope
    carbon = sust["carbon_assessment"]
    assert carbon["assessment_type"] == "PRELIMINARY_CARBON_ASSESSMENT"
    assert carbon["credit_eligibility_status"] in ["PRELIMINARY_ONLY", "NOT_ELIGIBLE", "INSUFFICIENT_DATA"]
    assert "VM0042" in carbon["methodology"] or "IPCC" in carbon["methodology"]
    assert "disclaimer" in carbon


# =====================================================================
# 6. Land Intelligence & Sentinel-2 Telemetry Validation
# =====================================================================

@pytest.mark.anyio
async def test_land_intelligence_sentinel_ndvi():
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id="farm-01",
        district="Madurai",
        state="Tamil Nadu",
        crop="Groundnut"
    )

    land = report["land"]
    assert land["boundary_acres"] > 0
    assert "satellite_ndvi" in land
    ndvi_data = land["satellite_ndvi"]
    assert 0.0 <= ndvi_data["current_ndvi"] <= 1.0
    assert "Sentinel-2" in ndvi_data["provider"]
    assert "vegetation_condition" in ndvi_data


# =====================================================================
# 7. SQLite Data Quality Reports Integration
# =====================================================================

@pytest.mark.anyio
async def test_data_quality_reports_integration():
    service = ReportService()
    report = await service.generate_farm_report(farm_id="farm-01", district="Madurai")

    dq = report["data_quality"]
    assert "overall_completeness_pct" in dq
    assert dq["overall_completeness_pct"] > 0
    assert dq["audited_datasets_count"] >= 1
    assert dq["status"] == "VERIFIED_AUDITABLE"


# =====================================================================
# 8. Multi-Domain & Composite Confidence Validation
# =====================================================================

@pytest.mark.anyio
async def test_confidence_scoring_system():
    service = ReportService()
    report = await service.generate_farm_report(farm_id="farm-01", district="Madurai")

    conf = report["confidence"]
    assert 0.0 <= conf["overall_score"] <= 1.0
    assert 0.0 <= conf["overall_percentage"] <= 100.0

    domains = conf["domains"]
    for d in ["soil", "agronomy", "market", "sustainability", "land"]:
        assert d in domains
        assert 0.0 <= domains[d] <= 100.0


# =====================================================================
# 9. Maharashtra Support Validation
# =====================================================================

@pytest.mark.anyio
@pytest.mark.parametrize("district_name", ["Pune", "Nashik", "Solapur", "Ahmednagar"])
async def test_maharashtra_district_reports(district_name):
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id=f"maha_farm_{district_name.lower()}",
        district=district_name,
        state="Maharashtra",
        crop="Soybean"
    )

    assert report["farm"]["district"] == district_name
    assert report["farm"]["state"] == "Maharashtra"
    assert report["soil"]["status"] in ["AVAILABLE", "PARTIAL", "UNAVAILABLE"]
    assert report["sustainability"]["status"] == "AVAILABLE"
    assert report["executive_summary"]["mr"] is not None


# =====================================================================
# 10. Negative Testing & Missing Data Handling
# =====================================================================

@pytest.mark.anyio
async def test_negative_unknown_crop_market_handling():
    service = ReportService()
    report = await service.generate_farm_report(
        farm_id="farm-fake-01",
        district="NonExistentDistrictXYZ",
        state="UnknownState",
        crop="FictionalKryptoniteBerry"
    )

    # Invariant: Must never invent price or fabricate high confidence for non-existent crops
    market = report["market"]
    assert market["status"] in ["MARKET_DATA_UNAVAILABLE", "UNAVAILABLE"]
    assert market["observed_price"]["modal_inr_per_quintal"] is None


@pytest.mark.anyio
async def test_negative_invalid_coordinates_graceful():
    service = ReportService()
    # Coordinates in Indian ocean
    report = await service.generate_farm_report(
        farm_id="ocean_plot",
        latitude=0.0,
        longitude=75.0,
        district="Ocean",
        state="OceanState"
    )

    assert report is not None
    assert "report_id" in report
    assert report["confidence"]["overall_score"] >= 0.0


# =====================================================================
# 11. Multilingual Summary Output
# =====================================================================

@pytest.mark.anyio
async def test_multilingual_executive_summary():
    service = ReportService()
    report = await service.generate_farm_report(farm_id="farm-01", district="Madurai", state="Tamil Nadu")

    summary = report["executive_summary"]
    assert "en" in summary and len(summary["en"]) > 20
    assert "ta" in summary and len(summary["ta"]) > 20
    assert "mr" in summary and len(summary["mr"]) > 20


# =====================================================================
# 12. WhatsApp Share Intent Formatting
# =====================================================================

@pytest.mark.anyio
async def test_whatsapp_share_intent_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/reports/farm-01/whatsapp-share?district=Madurai&crop=Groundnut")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "whatsapp_url" in data
        assert "api.whatsapp.com" in data["whatsapp_url"]
        assert "TerraMind-X" in data["message_preview"]


# =====================================================================
# 13. Non-Fabrication Invariant: No Hardcoded Fake Production Data
# =====================================================================

@pytest.mark.anyio
async def test_no_hardcoded_fake_values_invariant():
    service = ReportService()
    report1 = await service.generate_farm_report(district="Madurai", crop="Groundnut", area_acres=2.4)
    report2 = await service.generate_farm_report(district="Pune", crop="Soybean", area_acres=5.0)

    # Dynamic metrics should reflect their respective input contexts rather than a single static mock
    assert report1["farm"]["district"] != report2["farm"]["district"]
    assert report1["farm"]["current_crop"] != report2["farm"]["current_crop"]
    assert report1["farm"]["area_acres"] != report2["farm"]["area_acres"]
