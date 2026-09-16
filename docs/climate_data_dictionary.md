# Climate Data Dictionary

This document serves as the registry for climate variables and dynamic agricultural suitability indicators calculated in TerraMind-X.

---

## 1. Raw Climatic Variables

These variables are parsed directly from the CMIP6 Zenodo files.

### 1.1 Precipitation (`pr`)
*   **Source File**: `PrecipData`
*   **Units**: mm / day
*   **Description**: Daily cumulative precipitation depth.
*   **Missing Value**: Typically represented as missing/empty column strings or out-of-range negative values. Checked and sanitized to `0.0`.

### 1.2 Maximum Daily Temperature (`tasmax`)
*   **Source File**: `TasmaxData`
*   **Units**: °C
*   **Description**: Maximum air temperature recorded at 2 meters height.

### 1.3 Minimum Daily Temperature (`tasmin`)
*   **Source File**: `TasminData`
*   **Units**: °C
*   **Description**: Minimum air temperature recorded at 2 meters height.

---

## 2. Derived Agricultural Suitability Indicators

TerraMind-X calculates five core agricultural suitability indicators. These indices are derived using the daily timeseries for a selected horizon year and emission scenario.

### 2.1 Temperature Suitability Index ($I_{temp}$)
Calculates how compatible the projected temperature is with the crop's biological growth range.

*   **Formula**:
    $$I_{temp} = \text{clip}\left(1.0 - \frac{|T_{avg} - T_{opt}|}{T_{opt} - T_{min\_grow}}, 0.0, 1.0\right)$$
    Where:
    *   $T_{avg} = \frac{T_{max\_mean} + T_{min\_mean}}{2}$
    *   $T_{opt}$ is the crop's optimal growing temperature.
    *   $T_{min\_grow}$ is the crop's absolute minimum threshold temperature.

*   **Crop Constants**:
    | Crop | $T_{opt}$ (°C) | $T_{min\_grow}$ (°C) |
    | :--- | :--- | :--- |
    | Paddy | 28.0 | 20.0 |
    | Tomato | 24.0 | 12.0 |
    | Groundnut | 27.0 | 15.0 |
    | Onion | 21.0 | 10.0 |
    | Chilli | 26.0 | 15.0 |
    | Banana | 27.0 | 16.0 |

### 2.2 Rainfall Suitability Index ($I_{rain}$)
Measures crop compatibility with projected cumulative rainfall.

*   **Formula**:
    $$I_{rain} = \exp\left( -\frac{(R_{annual} - R_{opt})^2}{2 \cdot \sigma_{rain}^2} \right)$$
    Where:
    *   $R_{annual}$ is the average annual projected rainfall.
    *   $R_{opt}$ is the crop's optimal annual water requirement.
    *   $\sigma_{rain}$ is a tolerance scale factor (width of the bell curve).

*   **Crop Constants**:
    | Crop | $R_{opt}$ (mm) | $\sigma_{rain}$ (mm) |
    | :--- | :--- | :--- |
    | Paddy | 1200.0 | 400.0 |
    | Tomato | 600.0 | 200.0 |
    | Groundnut | 500.0 | 150.0 |
    | Onion | 550.0 | 150.0 |
    | Chilli | 650.0 | 200.0 |
    | Banana | 1500.0 | 500.0 |

### 2.3 Heat Stress Exposure ($E_{heat}$)
Represents the hazard exposure to crop scorching.

*   **Formula**:
    $$E_{heat} = \frac{\text{Count of days with } T_{max} > 35^\circ\text{C}}{\text{Total Days in Period}}$$
    *   **Interpretation**: An annual value of $>0.20$ (i.e. more than 73 days above 35°C) indicates high heat risk, causing pollen sterility and blossom drop in sensitive crops.

### 2.4 Drought Exposure ($E_{drought}$)
Quantifies long-term rainfall deficit.

*   **Formula**:
    $$E_{drought} = \max\left(0.0, 1.0 - \frac{R_{annual}}{R_{baseline\_annual}}\right)$$
    Where:
    *   $R_{baseline\_annual}$ is the baseline historical precipitation (1981–2010 mean).
    *   **Interpretation**: Deficits exceeding 15% ($0.15$) represent drought risk for rainfed crops, indicating irrigation must be added.

### 2.5 Rainfall Variability Index ($V_{rain}$)
Reflects seasonal monsoon instability.

*   **Formula**:
    $$V_{rain} = \frac{\text{Standard Deviation of Monthly Rainfall}}{\text{Mean Monthly Rainfall}}$$
    *   **Interpretation**: High variability indicates erratic monsoons, requiring multi-seasonal reservoirs.
