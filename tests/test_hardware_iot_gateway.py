"""
Automated Test Suite for Hardware/IoT Intelligence Gateway.
Validates device registration, telemetry ingestion, physical range validation,
outlier detection, and data source tagging.
"""

import pytest
from app.db.session import AsyncSessionLocal
from app.services.iot_gateway import IoTGatewayService
from app.db.models import SensorDeviceRecord, SensorTelemetryRecord
from sqlalchemy import select


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_device_registration_and_telemetry_flow():
    iot_service = IoTGatewayService()
    async with AsyncSessionLocal() as session:
        # 1. Register a physical node
        device = await iot_service.register_device(
            device_id="TEST-ESP32-NODE-01",
            farm_id="farm-test-01",
            device_name="Test Soil Node #1",
            device_type="SOIL_NODE",
            hardware_model="ESP32-AGRI-PRO-V2",
            firmware_version="v2.1.0-prod",
            calibration_metadata={"dielectric_constant": 4.5},
            is_simulated=False,
            session=session
        )
        assert device["device_id"] == "TEST-ESP32-NODE-01"
        assert device["status"] == "ONLINE"
        assert device["is_simulated"] is False

        # 2. Ingest normal telemetry
        ingest_res = await iot_service.ingest_telemetry(
            device_id="TEST-ESP32-NODE-01",
            farm_id="farm-test-01",
            readings=[
                {"sensor_type": "moisture", "value": 29.5, "unit": "%"},
                {"sensor_type": "ph", "value": 6.8, "unit": "pH"},
                {"sensor_type": "temperature", "value": 27.5, "unit": "°C"}
            ],
            source_type="iot_sensor",
            session=session
        )
        assert ingest_res["status"] == "INGESTION_COMPLETE"
        assert ingest_res["ingested_count"] == 3
        assert ingest_res["outliers_detected"] == 0

        # 3. Ingest outlier telemetry (e.g. pH = 14.5, moisture = 150%)
        outlier_res = await iot_service.ingest_telemetry(
            device_id="TEST-ESP32-NODE-01",
            farm_id="farm-test-01",
            readings=[
                {"sensor_type": "ph", "value": 14.5, "unit": "pH"},
                {"sensor_type": "moisture", "value": 150.0, "unit": "%"}
            ],
            source_type="iot_sensor",
            session=session
        )
        assert outlier_res["outliers_detected"] == 2
        assert len(outlier_res["validation_notes"]) >= 2

        # 4. Check latest sensor data lookup
        latest = await iot_service.get_latest_sensor_data(farm_id="farm-test-01", session=session)
        assert latest["status"] == "ONLINE"
        assert "readings" in latest
        assert "moisture" in latest["readings"]
        assert latest["readings"]["moisture"]["value"] == 150.0
        assert latest["readings"]["moisture"]["is_outlier"] is True


@pytest.mark.anyio
async def test_simulated_hardware_fallback():
    iot_service = IoTGatewayService()
    async with AsyncSessionLocal() as session:
        # When no device is registered for a farm, it returns simulation fallback tagged cleanly
        data = await iot_service.get_latest_sensor_data(farm_id="farm-unconnected-99", session=session)
        assert data["source_type"] == "simulation"
        assert data["status"] == "WAITING_FOR_DEVICE"
        assert "readings" in data
        assert data["readings"]["moisture"]["source_type"] == "simulation"


@pytest.mark.anyio
async def test_lab_vs_sensor_calibration_validation():
    iot_service = IoTGatewayService()
    async with AsyncSessionLocal() as session:
        # 1. Register device
        await iot_service.register_device(
            device_id="ESP32-LAB-TEST-NODE",
            farm_id="farm-lab-01",
            device_name="Lab Test Probe",
            session=session
        )

        # 2. Test accurate calibration within tolerance
        res_acc = await iot_service.validate_sensor_vs_lab_reference(
            device_id="ESP32-LAB-TEST-NODE",
            sensor_type="ph",
            sensor_reading=6.85,
            lab_reference_value=6.80,
            lab_sample_id="LAB-SAMPLE-001",
            session=session
        )
        assert res_acc["calibration_status"] == "CALIBRATED_ACCURATE"
        assert res_acc["absolute_error"] == 0.05
        assert res_acc["recommended_offset_bias"] == -0.05

        # 3. Test drift requiring correction
        res_drift = await iot_service.validate_sensor_vs_lab_reference(
            device_id="ESP32-LAB-TEST-NODE",
            sensor_type="ph",
            sensor_reading=7.25,
            lab_reference_value=6.80,
            lab_sample_id="LAB-SAMPLE-002",
            session=session
        )
        assert res_drift["calibration_status"] == "MINOR_DRIFT_CORRECTABLE"
        assert res_drift["absolute_error"] == 0.45
        assert "offset bias" in res_drift["action_required"].lower()

