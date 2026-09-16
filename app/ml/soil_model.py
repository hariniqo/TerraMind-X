class SoilDegradationModel:
    def predict_degradation(self, ph: float, moisture: float, rainfall: float, crop_history: list[str]) -> dict:
        """
        Simulated Random Forest / XGBoost model for predicting soil degradation risk.
        """
        base_risk = 0.3
        
        # Risk factors
        if ph < 5.5 or ph > 8.0:
            base_risk += 0.2
        if moisture < 20:
            base_risk += 0.15
        if rainfall > 150: # Erosion due to heavy rains
            base_risk += 0.1
            
        # Monoculture risk
        if len(crop_history) >= 2 and len(set(crop_history)) == 1:
            base_risk += 0.2
            
        degradation_index = min(max(base_risk, 0.0), 1.0)
        
        hazards = []
        if degradation_index > 0.6:
            hazards.append("உயர் மண் அரிப்பு அபாயம் (High erosion risk)")
        if ph < 5.5:
            hazards.append("அமிலத்தன்மை அதிகரிப்பு (Acidification)")
        if len(crop_history) >= 2 and len(set(crop_history)) == 1:
            hazards.append("சத்து குறைபாடு (Nutrient depletion due to monoculture)")
            
        return {
            "degradation_index": round(degradation_index, 4),
            "hazard_level": "High" if degradation_index > 0.6 else "Medium" if degradation_index > 0.4 else "Low",
            "hazards": hazards
        }
