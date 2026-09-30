from __future__ import annotations

import httpx
import pytest

from app.core.config import settings
from app.data.collectors.agmarknet_collector import AgmarknetCollector
from app.data.collectors.base import BaseCollector
from app.data.collectors.weather_collector import WeatherCollector


def _response(status_code: int, *, json_body=None, content: bytes | None = None) -> httpx.Response:
    request = httpx.Request("GET", "https://source.test/data")
    if content is not None:
        return httpx.Response(status_code, content=content, request=request)
    return httpx.Response(status_code, json=json_body, request=request)


def _mock_response(monkeypatch, response: httpx.Response) -> None:
    async def fake_get(self, url, params=None, headers=None, on_response=None):
        return response

    monkeypatch.setattr(BaseCollector, "_get", fake_get)


@pytest.mark.asyncio
async def test_agmarknet_keeps_distinct_source_ids_and_deduplicates_repeats(monkeypatch):
    monkeypatch.setattr(settings, "data_gov_in_api_key", "unit-test-key")
    record = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market": "Lasalgaon",
        "commodity": "Onion",
        "arrival_date": "20/09/2026",
        "modal_price": "1200",
        "unit": "quintal",
    }
    _mock_response(monkeypatch, _response(200, json_body={"records": [
        {**record, "id": "source-a"},
        {**record, "id": "source-b"},
        {**record, "id": "source-a"},
    ]}))

    result = await AgmarknetCollector().collect(state="Maharashtra")

    assert result.status == "success"
    assert result.records_accepted == 2
    assert result.records_rejected == 1
    assert {row["source_record_id"] for row in result.normalized_data} == {"source-a", "source-b"}


@pytest.mark.asyncio
async def test_agmarknet_missing_key_returns_unavailable_without_fetch(monkeypatch):
    monkeypatch.setattr(settings, "data_gov_in_api_key", None)

    async def fail_if_called(*args, **kwargs):
        raise AssertionError("collector must not make a request without credentials")

    monkeypatch.setattr(BaseCollector, "_get", fail_if_called)
    result = await AgmarknetCollector().collect(state="Maharashtra")

    assert result.status == "no_key"
    assert result.normalized_data == []


@pytest.mark.asyncio
async def test_agmarknet_empty_and_malformed_responses_are_not_successful_data(monkeypatch):
    monkeypatch.setattr(settings, "data_gov_in_api_key", "unit-test-key")
    _mock_response(monkeypatch, _response(200, json_body={"records": []}))
    empty = await AgmarknetCollector().collect(state="Maharashtra")
    assert empty.status == "no_data"
    assert empty.normalized_data == []

    _mock_response(monkeypatch, _response(200, content=b"{"))
    malformed = await AgmarknetCollector().collect(state="Maharashtra")
    assert malformed.status == "source_unavailable"
    assert malformed.normalized_data == []


@pytest.mark.asyncio
async def test_agmarknet_http_failure_is_unavailable(monkeypatch):
    monkeypatch.setattr(settings, "data_gov_in_api_key", "unit-test-key")
    _mock_response(monkeypatch, _response(503, json_body={"message": "temporarily unavailable"}))

    result = await AgmarknetCollector().collect(state="Maharashtra")

    assert result.status == "source_unavailable"
    assert result.normalized_data == []


@pytest.mark.asyncio
async def test_weather_normalizes_model_data_as_forecast(monkeypatch):
    _mock_response(monkeypatch, _response(200, json_body={
        "daily": {
            "time": ["2026-09-29"],
            "temperature_2m_max": [31],
            "temperature_2m_min": [23],
            "precipitation_sum": [4],
            "et0_fao_evapotranspiration": [3],
            "shortwave_radiation_sum": [10],
        },
        "current": {
            "time": "2026-09-29T10:00",
            "temperature_2m": 28,
            "relative_humidity_2m": 70,
            "precipitation": 0,
            "wind_speed_10m": 9,
            "soil_moisture_0_1cm": 0.2,
        },
    }))

    result = await WeatherCollector().collect(latitude=19.99, longitude=73.78, forecast_days=1)

    assert result.status == "success"
    assert len(result.normalized_data) == 2
    assert {row["data_type"] for row in result.normalized_data} == {"forecast"}
    assert all(row["weather_source"].startswith("Open-Meteo Forecast") for row in result.normalized_data)


@pytest.mark.asyncio
async def test_weather_network_timeout_returns_unavailable(monkeypatch):
    async def timeout(self, url, params=None, headers=None, on_response=None):
        raise httpx.TimeoutException("source timed out")

    monkeypatch.setattr(BaseCollector, "_get", timeout)
    result = await WeatherCollector().collect(latitude=19.99, longitude=73.78)

    assert result.status == "source_unavailable"
    assert result.normalized_data == []
