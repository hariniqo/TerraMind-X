import pytest
from app.agents.council import CouncilOrchestrator
from app.services.what_if_service import WhatIfSimulationService
from app.services.chat_advisor_service import ChatAdvisorService

@pytest.mark.asyncio
async def test_5_agent_council_execution():
    orchestrator = CouncilOrchestrator()
    inputs = {
        "state": "Tamil Nadu",
        "district": "Madurai",
        "crop": "Tomato",
        "latitude": 9.9252,
        "longitude": 78.1198,
        "soil_data": {"ph": 6.8, "organic_carbon": 0.70, "nitrogen": 180, "phosphorus": 22, "potassium": 240, "ec": 0.8},
        "weather_data": {"rainfall": 45.0, "temperature": 28.0, "humidity": 65.0, "status": "available", "latitude": 9.9252},
        "market_data": {"records": [{"price": 2400, "arrivals": 120}], "status": "available"},
        "crop_data": {"records": [{"crop": "Tomato", "area": 2500}], "status": "available"}
    }
    
    result = await orchestrator.run(inputs)
    
    assert "recommendation" in result
    assert "decision_audit" in result
    audit = result["decision_audit"]
    assert "land_intelligence" in audit
    assert "soil_guardian" in audit
    assert "agronomy" in audit
    assert "market_intelligence" in audit
    assert "sustainability" in audit
    assert result["decision_confidence"] > 0.0
    assert "#" not in result["explanation"]

def test_what_if_simulation_crop_switch():
    service = WhatIfSimulationService()
    res = service.simulate(
        current_crop="Tomato",
        target_crop="Chilli",
        district="Madurai",
        area_acres=2.5,
        rainfall_delta_pct=-20.0,
        arrival_surge_pct=40.0,
        irrigation_type="DRIP",
        is_organic=True
    )
    
    assert res["crop"] == "Chilli"
    assert res["outcomes"]["expected_yield_q_per_acre"] > 0
    assert res["outcomes"]["estimated_net_profit_inr"] > 0
    assert res["outcomes"]["water_saved_pct"] > 0
    assert "#" not in res["reasoning"]

@pytest.mark.asyncio
async def test_chat_advisor_tamil_query_and_sanitization():
    service = ChatAdvisorService()
    res = await service.process_query(
        query="எனக்கு தக்காளி அல்லது மிளகாய் பயிரிடலாமா?",
        farmer_context={
            "name": "மதுரை துல்லிய பண்ணை",
            "district": "Madurai",
            "state": "Tamil Nadu",
            "crop": "Tomato",
            "area_acres": 2.5,
            "soil_ph": 6.8,
            "irrigation_type": "DRIP"
        },
        language="ta"
    )
    
    assert "advisory" in res
    assert "#" not in res["advisory"]
    assert res["confidence"] >= 50
    assert len(res["why_points"]) > 0
