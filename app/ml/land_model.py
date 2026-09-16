import numpy as np

class LandSuitabilityModel:
    def predict_suitability(self, soil_type: str, ph: float, moisture: float, rainfall: float) -> dict[str, float]:
        """
        Simulated XGBoost model for crop suitability scoring.
        """
        soil = soil_type.lower()
        
        # XGBoost Decision Tree Rules for Groundnut
        groundnut_score = 0.5
        if "loam" in soil or "sandy" in soil:
            groundnut_score += 0.25
        if 5.5 <= ph <= 7.0:
            groundnut_score += 0.15
        if 20 <= moisture <= 50:
            groundnut_score += 0.1
        if rainfall < 60:
            groundnut_score += 0.05
            
        # XGBoost Decision Tree Rules for Tomato
        tomato_score = 0.5
        if "loam" in soil or "clay" in soil:
            tomato_score += 0.2
        if 6.0 <= ph <= 7.0:
            tomato_score += 0.15
        if 30 <= moisture <= 60:
            tomato_score += 0.1
        if 40 <= rainfall <= 100:
            tomato_score += 0.05

        # XGBoost Decision Tree Rules for Chilli
        chilli_score = 0.4
        if "loam" in soil or "black" in soil:
            chilli_score += 0.25
        if 6.0 <= ph <= 7.5:
            chilli_score += 0.15
        if 20 <= moisture <= 40:
            chilli_score += 0.1
        if rainfall < 80:
            chilli_score += 0.1
            
        return {
            "groundnut": round(float(np.clip(groundnut_score, 0.0, 1.0)), 4),
            "tomato": round(float(np.clip(tomato_score, 0.0, 1.0)), 4),
            "chilli": round(float(np.clip(chilli_score, 0.0, 1.0)), 4),
        }
