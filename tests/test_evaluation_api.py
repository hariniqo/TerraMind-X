"""
Test Suite for Agricultural Accuracy REST API Endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.anyio
async def test_evaluation_summary_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/evaluation/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total_scenarios"] >= 200
        assert data["overall_accuracy_pct"] >= 90.0
        assert "category_metrics" in data
        assert "Crop Selection" in data["category_metrics"]


@pytest.mark.anyio
async def test_evaluation_category_query_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/evaluation/category/Crop Selection")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "Crop Selection"
        assert data["accuracy_percentage"] >= 90.0


@pytest.mark.anyio
async def test_evaluation_scenario_detail_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/evaluation/scenario/SCN-CROP-001")
        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "SCN-CROP-001"
        assert data["is_accurate"] is True
