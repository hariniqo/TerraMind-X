# Data Quality Report - Festival-Aware Agricultural Demand Dataset

This report documents the design, verification, coverage, missing values, and validations of the cultural and ritual agricultural demand dataset for Maharashtra, its neighbouring states, and Kerala (benchmark state).

## 1. Dataset Overview

The dataset maps the specific cultural and religious festivals celebrated in Maharashtra and surrounding regions to the crops they consume, offer, or require for decoration, along with historical demand spikes, retail prices, and quantities where documented.

- **Primary States covered:** Maharashtra, Goa, Gujarat, Telangana, Karnataka, Chhattisgarh, and Kerala (benchmark comparison).
- **Total Records:** 42 records across 16 different cultural and religious festivals.
- **Unique Crops Standardized:** Dill (Shepu), Fenugreek (Methi), Sorghum (Jowar), Mixed Vegetables (16 Varieties), Green Gram (Chana), Hyacinth Beans, Brinjal, Carrot, Sesame (Til), Jaggery, Dairy Milk, Almonds, Turmeric Leaves, Marigold, Apta Leaves, Mango Leaves, Neem Leaves/Flowers, Jackfruit, Mango, Pineapple, Banana, Citron, Pomelo, Mung Beans, Black Plum, Cucumber, Flat Beans, Pigeon Peas, Purple Yam, Tangedu Flowers, Chrysanthemum, Lotus, Jasmine, Rice Flour, Bamboo, Rice (Paddy), Golden Shower Flower, Golden Cucumber, Yam, Pumpkin.

## 2. Validation System & Execution Results

All records in the dataset are validated using the automated script `scripts/validate_festival_dataset.py` before integration. The script enforces five key validation rules:

### A. Duplicate Validation
- **Rule:** The combination of `festival + state + district + crop + year + source` must be unique.
- **Goal:** Prevent double-counting of mandi price spikes or temple procurement records for the same festival/crop in the same geography.
- **Status:** **Passed.** No duplicates exist in the finalized clean dataset.

### B. Date Validation
- **Rule:** `peak_demand_start <= peak_demand_end`.
- **Goal:** Ensure time interval boundaries are logical.
- **Status:** **Passed.** All start dates are chronological before or equal to their corresponding end dates.

### C. Numeric Validation
- **Rule:** Values in `price_per_unit`, `quantity`, and `price_arrival_change` must be numeric or NULL (blank).
- **Goal:** Eliminate corrupt strings, spelling variations, or units mixed in numeric fields.
- **Status:** **Passed.** All price and quantity fields contain valid numeric entries or null placeholders.

### D. Unit Validation
- **Rule:** Units must be standardized to: `kg`, `tonnes`, `pieces`, `stalks`, `pairs`.
- **Goal:** Avoid ambiguity in weight and count metrics (e.g. converting bundles or bags into standard kilograms/tonnes).
- **Status:** **Passed.** All records match the allowed units.

### E. Source Confidence Alignment
- **Rule:** Each record must map to a valid source in the Source Registry (`data/festival_agricultural_source_registry.csv`). Confidence score must exactly match the evidence type standard:
  - `Temple Procurement Records` -> `0.95`
  - `State Cultivation Campaigns` -> `0.90`
  - `Mandi Arrival Spikes` -> `0.85`
  - `Retail Price Surveys` -> `0.75`
  - `Academic Ethnography` -> `0.70`
  - `Cultural Custom Survey` -> `0.70`
- **Status:** **Passed.** Source integrity check succeeded for all records.

## 3. Data Quality Metrics

| State | Total Records | Verified Records | Partially Verified | Unverified | Average Price/Arrival Spike | Unique Crops |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Maharashtra | 19 | 14 | 5 | 0 | 114.74% | 13 |
| Goa | 7 | 4 | 3 | 0 | 72.14% | 7 |
| Gujarat | 7 | 6 | 1 | 0 | 47.14% | 7 |
| Telangana | 3 | 3 | 0 | 0 | 166.67% | 3 |
| Karnataka | 3 | 3 | 0 | 0 | 200.00% | 3 |
| Chhattisgarh | 3 | 2 | 1 | 0 | 71.67% | 3 |
| Kerala | 5 | 3 | 2 | 0 | 136.00% | 5 |

## 4. Missing Values & Corrections

- **Prices and Quantities:** Price and quantity columns contain missing values (`None`/`NaN`) where they are not officially recorded or where they vary highly by retail market. This is expected behavior and handled gracefully by the numeric parser.
- **District:** Regional festivals (like Makar Sankranti/Bhogi) that are celebrated statewide have their district fields set to `'Statewide'` to ensure uniformity.
- **Corrections Applied:** During cleaning, units were normalized from terms like `"stalk"` to `"stalks"`, and `"pair"` to `"pairs"`. Confidence scores were adjusted to align exactly with source tiers and evidence types.
