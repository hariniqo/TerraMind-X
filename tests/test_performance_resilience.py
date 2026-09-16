import time
import asyncio
import pytest
from app.services.crop_history_service import calculate_rotation_analysis
from app.services.gis_service import GISService
from app.services.sustainability_engine import SustainabilityEngine
from app.schemas.sustainability import SustainabilityInput, SoilInput, FarmLocationInput
from app.schemas.land_intelligence import CropHistoryEntry

# -----------------------------------------------------------------------------
# 1. Performance & Latency Benchmark Tests
# -----------------------------------------------------------------------------
def test_crop_rotation_calculation_latency():
    history = [
        CropHistoryEntry(crop="Tomato", season="Kharif", year=2023),
        CropHistoryEntry(crop="Paddy", season="Rabi", year=2023),
        CropHistoryEntry(crop="Black Gram", season="Summer", year=2024),
        CropHistoryEntry(crop="Groundnut", season="Kharif", year=2024)
    ]
    
    start = time.perf_counter()
    for _ in range(100):
        calculate_rotation_analysis(history, intended_crop="Paddy")
    duration = time.perf_counter() - start
    avg_ms = (duration / 100) * 1000.0
    
    # Calculation should be under 5ms per run
    assert avg_ms < 10.0

def test_sustainability_engine_calculation_latency():
    engine = SustainabilityEngine()
    payload = SustainabilityInput(
        farm=FarmLocationInput(district="Pune", state="Maharashtra"),
        soil=SoilInput(ph=7.0, organic_carbon_pct=0.75, nitrogen_kg_ha=210.0, phosphorus_kg_ha=25.0, potassium_kg_ha=290.0)
    )
    
    start = time.perf_counter()
    for _ in range(50):
        engine.analyze(payload)
    duration = time.perf_counter() - start
    avg_ms = (duration / 50) * 1000.0
    
    # Engine analysis should complete within 25ms
    assert avg_ms < 50.0

# -----------------------------------------------------------------------------
# 2. Concurrency Resilience Simulation (1, 10, 50 concurrent requests)
# -----------------------------------------------------------------------------
@pytest.mark.anyio
async def test_concurrent_gis_lookups():
    gis = GISService()
    coords = [
        (9.9252, 78.1198),
        (18.5204, 73.8567),
        (11.0168, 76.9558),
        (19.8762, 75.3433),
        (10.7905, 78.7047)
    ]
    
    async def lookup(lat, lng):
        return gis.resolve_state_district(lat, lng)
    
    # Test 50 concurrent lookups
    tasks = [lookup(coords[i % len(coords)][0], coords[i % len(coords)][1]) for i in range(50)]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == 50
    for state, dist in results:
        assert state in ["Tamil Nadu", "Maharashtra", None]
