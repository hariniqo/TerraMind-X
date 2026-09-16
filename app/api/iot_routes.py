"""
IoT & Sensor Management API Routes.
Exposes endpoints for device registration, telemetry ingestion, physical limits validation,
outlier detection, and sensor history.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_session
from app.db.models import SensorDeviceRecord, SensorTelemetryRecord
from app.services.iot_gateway import IoTGatewayService

logger = logging.getLogger(__name__)
router = APIRouter()
iot_service = IoTGatewayService()


class DeviceRegistrationRequest(BaseModel):
    device_id: str = Field(..., example="ESP32-NODE-MADURAI-01")
    farm_id: str = Field(..., example="farm-01")
    device_name: str = Field(..., example="East Field Soil Probe #1")
    device_type: str = Field("SOIL_NODE", example="SOIL_NODE")
    hardware_model: str = Field("ESP32-AGRI-PRO-V2", example="ESP32-AGRI-PRO-V2")
    firmware_version: str = Field("v2.1.0-prod", example="v2.1.0-prod")
    calibration_metadata: Optional[Dict[str, Any]] = None
    is_simulated: bool = False


class TelemetryItem(BaseModel):
    sensor_type: str = Field(..., example="moisture")
    value: float = Field(..., example=28.5)
    unit: Optional[str] = Field(None, example="%")


class TelemetryIngestRequest(BaseModel):
    device_id: Optional[str] = Field(None, example="ESP32-NODE-MADURAI-01")
    farm_id: str = Field(..., example="farm-01")
    source_type: str = Field("iot_sensor", example="iot_sensor")  # iot_sensor, manual, external, simulation
    readings: List[TelemetryItem]



@router.post("/devices/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_iot_device(
    payload: DeviceRegistrationRequest,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Registers a new hardware/virtual IoT device node with calibration metadata.
    """
    try:
        return await iot_service.register_device(
            device_id=payload.device_id,
            farm_id=payload.farm_id,
            device_name=payload.device_name,
            device_type=payload.device_type,
            hardware_model=payload.hardware_model,
            firmware_version=payload.firmware_version,
            calibration_metadata=payload.calibration_metadata,
            is_simulated=payload.is_simulated,
            session=session
        )
    except Exception as e:
        logger.error(f"Device registration failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Device registration failed: {str(e)}"
        )


@router.get("/devices", response_model=List[Dict[str, Any]])
async def list_devices(
    farm_id: Optional[str] = Query(None, description="Filter by farm ID"),
    session: AsyncSession = Depends(get_session)
) -> List[Dict[str, Any]]:
    """
    Lists registered sensor devices and their online status.
    """
    stmt = select(SensorDeviceRecord)
    if farm_id:
        stmt = stmt.where(SensorDeviceRecord.farm_id == farm_id)
    res = await session.execute(stmt)
    records = res.scalars().all()

    return [
        {
            "device_id": r.device_id,
            "farm_id": r.farm_id,
            "device_name": r.device_name,
            "device_type": r.device_type,
            "hardware_model": r.hardware_model,
            "firmware_version": r.firmware_version,
            "status": r.status,
            "battery_level_pct": r.battery_level_pct,
            "is_simulated": bool(r.is_simulated),
            "last_seen": r.last_seen.isoformat() if r.last_seen else None
        }
        for r in records
    ]


@router.get("/devices/{device_id}", response_model=Dict[str, Any])
async def get_device_details(
    device_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves individual device node status and calibration profile.
    """
    stmt = select(SensorDeviceRecord).where(SensorDeviceRecord.device_id == device_id)
    res = await session.execute(stmt)
    device = res.scalars().first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device '{device_id}' not found.")

    return {
        "device_id": device.device_id,
        "farm_id": device.farm_id,
        "device_name": device.device_name,
        "device_type": device.device_type,
        "hardware_model": device.hardware_model,
        "firmware_version": device.firmware_version,
        "status": device.status,
        "battery_level_pct": device.battery_level_pct,
        "calibration_metadata": device.calibration_metadata,
        "is_simulated": bool(device.is_simulated),
        "last_seen": device.last_seen.isoformat() if device.last_seen else None
    }


@router.post("/devices/{device_id}/telemetry", response_model=Dict[str, Any])
async def ingest_device_telemetry(
    device_id: str,
    payload: TelemetryIngestRequest,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Ingests sensor telemetry packets from ESP32/MQTT or manual gateway with validation.
    """
    try:
        raw_items = [item.model_dump() for item in payload.readings]
        return await iot_service.ingest_telemetry(
            device_id=device_id,
            farm_id=payload.farm_id,
            readings=raw_items,
            source_type=payload.source_type,
            session=session
        )
    except Exception as e:
        logger.error(f"Telemetry ingestion failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Telemetry ingestion failed: {str(e)}"
        )


class LabCalibrationRequest(BaseModel):
    sensor_type: str = Field(..., example="ph")
    sensor_reading: float = Field(..., example=6.75)
    lab_reference_value: float = Field(..., example=6.80)
    lab_sample_id: str = Field(..., example="TNAU-SOIL-2026-889")
    testing_lab_name: str = Field("District ICAR-KVK Soil Testing Laboratory", example="District ICAR-KVK Soil Testing Laboratory")


@router.post("/devices/{device_id}/calibrate-lab", response_model=Dict[str, Any])
async def validate_device_against_lab_reference(
    device_id: str,
    payload: LabCalibrationRequest,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Validates in-situ sensor measurements against laboratory reference sample.
    Calculates absolute error, percentage drift, and updates device calibration profile.
    """
    try:
        return await iot_service.validate_sensor_vs_lab_reference(
            device_id=device_id,
            sensor_type=payload.sensor_type,
            sensor_reading=payload.sensor_reading,
            lab_reference_value=payload.lab_reference_value,
            lab_sample_id=payload.lab_sample_id,
            testing_lab_name=payload.testing_lab_name,
            session=session
        )
    except Exception as e:
        logger.error(f"Lab calibration validation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lab calibration validation failed: {str(e)}"
        )


@router.get("/sensors/readings", response_model=Dict[str, Any])
async def get_sensor_readings(
    farm_id: str = Query("farm-01", description="Farm identifier"),
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves latest validated sensor parameters tagged by data source.
    """
    return await iot_service.get_latest_sensor_data(farm_id=farm_id, session=session)

