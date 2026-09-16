import datetime
import asyncio
import logging
from typing import Optional, Any
from app.schemas.recommendation import FarmContext, FinalRecommendation
from app.agents.council import CouncilOrchestrator
from app.services.weather_service import get_weather
from app.services.market_service import get_market_prices
from app.services.crop_service import get_crop_production
from app.services.soil_service import get_soil
from app.ml.features import build_crop_features

logger = logging.getLogger(__name__)

class AICouncil:
    def __init__(self) -> None:
        self.orchestrator = CouncilOrchestrator()

    async def generate(self, context: FarmContext, session: Optional[Any] = None) -> FinalRecommendation:
        from app.config.geography import resolve_state_district_from_coords
        from app.services.climate_projections_service import ClimateProjectionsService
        from app.services.future_climate_service import FutureClimateService
        
        # Ingest inputs
        target_crop = context.crop_history[-1] if context.crop_history else "tomato"
        lat = context.latitude or 9.9252
        lng = context.longitude or 78.1198
        
        # Resolve state and district dynamically from coordinates
        state, district = resolve_state_district_from_coords(lat, lng)
        
        # Execute external API ingestions concurrently
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        
        weather_task = get_weather(lat, lng, today_str, today_str)
        market_task = get_market_prices(state=state, district=district, commodity=target_crop)
        crop_task = get_crop_production(state=state, district=district, crop=target_crop)
        soil_task = get_soil(lat, lng)
        
        weather_data, market_data, crop_data, soil_data = await asyncio.gather(
            weather_task, market_task, crop_task, soil_task
        )
        
        # Fetch Climate data using the active DB session
        climate_data = {"status": "unavailable"}
        future_climate_ctx = {
            "scenario": "ssp245",
            "period": "2030",
            "temperature_anomaly": 1.1,
            "precipitation_anomaly": 5.2,
            "heat_risk": "MODERATE",
            "drought_risk": "LOW"
        }

        if session is not None:
            try:
                climate_service = ClimateProjectionsService()
                climate_data = await climate_service.get_projection(state, district, "ssp245", "2030", session)
                
                fut_service = FutureClimateService()
                loc_proj = await fut_service.get_location_projection(lat, lng, "ssp245", 2030, session)
                if loc_proj.get("status") != "unavailable":
                    future_climate_ctx = {
                        "scenario": "ssp245",
                        "period": "2030",
                        "temperature_anomaly": loc_proj["temperature"]["anomaly"],
                        "precipitation_anomaly": round(loc_proj["precipitation"]["anomaly_mm"], 2),
                        "heat_risk": loc_proj["climate_risk"]["heat_risk"],
                        "drought_risk": loc_proj["climate_risk"]["drought_risk"]
                    }
            except Exception as e:
                logger.error(f"Failed to query climate projections in council generate: {e}")
        
        # Build features from OGD and NASA feeds
        features = build_crop_features(
            market_data=market_data,
            crop_data=crop_data,
            weather_data=weather_data,
            soil_data=soil_data
        )
        
        # Formulate shared state context
        inputs = {
            "state": state,
            "district": district,
            "crop": target_crop,
            "latitude": lat,
            "longitude": lng,
            
            "weather_data": weather_data,
            "market_data": market_data,
            "crop_data": crop_data,
            "soil_data": soil_data,
            "climate_data": climate_data,
            "future_climate": future_climate_ctx,
            
            "features": features,
            
            "land_suitability": {},
            "market_risk": {},
            "agronomy_plan": {},
            "soil_sustainability": {}
        }
        
        # Run state graph orchestration
        result = await self.orchestrator.run(inputs)
        
        # Extract climate data sources if available
        data_sources = result.get("data_sources", [])
        if climate_data.get("status") != "unavailable" or "projection" in climate_data:
            data_sources.append(f"CMIP6 Climate Projections (Zenodo {DOI})")
            
        return FinalRecommendation(
            farmer_id=context.farmer_id,
            decision=result,
            tamil_explanation=result["explanation"],
            metadata={
                "data_sources": data_sources,
                "data_coverage": result["data_coverage"],
                "model_status": result["model_status"]
            }
        )


