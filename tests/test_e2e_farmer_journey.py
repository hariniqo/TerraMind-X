"""
End-to-End Automated Test of the 15-Step Farmer Journey.
Simulates a farmer navigating through the entire TerraMind-X intelligence workflow:
Profile -> IoT Ingestion -> Land Intelligence -> Soil Diagnostics -> Market Intelligence ->
Sustainability -> 6-Agent Orchestrator -> Conflict Resolution -> Action Plan -> History Replay ->
Audit Report -> Observability & WhatsApp Dispatch.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import AsyncSessionLocal


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_full_15_step_farmer_journey():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Query Farm Profile
        resp_farm = await client.get("/api/v1/farms/farm-01")
        assert resp_farm.status_code == 200
        farm_data = resp_farm.json()
        assert farm_data["farm_id"] == "farm-01"
        assert farm_data["district"] == "Madurai"

        # Step 2: Register IoT Soil Node
        resp_reg = await client.post("/api/v1/devices/register", json={
            "device_id": "ESP32-JOURNEY-01",
            "farm_id": "farm-01",
            "device_name": "Journey Field Probe #1",
            "device_type": "SOIL_NODE",
            "hardware_model": "ESP32-AGRI-PRO-V2",
            "firmware_version": "v2.1.0-prod",
            "is_simulated": False
        })
        assert resp_reg.status_code == 201
        assert resp_reg.json()["device_id"] == "ESP32-JOURNEY-01"

        # Step 3: Ingest Valid Soil Sensor Telemetry
        resp_telem = await client.post("/api/v1/devices/ESP32-JOURNEY-01/telemetry", json={
            "device_id": "ESP32-JOURNEY-01",
            "farm_id": "farm-01",
            "source_type": "iot_sensor",
            "readings": [
                {"sensor_type": "moisture", "value": 31.0, "unit": "%"},
                {"sensor_type": "ph", "value": 6.7, "unit": "pH"},
                {"sensor_type": "temperature", "value": 26.8, "unit": "°C"}
            ]
        })
        assert resp_telem.status_code == 200
        assert resp_telem.json()["ingested_count"] == 3

        # Step 4: Verify Sensor Telemetry API
        resp_sensors = await client.get("/api/v1/sensors/readings?farm_id=farm-01")
        assert resp_sensors.status_code == 200
        assert resp_sensors.json()["status"] == "ONLINE"

        # Step 5: Query Land Intelligence Agent
        resp_land = await client.get("/api/v1/land-intelligence/summary?district=Madurai&crop=Groundnut")
        assert resp_land.status_code == 200
        land_data = resp_land.json()
        assert "rotation_analysis" in land_data or "satellite_ndvi" in land_data


        # Step 6: Query Soil Intelligence Agent
        resp_soil = await client.get("/api/v1/soil?latitude=9.9252&longitude=78.1198")
        assert resp_soil.status_code == 200


        # Step 7: Query Market Intelligence Agent
        resp_market = await client.get("/api/v1/market?state=Tamil%20Nadu&district=Madurai&commodity=Groundnut")
        assert resp_market.status_code == 200


        # Step 8: Query Sustainability Agent
        resp_sust = await client.get("/api/v1/sustainability/farm-01/water")
        assert resp_sust.status_code == 200



        # Step 9: Central Orchestrator Decision
        resp_decide = await client.post("/api/v1/orchestrator/decide", json={
            "farm_id": "farm-01",
            "district": "Madurai",
            "state": "Tamil Nadu",
            "crop": "Groundnut"
        })
        assert resp_decide.status_code == 200
        decision = resp_decide.json()
        assert decision["status"] == "DECISION_FINALIZED"
        assert decision["primary_recommendation"]["crop"] == "Groundnut"

        # Step 10: Verify Action Plan Synthesized
        assert len(decision["action_plan"]["immediate_actions"]) == 3
        assert len(decision["action_plan"]["long_term_actions"]) == 3

        # Step 11: Verify Multilingual Synthesis
        assert "en" in decision["farmer_explanation"]
        assert "ta" in decision["farmer_explanation"]
        assert "mr" in decision["farmer_explanation"]

        # Step 12: Decision History Retrieval
        resp_hist = await client.get("/api/v1/orchestrator/history/farm-01")
        assert resp_hist.status_code == 200
        assert len(resp_hist.json()) >= 1

        # Step 13: Full Audit Farm Report Generation
        resp_rep = await client.get("/api/v1/reports/farm-01?district=Madurai&state=Tamil%20Nadu&crop=Groundnut")
        assert resp_rep.status_code == 200
        report = resp_rep.json()
        assert report["farm"]["district"] == "Madurai"
        assert "data_quality" in report
        assert "confidence" in report

        # Step 14: Agent Health Observability Check
        resp_health = await client.get("/api/v1/health/agents")
        assert resp_health.status_code == 200
        health = resp_health.json()
        assert health["system_status"] == "HEALTHY"
        assert health["total_agents"] == 6

        # Step 15: WhatsApp Advisory Dispatch Intent
        resp_wa = await client.get("/api/v1/reports/farm-01/whatsapp?language=ta")
        assert resp_wa.status_code == 200
        wa_data = resp_wa.json()
        assert "whatsapp_click_to_chat_url" in wa_data
        assert "வாட்ஸ்அப்" in wa_data["text_message"] or "நிலக்கடலை" in wa_data["text_message"]
