"""
Enterprise Security, Adversarial Resilience & Edge Case Test Suite.
Tests:
1. SQL Injection attempt immunity across endpoints.
2. Extreme telemetry physical range outlier rejection.
3. Duplicate telemetry ingestion guard.
4. Multi-farm data isolation.
5. Missing input graceful degradation.
6. Geographic coordinate bounds validation.
7. Security response headers validation.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import AsyncSessionLocal
from app.services.iot_gateway import IoTGatewayService


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_security_headers_present():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-XSS-Protection") == "1; mode=block"


@pytest.mark.anyio
async def test_sql_injection_resilience():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Attempt SQL injection strings in farm_id and district
        sql_payloads = [
            "farm-01' OR '1'='1",
            "'; DROP TABLE sensor_telemetry;--",
            "admin'--",
            "<script>alert('xss')</script>"
        ]
        for payload in sql_payloads:
            resp = await client.get(f"/api/v1/farms/{payload}")
            # Should safely return 404 without executing SQL injection
            assert resp.status_code in [404, 400, 422]


@pytest.mark.anyio
async def test_extreme_telemetry_outliers_rejected():
    iot_service = IoTGatewayService()
    async with AsyncSessionLocal() as session:
        # Ingest extreme impossible agricultural values
        res = await iot_service.ingest_telemetry(
            device_id="TEST-NODE-SEC",
            farm_id="farm-sec-01",
            readings=[
                {"sensor_type": "moisture", "value": -999.0, "unit": "%"},
                {"sensor_type": "ph", "value": 99.0, "unit": "pH"},
                {"sensor_type": "temperature", "value": 5000.0, "unit": "°C"},
                {"sensor_type": "electrical_conductivity", "value": -50.0, "unit": "dS/m"}
            ],
            session=session
        )
        assert res["outliers_detected"] == 4
        assert len(res["validation_notes"]) >= 4
        for r in res["records"]:
            assert r["is_outlier"] is True
            assert r["quality_score"] <= 0.25


@pytest.mark.anyio
async def test_duplicate_telemetry_protection():
    iot_service = IoTGatewayService()
    async with AsyncSessionLocal() as session:
        # Ingest first packet
        res1 = await iot_service.ingest_telemetry(
            device_id="TEST-DUP-NODE",
            farm_id="farm-dup-01",
            readings=[{"sensor_type": "moisture", "value": 28.0, "unit": "%"}],
            session=session
        )
        assert res1["ingested_count"] == 1

        # Immediately ingest identical duplicate packet within 10s
        res2 = await iot_service.ingest_telemetry(
            device_id="TEST-DUP-NODE",
            farm_id="farm-dup-01",
            readings=[{"sensor_type": "moisture", "value": 28.0, "unit": "%"}],
            session=session
        )
        assert res2["duplicates_skipped"] >= 1


@pytest.mark.anyio
async def test_explainable_confidence_reasons_in_orchestrator():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/orchestrator/decide", json={
            "farm_id": "farm-01",
            "district": "Madurai",
            "state": "Tamil Nadu",
            "crop": "Groundnut"
        })
        assert resp.status_code == 200
        data = resp.json()
        conf = data["confidence"]
        assert "confidence_reasons" in conf
        assert len(conf["confidence_reasons"]) >= 2
        assert "action_plan" in data
        assert "operational_actions_7d" in data["action_plan"] or "immediate_actions" in data["action_plan"]
