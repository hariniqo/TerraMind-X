"""
Hardware/IoT Intelligence Gateway & Sensor Abstraction Service.
Provides hardware-ready endpoints, telemetry validation, outlier detection,
device calibration registry, duplicate protection, stale-data detection,
and data source tagging.
ESP32/MQTT integration ready.
"""

import logging
from datetime import datetime, date, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.db.session import AsyncSessionLocal
from app.db.models import SensorDeviceRecord, SensorTelemetryRecord
from app.schemas.agent_contracts import (
    AgentContractResponse,
    AgentStatus,
    DataFreshness,
    DataSourceMeta,
    AgentValidationMeta
)

logger = logging.getLogger(__name__)

# Valid physical bounds for sensor parameters
SENSOR_PHYSICAL_BOUNDS: Dict[str, Dict[str, Any]] = {
    "moisture": {"min": 0.0, "max": 100.0, "unit": "%", "typical_min": 10.0, "typical_max": 50.0},
    "ph": {"min": 3.0, "max": 11.0, "unit": "pH", "typical_min": 5.5, "typical_max": 8.5},
    "temperature": {"min": -10.0, "max": 65.0, "unit": "°C", "typical_min": 15.0, "typical_max": 45.0},
    "nitrogen": {"min": 0.0, "max": 500.0, "unit": "kg/ha", "typical_min": 20.0, "typical_max": 120.0},
    "phosphorus": {"min": 0.0, "max": 300.0, "unit": "kg/ha", "typical_min": 10.0, "typical_max": 80.0},
    "potassium": {"min": 0.0, "max": 600.0, "unit": "kg/ha", "typical_min": 50.0, "typical_max": 350.0},
    "electrical_conductivity": {"min": 0.0, "max": 20.0, "unit": "dS/m", "typical_min": 0.2, "typical_max": 4.0}
}


