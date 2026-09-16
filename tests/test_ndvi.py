import pytest
from app.services.ndvi_service import get_sentinel_ndvi

@pytest.mark.anyio
async def test_sentinel_ndvi_retrieval():
    res = await get_sentinel_ndvi(
        latitude=9.9833,
        longitude=78.3333,
        farm_id="farm_001"
    )
    assert res["status"] == "success"
    assert 0.0 <= res["value"] <= 1.0
    assert 0.0 <= res["cloud_percentage"] <= 100.0
    assert res["confidence"] == "high_evidence"
    assert "time_series" in res
    assert res["time_series"]["provider"] == "Sentinel-2 MSI Level-2A"
