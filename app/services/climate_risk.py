import logging

logger = logging.getLogger(__name__)

# Configurable thresholds
HEAT_TEMP_ANOMALY_HIGH = 1.5
HEAT_TEMP_ANOMALY_MOD = 0.8

COLD_TEMP_MIN_LOW = 12.0

DROUGHT_PRECIP_DEFICIT_HIGH = -15.0
DROUGHT_PRECIP_DEFICIT_MOD = -5.0

HEAVY_RAIN_DAYS_HIGH = 10.0
HEAVY_RAIN_DAYS_MOD = 5.0

WATER_STRESS_DEFICIT_HIGH = 0.25
WATER_STRESS_DEFICIT_MOD = 0.10

class ClimateRiskEngine:
    @staticmethod
    def evaluate_risk_level(score: float) -> str:
        if score >= 0.65:
            return "HIGH"
        elif score >= 0.35:
            return "MODERATE"
        return "LOW"

    @classmethod
    def calculate_risks(
        cls,
        temp_anomaly_c: float,
        precip_change_pct: float,
        heavy_rain_days_per_year: float,
        dry_days_offset: float,
        base_annual_precip_mm: float = 800.0
    ) -> dict:
        """
        Evaluate risks based on anomalies and parameters.
        Returns a dictionary of risk scores (0.0 to 1.0) and descriptive risk levels.
        """
        # 1. Heat Risk (temperature anomaly mapping)
        if temp_anomaly_c >= HEAT_TEMP_ANOMALY_HIGH:
            heat_score = 0.85
        elif temp_anomaly_c >= HEAT_TEMP_ANOMALY_MOD:
            heat_score = 0.55
        else:
            heat_score = 0.20
        
        # 2. Drought Risk (precipitation decrease anomaly mapping)
        if precip_change_pct <= DROUGHT_PRECIP_DEFICIT_HIGH:
            drought_score = 0.90
        elif precip_change_pct <= DROUGHT_PRECIP_DEFICIT_MOD:
            drought_score = 0.60
        else:
            drought_score = 0.25

        # Adjust drought score by dry days offset
        if dry_days_offset > 15:
            drought_score = min(1.0, drought_score + 0.15)

        # 3. Heavy Rainfall Risk (heavy rain days mapping)
        if heavy_rain_days_per_year >= HEAVY_RAIN_DAYS_HIGH:
            flood_score = 0.80
        elif heavy_rain_days_per_year >= HEAVY_RAIN_DAYS_MOD:
            flood_score = 0.50
        else:
            flood_score = 0.15

        # 4. Water Stress Risk (cumulative water deficit index)
        precip_deficit = max(0.0, -precip_change_pct / 100.0)
        if precip_deficit >= WATER_STRESS_DEFICIT_HIGH:
            water_stress_score = 0.85
        elif precip_deficit >= WATER_STRESS_DEFICIT_MOD:
            water_stress_score = 0.55
        else:
            water_stress_score = 0.20

        # 5. Cold Risk
        cold_score = 0.10  # Typically low in pilot South India locations (TN/Kerala plains)

        # 6. Overall Climate Risk Score
        overall_score = round(((heat_score + drought_score + flood_score + water_stress_score) / 4.0) * 100, 2)

        return {
            "heat_risk": {
                "score": round(heat_score, 2),
                "level": cls.evaluate_risk_level(heat_score)
            },
            "cold_risk": {
                "score": round(cold_score, 2),
                "level": cls.evaluate_risk_level(cold_score)
            },
            "drought_risk": {
                "score": round(drought_score, 2),
                "level": cls.evaluate_risk_level(drought_score)
            },
            "heavy_rainfall_risk": {
                "score": round(flood_score, 2),
                "level": cls.evaluate_risk_level(flood_score)
            },
            "water_stress_risk": {
                "score": round(water_stress_score, 2),
                "level": cls.evaluate_risk_level(water_stress_score)
            },
            "overall_risk_score": overall_score,
            "overall_risk_level": cls.evaluate_risk_level(overall_score / 100.0)
        }