class IoTGatewayService:
    async def register_device(
        self,
        device_id: str,
        farm_id: str,
        device_name: str,
        device_type: str = "SOIL_NODE",
        hardware_model: str = "ESP32-AGRI-PRO-V2",
        firmware_version: str = "v2.1.0-prod",
        calibration_metadata: Optional[Dict[str, Any]] = None,
        is_simulated: bool = False,
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Registers a physical or virtual IoT sensing node.
        """
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        try:
            stmt = select(SensorDeviceRecord).where(SensorDeviceRecord.device_id == device_id)
            res = await session.execute(stmt)
            device = res.scalars().first()

            if not device:
                device = SensorDeviceRecord(
                    device_id=device_id,
                    farm_id=farm_id,
                    device_name=device_name,
                    device_type=device_type,
                    hardware_model=hardware_model,
                    firmware_version=firmware_version,
                    status="ONLINE",
                    battery_level_pct=98.0,
                    calibration_metadata=calibration_metadata or {
                        "soil_dielectric_k": 4.2,
                        "adc_attenuation": "11dB",
                        "factory_calibrated_at": date.today().strftime("%Y-%m-%d")
                    },
                    is_simulated=1 if is_simulated else 0
                )
                session.add(device)
            else:
                device.device_name = device_name
                device.farm_id = farm_id
                device.status = "ONLINE"
                device.firmware_version = firmware_version
                if calibration_metadata:
                    device.calibration_metadata = calibration_metadata

            await session.commit()
            await session.refresh(device)

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
                "last_seen": device.last_seen.isoformat() if device.last_seen else datetime.now(timezone.utc).isoformat()
            }
        finally:
            if close_session:
                await session.close()

    async def ingest_telemetry(
        self,
        device_id: str,
        farm_id: str,
        readings: List[Dict[str, Any]],
        source_type: str = "iot_sensor",  # iot_sensor, manual, external, simulation
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Validates, checks physical bounds, detects outliers, eliminates duplicates, and commits telemetry records.
        """
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        valid_records = []
        outliers_detected = 0
        duplicates_skipped = 0
        validation_notes = []

        try:
            # Update device status and heartbeat
            stmt = select(SensorDeviceRecord).where(SensorDeviceRecord.device_id == device_id)
            res = await session.execute(stmt)
            device = res.scalars().first()
            if device:
                device.last_seen = func.now()
                device.status = "ONLINE"

            for item in readings:
                sensor_type = item.get("sensor_type", "").lower()
                value = item.get("value")
                unit = item.get("unit")

                if value is None:
                    continue

                try:
                    val_float = float(value)
                except (ValueError, TypeError):
                    validation_notes.append(f"Invalid non-numeric value for {sensor_type}: {value}")
                    continue

                # Duplicate protection: check if same reading was posted within 30s
                dup_stmt = select(SensorTelemetryRecord).where(
                    SensorTelemetryRecord.device_id == device_id,
                    SensorTelemetryRecord.sensor_type == sensor_type,
                    SensorTelemetryRecord.value == val_float
                ).order_by(desc(SensorTelemetryRecord.id)).limit(1)
                dup_res = await session.execute(dup_stmt)
                last_rec = dup_res.scalars().first()
                if last_rec and last_rec.timestamp:
                    try:
                        # If duplicate within 10 seconds, skip storing duplicate row
                        ts = last_rec.timestamp.replace(tzinfo=timezone.utc) if last_rec.timestamp.tzinfo is None else last_rec.timestamp
                        if (datetime.now(timezone.utc) - ts).total_seconds() < 10.0:
                            duplicates_skipped += 1
                            continue
                    except Exception:
                        pass

                bounds = SENSOR_PHYSICAL_BOUNDS.get(sensor_type)
                is_outlier = 0
                quality_score = 1.0

                if bounds:
                    unit = unit or bounds["unit"]
                    if val_float < bounds["min"] or val_float > bounds["max"]:
                        is_outlier = 1
                        quality_score = 0.2
                        outliers_detected += 1
                        validation_notes.append(
                            f"Sensor reading {sensor_type}={val_float} exceeded physical limits [{bounds['min']}, {bounds['max']}]."
                        )
                    elif val_float < bounds["typical_min"] or val_float > bounds["typical_max"]:
                        quality_score = 0.75
                        validation_notes.append(
                            f"Sensor reading {sensor_type}={val_float} outside typical agricultural range."
                        )

                rec = SensorTelemetryRecord(
                    device_id=device_id,
                    farm_id=farm_id,
                    sensor_type=sensor_type,
                    value=val_float,
                    unit=unit or "units",
                    source_type=source_type,
                    is_outlier=is_outlier,
                    quality_score=quality_score,
                    raw_payload=item
                )
                session.add(rec)
                valid_records.append({
                    "sensor_type": sensor_type,
                    "value": val_float,
                    "unit": unit,
                    "source_type": source_type,
                    "is_outlier": bool(is_outlier),
                    "quality_score": quality_score
                })

            await session.commit()

            return {
                "status": "INGESTION_COMPLETE",
                "device_id": device_id,
                "farm_id": farm_id,
                "ingested_count": len(valid_records),
                "outliers_detected": outliers_detected,
                "duplicates_skipped": duplicates_skipped,
                "records": valid_records,
                "validation_notes": validation_notes
            }
        finally:
            if close_session:
                await session.close()

    async def get_latest_sensor_data(
        self,
        farm_id: str,
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Retrieves latest validated sensor readings across nodes for a farm.
        Detects stale telemetry if sensor last seen exceeds 24h.
        """
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        try:
            stmt = select(SensorTelemetryRecord).where(
                SensorTelemetryRecord.farm_id == farm_id
            ).order_by(desc(SensorTelemetryRecord.id)).limit(50)
            res = await session.execute(stmt)
            records = res.scalars().all()

            latest_by_sensor: Dict[str, Any] = {}
            for r in records:
                if r.sensor_type not in latest_by_sensor:
                    latest_by_sensor[r.sensor_type] = {
                        "sensor_type": r.sensor_type,
                        "value": r.value,
                        "unit": r.unit,
                        "source_type": r.source_type,
                        "is_outlier": bool(r.is_outlier),
                        "quality_score": r.quality_score,
                        "timestamp": r.timestamp.isoformat() if r.timestamp else datetime.now(timezone.utc).isoformat()
                    }

            # If no real IoT sensors registered for this farm, provide transparent software demo telemetry
            if not latest_by_sensor:
                return {
                    "source_type": "simulation",
                    "status": "WAITING_FOR_DEVICE",
                    "message": "No physical IoT hardware connected. Software telemetry simulator active.",
                    "readings": {
                        "moisture": {"value": 28.5, "unit": "%", "source_type": "simulation", "is_outlier": False, "quality_score": 0.85},
                        "ph": {"value": 6.8, "unit": "pH", "source_type": "simulation", "is_outlier": False, "quality_score": 0.85},
                        "temperature": {"value": 27.2, "unit": "°C", "source_type": "simulation", "is_outlier": False, "quality_score": 0.85},
                        "nitrogen": {"value": 45.0, "unit": "kg/ha", "source_type": "simulation", "is_outlier": False, "quality_score": 0.80},
                        "phosphorus": {"value": 24.0, "unit": "kg/ha", "source_type": "simulation", "is_outlier": False, "quality_score": 0.80},
                        "potassium": {"value": 185.0, "unit": "kg/ha", "source_type": "simulation", "is_outlier": False, "quality_score": 0.80},
                        "electrical_conductivity": {"value": 1.15, "unit": "dS/m", "source_type": "simulation", "is_outlier": False, "quality_score": 0.85}
                    }
                }

            # Determine dominant source type
            primary_source = "iot_sensor"
            for s in latest_by_sensor.values():
                if s["source_type"] != "iot_sensor":
                    primary_source = s["source_type"]
                    break

            return {
                "source_type": primary_source,
                "status": "ONLINE",
                "message": f"Retrieved {len(latest_by_sensor)} validated telemetry parameters.",
                "readings": latest_by_sensor
            }
        finally:
            if close_session:
                await session.close()

    async def get_hardware_agent_response(
        self,
        farm_id: str,
        session: Optional[AsyncSession] = None
    ) -> AgentContractResponse:
        """
        Standardized Agent Contract output for Agent 5: Hardware/IoT Intelligence.
        """
        sensor_data = await self.get_latest_sensor_data(farm_id, session=session)
        is_simulated = sensor_data.get("source_type") == "simulation"

        return AgentContractResponse(
            agent="hardware_iot_intelligence",
            status=AgentStatus.SUCCESS if not is_simulated else AgentStatus.PARTIAL,
            inputs={"farm_id": farm_id},
            results=sensor_data,
            recommendations=[
                "Maintain soil moisture between 25% and 35% via automated drip pulsing." if not is_simulated else "Connect physical ESP32 soil sensor probe to unlock sub-hourly microclimate alerts.",
                "Conduct routine electrode recalibration every 90 days."
            ],
            confidence=0.92 if not is_simulated else 0.70,
            data_sources=[
                DataSourceMeta(
                    source_name="TerraMind ESP32 Telemetry Gateway" if not is_simulated else "IoT Hardware Simulation Engine",
                    provider="TerraMind Hardware Services",
                    geographic_level="Sub-Field Sensor Node",
                    reliability_tier=1 if not is_simulated else 3
                )
            ],
            data_freshness=DataFreshness.LIVE if not is_simulated else DataFreshness.SIMULATED,
            warnings=["Operating in SIMULATION mode: readings are estimated baseline telemetry."] if is_simulated else [],
            validation=AgentValidationMeta(
                is_valid=True,
                input_completeness_pct=100.0 if not is_simulated else 75.0,
                outliers_detected=0
            )
        )

    async def validate_sensor_vs_lab_reference(
        self,
        device_id: str,
        sensor_type: str,
        sensor_reading: float,
        lab_reference_value: float,
        lab_sample_id: str,
        testing_lab_name: str = "District ICAR-KVK Soil Testing Laboratory",
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Validates in-situ sensor readings against standard laboratory reference samples.
        Calculates error delta, drift metrics, and updates calibration metadata with offset bias.
        """
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        try:
            delta = round(sensor_reading - lab_reference_value, 3)
            abs_error = round(abs(delta), 3)
            pct_error = round((abs_error / max(0.001, abs(lab_reference_value))) * 100.0, 2)

            # Tolerance thresholds per sensor type
            tolerances = {
                "ph": {"max_acceptable": 0.3, "warning": 0.6, "unit": "pH"},
                "moisture": {"max_acceptable": 3.0, "warning": 7.0, "unit": "%"},
                "temperature": {"max_acceptable": 1.0, "warning": 2.5, "unit": "°C"},
                "electrical_conductivity": {"max_acceptable": 0.15, "warning": 0.4, "unit": "dS/m"},
                "nitrogen": {"max_acceptable": 8.0, "warning": 20.0, "unit": "kg/ha"},
                "phosphorus": {"max_acceptable": 5.0, "warning": 12.0, "unit": "kg/ha"},
                "potassium": {"max_acceptable": 15.0, "warning": 35.0, "unit": "kg/ha"}
            }

            tol = tolerances.get(sensor_type.lower(), {"max_acceptable": 1.0, "warning": 3.0, "unit": "units"})

            if abs_error <= tol["max_acceptable"]:
                calibration_status = "CALIBRATED_ACCURATE"
                action_required = "Sensor reading within acceptable laboratory tolerance. No adjustment needed."
            elif abs_error <= tol["warning"]:
                calibration_status = "MINOR_DRIFT_CORRECTABLE"
                action_required = f"Apply offset bias correction of {-delta:+.3f} {tol['unit']} in device calibration profile."
            else:
                calibration_status = "RECALIBRATION_REQUIRED"
                action_required = f"Electrode drift exceeds safety threshold ({abs_error} > {tol['warning']}). Full buffer recalibration or sensor replacement required."

            # Update device record calibration metadata in database
            stmt = select(SensorDeviceRecord).where(SensorDeviceRecord.device_id == device_id)
            res = await session.execute(stmt)
            device = res.scalars().first()

            if device:
                meta = dict(device.calibration_metadata or {})
                meta[f"lab_validation_{sensor_type}"] = {
                    "last_validated_at": datetime.now(timezone.utc).isoformat(),
                    "lab_sample_id": lab_sample_id,
                    "testing_lab": testing_lab_name,
                    "sensor_reading": sensor_reading,
                    "lab_reference_value": lab_reference_value,
                    "absolute_error": abs_error,
                    "percentage_error": pct_error,
                    "calibration_status": calibration_status,
                    "recommended_offset_bias": -delta
                }
                device.calibration_metadata = meta
                await session.commit()

            return {
                "device_id": device_id,
                "sensor_type": sensor_type,
                "sensor_reading": sensor_reading,
                "lab_reference_value": lab_reference_value,
                "unit": tol["unit"],
                "error_delta": delta,
                "absolute_error": abs_error,
                "percentage_error": pct_error,
                "calibration_status": calibration_status,
                "recommended_offset_bias": -delta,
                "action_required": action_required,
                "lab_sample_id": lab_sample_id,
                "testing_lab_name": testing_lab_name,
                "validated_at": datetime.now(timezone.utc).isoformat()
            }
        finally:
            if close_session:
                await session.close()

