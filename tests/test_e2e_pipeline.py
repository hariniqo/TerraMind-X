import pytest
from app.services.data_gateway import DataGateway
from app.db.session import AsyncSessionLocal
from app.services.ai_provider import get_ai_provider
from app.agents.council import CouncilOrchestrator
from sqlalchemy import text

@pytest.mark.anyio
async def test_e2e_data_to_advisory_pipeline():
    gateway = DataGateway()
    
    # 1. Fetch normalized data structures from the Gateway (using Madurai GPS)
    latitude = 9.9833
    longitude = 78.3333
    
    state_packet = await gateway.run_full_pipeline(
        state="Tamil Nadu",
        district="Madurai",
        crop="Tomato",
        latitude=latitude,
        longitude=longitude,
        farm_id="farm_madurai_01"
    )
    
    # Assert normalized structures exist
    assert "weather_observation" in state_packet
    assert "market_observation" in state_packet
    assert "satellite_observation" in state_packet
    
    # Verify NDVI parameters
    ndvi_data = state_packet["satellite_observation"]
    assert ndvi_data["status"] == "success"
    assert "value" in ndvi_data
    assert "source" in ndvi_data
    
    # 2. Persist to Database Session
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Run simple query check to verify connection readiness
            res = await session.execute(text("SELECT 1"))
            assert res.scalar() == 1

    # 3. Pass to Agent Reasoning & AI Provider Bilingual advisory
    provider = get_ai_provider()
    explanation = await provider.generate_farmer_explanation(
        recommendation="Sow Tomato on Red Soil using drip irrigation system.",
        evidence=[
            f"NDVI Vegetation Index is {ndvi_data['value']} ({ndvi_data['source']})",
            "Mandi rates forecast shows stable demand."
        ],
        risks=["Minor oversupply risk"],
        confidence=0.89,
        language="Tamil"
    )
    
    # Verify advisory generation
    assert "Tomato" in explanation or "Advisory" in explanation
