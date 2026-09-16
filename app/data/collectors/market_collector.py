from app.services.market_service import get_market_prices

class MarketCollector:
    async def collect(self, state: str, district: str, commodity: str, start: str, end: str) -> dict:
        """
        Retrieves real-world market prices from OGD API for the specified criteria.
        """
        return await get_market_prices(
            state=state,
            district=district,
            commodity=commodity,
            start_date=start,
            end_date=end,
            limit=200
        )
