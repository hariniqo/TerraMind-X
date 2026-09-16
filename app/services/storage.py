from sqlalchemy.ext.asyncio import AsyncSession
from app.models.recommendation import Recommendation
from app.schemas.recommendation import FinalRecommendation


class RecommendationStore:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save(self, recommendation: FinalRecommendation, context: dict) -> Recommendation:
        record = Recommendation(
            farmer_id=recommendation.farmer_id,
            context=context,
            decision=recommendation.decision,
            tamil_explanation=recommendation.tamil_explanation,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

