from sqlalchemy import Column, Integer, String, JSON, Text, DateTime, func
from app.db.base import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String(64), index=True, nullable=False)
    context = Column(JSON, nullable=False)
    decision = Column(JSON, nullable=False)
    tamil_explanation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
