from app.services.crop_service import get_crop_production

class CropCollector:
    async def collect(self, state: str, district: str, crop: str, start_year: int, end_year: int) -> dict:
        """
        Retrieves real-world crop production stats from official sources.
        """
        return await get_crop_production(
            state=state,
            district=district,
            crop=crop,
            start_year=start_year,
            end_year=end_year
        )
