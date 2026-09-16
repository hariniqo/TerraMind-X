import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.services.weather_service import get_weather
from app.services.market_service import get_market_prices

logger = logging.getLogger(__name__)

class DataGateway:
    def __init__(self) -> None:
        pass

    async def ingest_weather_observation(
        self,
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """
        Fetch latest 7 days historical reanalysis parameters from NASA POWER.
        """
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        logger.info(f"Gateway trigger: NASA POWER fetch for point ({latitude}, {longitude})")
        res = await get_weather(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date
        )
        return res

    async def ingest_market_prices(
        self,
        state: str,
        district: str,
        crop: str
    ) -> Dict[str, Any]:
        """
        Fetch recent arrivals rates from data.gov.in (AGMARKNET).
        """
        logger.info(f"Gateway trigger: Market rates ingest for {crop} in {district}, {state}")
        res = await get_market_prices(
            state=state,
            district=district,
            commodity=crop
        )
        return res

    async def ingest_satellite_sentinel_ndvi(
        self,
        farm_id: str,
        latitude: float = 9.9833,
        longitude: float = 78.3333
    ) -> Dict[str, Any]:
        """
        Query Sentinel-2 NDVI telemetry values for target farm.
        """
        logger.info(f"Gateway trigger: Sentinel NDVI telemetry update for farm {farm_id}")
        from app.services.ndvi_service import get_sentinel_ndvi
        return await get_sentinel_ndvi(latitude, longitude, farm_id)

    async def ingest_climate_projections(
        self,
        state: str,
        district: str,
        latitude: float,
        longitude: float,
        session: Any
    ) -> Dict[str, Any]:
        """
        Fetch long term climate projection metrics from CMIP6 database.
        """
        logger.info(f"Gateway trigger: Climate projections ingest for {district}, {state}")
        from app.services.climate_projections_service import ClimateProjectionsService
        climate_service = ClimateProjectionsService()
        res = await climate_service.get_projection(state, district, "ssp245", "2030", session)
        return res

    async def run_full_pipeline(
        self,
        state: str,
        district: str,
        crop: str,
        latitude: float,
        longitude: float,
        farm_id: str,
        session: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates all sources and builds a single consolidated state packet.
        """
        weather = await self.ingest_weather_observation(latitude, longitude)
        market = await self.ingest_market_prices(state, district, crop)
        satellite = await self.ingest_satellite_sentinel_ndvi(farm_id, latitude, longitude)
        
        climate = {"status": "unavailable"}
        if session is not None:
            try:
                climate = await self.ingest_climate_projections(state, district, latitude, longitude, session)
            except Exception as e:
                logger.error(f"Gateway climate projection ingestion failed: {e}")
        
        return {
            "weather_observation": weather,
            "market_observation": market,
            "satellite_observation": satellite,
            "climate_observation": climate,
            "timestamp": datetime.now().isoformat()
        }

