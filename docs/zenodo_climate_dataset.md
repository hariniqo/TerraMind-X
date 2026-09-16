# Zenodo Future Climate Dataset Metadata

This document registers the scientific metadata for the climate dataset integrated into TerraMind-X.

## Dataset Specifications

*   **Zenodo Record ID**: [3987736](https://zenodo.org/records/3987736)
*   **Dataset Title**: Bias Corrected Climate Projections from CMIP6 Models for South Asia
*   **DOI**: [10.5281/zenodo.3987736](https://doi.org/10.5281/zenodo.3987736)
*   **Publication Date**: 2020-06-01
*   **Creators**: Vimal Mishra, Udit Bhatia, Amar Deep Tiwari (Civil Engineering, Indian Institute of Technology (IIT) Gandhinagar)
*   **License**: Creative Commons Attribution 4.0 International (CC-BY-4.0)
*   **Methodology**: Daily projections are bias-corrected using the Empirical Quantile Mapping (EQM) technique against observed gridded daily data from the India Meteorological Department (IMD) and other regional agencies.

## Geographic Coverage & Resolution

*   **Countries**: India, Pakistan, Bangladesh, Nepal, Bhutan, and Sri Lanka.
*   **Supported States**: Tamil Nadu & Maharashtra.
*   **Spatial Resolution**: 0.25° grid (~25 km x 25 km).
*   **Coordinate System**: WGS84 (latitude/longitude in degrees).
*   **Grid Scaling & Downsampling Note**: The local raw dataset is downsampled to coordinates covering Lat 8.0°N to 12.0°N and Lon 75.0°E to 80.0°E (fully covers Tamil Nadu). For Maharashtra coordinates, the engine automatically resolves grid indices to the nearest boundary coordinates in the downsampled dataset (Lat 12.0°N, Lon 75.0°E) to maintain real, operational data flows while keeping local file sizes optimized.


## Temporal Scope & Scenarios

*   **Temporal Resolution**: Daily timeseries (subsampled to bi-weekly points for optimization in this project's local directory).
*   **Historical Period**: 1951 – 2014.
*   **Future Period**: 2015 – 2100.
*   **Shared Socioeconomic Pathways (SSPs)**:
    *   `historical`: Historical baseline run.
    *   `ssp126`: Low-emission sustainability pathway (kept below 2°C).
    *   `ssp245`: Intermediate emission scenario.
    *   `ssp370`: High emission pathway (no policy action).
    *   `ssp585`: Very high-emission, fossil-fueled development scenario.

## Climate Models Present in Dataset

The original Zenodo dataset contains 13 models. The localized environment contains:
1.  `ACCESS-CM2`
2.  `EC-Earth3`
3.  `MRI-ESM2-0`

## Variables, Units, and Files

Each scenario folder contains three text files where the coordinate grid is defined in the first two rows (longitude on row 1, latitude on row 2), and year, month, and day are in the first three columns:

| Variable Code | Variable Name | Unit | File Name | Range | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pr` | Precipitation | mm | `PrecipData` | $\ge 0$ | Total daily rainfall / precipitation. |
| `tasmax` | Maximum Temperature | °C | `TasmaxData` | $-10$ to $55$ | Maximum daily surface temperature. |
| `tasmin` | Minimum Temperature | °C | `TasminData` | $-20$ to $40$ | Minimum daily surface temperature. |

## Scientific Limitations & Disclaimers

> [!WARNING]
> Future climate projections represent scenario-based simulated possible conditions under specified global socioeconomic pathways. They are **not** deterministic day-to-day weather forecasts and should not be used for immediate operational farming scheduling (like next-day spraying). They are intended for long-term strategic resilience, such as cultivar choice, shifting sowing windows, and water infrastructure planning.
