import logging
from typing import Dict, Any, List, Optional
from app.schemas.sustainability import (
    SustainabilityInput,
    SustainabilityAnalysisResponse,
    FarmLocationInput,
    SoilInput,
    CropInput,
    WaterInput,
    FarmManagementInput,
    ClimateInput,
    SatelliteInput,
    IrrigationMethod
)
from app.services.sustainability_engine import SustainabilityEngine
from app.services.regional_cultivation_service import RegionalCultivationService
from app.services.gis_service import GISService
from app.services.llm_provider import LLMProvider

logger = logging.getLogger(__name__)


class MaharashtraSustainabilityService:
    """
    High-level orchestration service for Maharashtra Sustainability & Carbon Intelligence.
    Coordinates database queries, regional cultivation benchmarks, scientific calculations,
    and bilingual natural language synthesis via NVIDIA NIM / LLM Provider.
    """

    def __init__(self) -> None:
        self.engine = SustainabilityEngine()
        self.regional_service = RegionalCultivationService()
        self.gis = GISService()
        self.llm = LLMProvider()

    async def analyze_farm_sustainability(
        self,
        payload: SustainabilityInput,
        session: Optional[Any] = None
    ) -> SustainabilityAnalysisResponse:
        """
        Executes full sustainability intelligence analysis with zero data fabrication.
        """
        farm_loc = payload.farm or FarmLocationInput()
        
        # Spatial resolution of district/state if coordinates are provided
        if farm_loc.latitude is not None and farm_loc.longitude is not None:
            detected_state, detected_dist = self.gis.detect_state_and_district(farm_loc.latitude, farm_loc.longitude)
            if detected_state:
                farm_loc.state = detected_state
            if detected_dist:
                farm_loc.district = detected_dist
                
        # Run scientific engine calculations
        result: SustainabilityAnalysisResponse = self.engine.analyze(payload)
        
        # Synthesize explainable bilingual AI advisory via NVIDIA NIM with local fallback
        try:
            prompt_context = {
                "district": result.district,
                "sustainability_score": result.sustainability_score,
                "sustainability_rating": result.sustainability_rating,
                "confidence": result.score_confidence_pct,
                "soil_carbon": result.soil_carbon.carbon_status,
                "water_method": result.water_sustainability.irrigation_method.value,
                "water_efficiency": result.water_sustainability.water_efficiency_pct,
                "emissions": result.carbon_footprint.estimated_emissions_kg_co2e_per_ha,
                "sequestration": result.carbon_sequestration.sequestration_rate_t_co2e_per_ha_yr,
                "credit_status": result.carbon_credit_assessment.potential_eligibility.value,
                "climate_risk": result.climate_resilience.drought_risk.value
            }
            
            prompt = (
                f"You are the TerraMind-X Sustainability Intelligence Agent for Maharashtra. "
                f"Given the following validated scientific measurements: {prompt_context}. "
                f"Write a concise, 3-sentence advisory for the farmer in English explaining their soil health, "
                f"water optimization, and carbon footprint. Do NOT invent or alter any numerical values."
            )
            
            ai_explanation = await self.llm.generate_text(prompt)
            if ai_explanation and len(ai_explanation.strip()) > 20:
                result.english_advisory = ai_explanation.strip()
        except Exception as e:
            logger.warning(f"LLM advisory generation encountered fallback: {e}")
            
        return result

    def get_district_sustainability_summary(self, district: str) -> Dict[str, Any]:
        """
        Retrieves regional sustainability and crop diversification profile for a Maharashtra district.
        """
        cultivation_profile = self.regional_service.get_regional_profile("Maharashtra", district)
        
        # Water intensity assessment for the district
        dominant_crop = cultivation_profile.dominant_crop
        crop_clean = dominant_crop.lower()
        
        water_stress = "MODERATE"
        if crop_clean in ["sugarcane", "paddy", "rice"]:
            water_stress = "HIGH"
        elif crop_clean in ["bajra", "jowar", "gram", "chickpea"]:
            water_stress = "LOW"
            
        return {
            "state": "Maharashtra",
            "district": district,
            "cultivation_profile": cultivation_profile.model_dump(),
            "dominant_crop": dominant_crop,
            "regional_concentration_hhi": cultivation_profile.hhi_index,
            "concentration_category": getattr(cultivation_profile.concentration_level, "value", str(cultivation_profile.concentration_level)),
            "district_water_stress_category": water_stress,
            "common_rotation_systems": [
                f"{dominant_crop} - Chickpea (Gram)",
                f"{dominant_crop} - Soybean / Green Manure",
                f"{dominant_crop} - Fallow / Summer Pulse"
            ],
            "benchmark_sources": [
                "Mahatma Phule Krishi Vidyapeeth (MPKV)",
                "ICAR - NBSS&LUP Nagpur",
                "Maharashtra Department of Agriculture (DES Statistics)"
            ]
        }

    def get_all_maharashtra_districts_summary(self) -> List[Dict[str, Any]]:
        """
        Returns high-level sustainability & crop diversification overview for all 36 Maharashtra districts.
        """
        districts = [
            "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana",
            "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna",
            "Kolhapur", "Latur", "Mumbai", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar",
            "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri",
            "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
        ]
        
        results = []
        for dist in districts:
            results.append(self.get_district_sustainability_summary(dist))
        return results
