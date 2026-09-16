from app.services.soil_service import get_soil

class SoilCollector:
    async def collect(self, latitude: float, longitude: float) -> dict:
        """
        Retrieves soil card details from the active SoilProvider.
        """
        return await get_soil(latitude, longitude)
