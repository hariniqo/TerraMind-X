import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

class SoilProvider:
    async def get_soil(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Base interface for soil intelligence queries.
        """
        raise NotImplementedError("SoilProvider subclass must implement get_soil method")


class UnavailableSoilProvider(SoilProvider):
    async def get_soil(self, latitude: float, longitude: float) -> Dict[str, Any]:
        logger.warning("Bhuvan/Soil Health Card API access requires credentials. Returning unavailable state.")
        return {
            "status": "unavailable",
            "reason": "credentials_or_access_required",
            "message": "Bhuvan Soil Card API integration requires agency authentication certificates."
        }


class BhuvanSoilProvider(SoilProvider):
    async def get_soil(self, latitude: float, longitude: float) -> Dict[str, Any]:
        # Future implementation stub
        return {"status": "unavailable", "reason": "unimplemented"}


# Active soil provider setup
_active_provider: SoilProvider = UnavailableSoilProvider()

def set_soil_provider(provider: SoilProvider) -> None:
    global _active_provider
    _active_provider = provider

async def get_soil(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Main entrypoint: delegates to the active SoilProvider implementation.
    """
    return await _active_provider.get_soil(latitude, longitude)


class SoilService:
    def get_soil_data(
        self,
        location: Optional[str] = None,
        crop: Optional[str] = None,
        ph: Optional[float] = None,
        nitrogen: Optional[float] = None,
        phosphorus: Optional[float] = None,
        potassium: Optional[float] = None,
        organic_carbon: Optional[float] = None,
        moisture: Optional[float] = None,
        soil_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        if ph is None and nitrogen is None and organic_carbon is None:
            return {"status": "unavailable", "message": "Soil data unavailable"}
        return {
            "status": "available",
            "location": location,
            "crop": crop,
            "ph": ph,
            "nitrogen": nitrogen,
            "phosphorus": phosphorus,
            "potassium": potassium,
            "organic_carbon": organic_carbon,
            "moisture": moisture,
            "soil_type": soil_type or "Red Loam",
            "source": "Soil Health Card / Bhuvan Soil Map",
            "confidence": 0.85 if ph is not None else 0.40
        }

    async def get_soil(self, latitude: float, longitude: float) -> Dict[str, Any]:
        return await get_soil(latitude, longitude)

