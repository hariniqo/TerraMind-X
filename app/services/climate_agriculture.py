import logging

logger = logging.getLogger(__name__)

class ClimateAgricultureEngine:
    @staticmethod
    def get_agricultural_implications(risks: dict, crop: str = "groundnut") -> dict:
        """
        Translates climate risks into potential agricultural implications.
        Maintains cautious terminology ('Potential impact' instead of 'Certain outcome').
        """
        implications = []
        precautions = []
        adaptation = []

        heat_level = risks["heat_risk"]["level"]
        drought_level = risks["drought_risk"]["level"]
        rain_level = risks["heavy_rainfall_risk"]["level"]
        water_level = risks["water_stress_risk"]["level"]

        # General Crop Specific mapping
        if crop.lower() == "paddy":
            if heat_level == "HIGH":
                implications.append("Potential impact: High heat stress during grain filling may cause severe spikelet sterility.")
                adaptation.append("Action: Transplant heat-tolerant paddy cultivars (e.g. Sahbhagi Dhan).")
            if water_level in ["HIGH", "MODERATE"]:
                implications.append("Potential impact: Water table depletion may restrict traditional flood basin flooding cycles.")
                adaptation.append("Action: Transition to System of Rice Intensification (SRI) to reduce irrigation draw by 30%.")
            if rain_level == "HIGH":
                implications.append("Potential impact: Intense monsoon bursts may cause submergence rot in low-lying sections.")
                precautions.append("Caution: Avoid planting long-duration susceptible varieties. Switch to Swarna-Sub1.")
        
        elif crop.lower() == "tomato":
            if heat_level in ["HIGH", "MODERATE"]:
                implications.append("Potential impact: Blossom-end drop and reduced pollination efficiency due to higher day temperatures.")
                adaptation.append("Action: Install overhead shade netting (30-50% shade) to reduce canopy heat.")
            if rain_level == "HIGH":
                implications.append("Potential impact: High moisture levels increase susceptibility to early blight fungal pathogens.")
                precautions.append("Caution: Raise cultivation beds and use straw/plastic mulching to restrict water pooling.")
        
        elif crop.lower() == "groundnut":
            if heat_level == "HIGH":
                implications.append("Potential impact: Accelerated maturity cycle shortening pod growth and reducing crop yields.")
                adaptation.append("Action: Use heat-tolerant cultivars (e.g. Kadiri-6 or local dryland variants).")
            if drought_level == "HIGH":
                implications.append("Potential impact: Severe soil crusting may prevent pegging and pod penetration.")
                adaptation.append("Action: Apply organic crop residue straw mulch to conserve moisture and soften topsoil.")
                precautions.append("Caution: Sowing during peak dry spells increases seed germination failure.")

        else:
            # Fallback/Default
            if heat_level == "HIGH":
                implications.append("Potential impact: Higher evaporative demand leading to rapid crop moisture loss.")
                adaptation.append("Action: Increase organic matter to enhance soil moisture retention.")
            if drought_level == "HIGH":
                implications.append("Potential impact: Soil moisture depletion leading to early wilting.")
                adaptation.append("Action: Implement drip lines and apply organic mulching.")

        # Ensure we have at least one fallback implication
        if not implications:
            implications.append("Potential impact: Moderate weather fluctuations; crop growth remains stable.")
            adaptation.append("Action: Maintain standard biological farming practices.")

        return {
            "crop": crop,
            "implications": implications,
            "precautions": precautions if precautions else ["Caution: Monitor moisture fluctuations continuously."],
            "adaptation_options": adaptation
        }
