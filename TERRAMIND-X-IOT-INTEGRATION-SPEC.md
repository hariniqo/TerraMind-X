# TERRAMIND-X: HARDWARE & IOT INTEGRATION SPECIFICATION

**Protocol Standard:** ESP32 / MQTT / HTTPS REST  
**Target Hardware:** ESP32-WROOM-32 / ESP32-S3 Microcontroller  
**Document Version:** 2.0.0  

---

## 1. Hardware Overview & Pin Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                 ESP32 FIELD SENSOR NODE                     │
├──────────────────────────────┬──────────────────────────────┤
│ Sensor Probe                 │ Interface & Pin Mapping      │
├──────────────────────────────┼──────────────────────────────┤
│ RS485 / Modbus Soil NPK      │ GPIO 16 (RX2), GPIO 17 (TX2) │
│ Capacitive Moisture (v2.0)   │ ADC1_CH0 (GPIO 36)           │
│ DS18B20 Soil Temperature     │ 1-Wire Digital (GPIO 4)      │
│ Soil pH Glass Electrode      │ ADC1_CH3 (GPIO 39)           │
│ Solar Power / LiPo Fuel Gauge│ I2C (SDA: GPIO 21, SCL: 22)  │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Ingestion REST Payload Format

Sensor nodes transmit JSON telemetry packets via HTTPS POST to `/api/v1/devices/{device_id}/telemetry`:

```json
{
  "farm_id": "farm-01",
  "source_type": "iot_sensor",
  "readings": [
    {
      "sensor_type": "moisture",
      "value": 28.4,
      "unit": "%"
    },
    {
      "sensor_type": "ph",
      "value": 6.75,
      "unit": "pH"
    },
    {
      "sensor_type": "temperature",
      "value": 26.8,
      "unit": "°C"
    },
    {
      "sensor_type": "electrical_conductivity",
      "value": 1.12,
      "unit": "dS/m"
    },
    {
      "sensor_type": "nitrogen",
      "value": 45.0,
      "unit": "kg/ha"
    },
    {
      "sensor_type": "phosphorus",
      "value": 22.0,
      "unit": "kg/ha"
    },
    {
      "sensor_type": "potassium",
      "value": 180.0,
      "unit": "kg/ha"
    }
  ]
}
```

---

## 3. Physical Boundary Validation Rules

The gateway strictly enforces the following validation checks prior to database persistence:

| Parameter | Allowed Range | Typical Agricultural Bounds | Action on Failure |
| :--- | :--- | :--- | :--- |
| **Moisture** | $0.0\% - 100.0\%$ | $10.0\% - 50.0\%$ | If $<0$ or $>100$, marked `is_outlier=1`, quality score set to $0.20$. |
| **Soil pH** | $3.0 - 11.0$ | $5.5 - 8.5$ | If $<3.0$ or $>11.0$, flagged as electrode malfunction. |
| **Temperature** | $-10.0^\circ\text{C} - 65.0^\circ\text{C}$ | $15.0^\circ\text{C} - 45.0^\circ\text{C}$ | Outside range flagged as thermal sensor disconnect. |
| **EC** | $0.0 - 20.0\,\text{dS/m}$ | $0.2 - 4.0\,\text{dS/m}$ | Outlier detected if salinity exceeds $20\,\text{dS/m}$. |

---

## 4. Duplicate & Heartbeat Filtering

- **Deduplication Window**: If identical readings arrive from the same device within 10 seconds, the gateway acknowledges receipt with `INGESTION_COMPLETE` but avoids redundant database record insertion.
- **Heartbeat & Stale Detection**: Devices that fail to report within 24 hours are transitioned to `STALE` status, and the central orchestrator applies an automatic hardware confidence penalty.
