from app.services.weather_service import get_weather

class WeatherCollector:
    async def collect(self, latitude: float, longitude: float, start: str, end: str) -> dict:
        """
        Retrieves real-world meteorological parameters from NASA POWER.
        """
        return await get_weather(
            latitude=latitude,
            longitude=longitude,
            start_date=start,
            end_date=end
        )
