from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.market import MarketPrice
from app.schemas.market import MarketPriceOut, MarketTimeseriesPoint
from app.services.aggregation.timeseries import aggregate_timeseries

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/prices", response_model=list[MarketPriceOut])
def list_prices(
    commodity: str | None = None,
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(MarketPrice)
    if commodity:
        stmt = stmt.where(MarketPrice.commodity == commodity)
    if state:
        stmt = stmt.where(MarketPrice.state == state)
    if district:
        stmt = stmt.where(MarketPrice.district == district)
    if market:
        stmt = stmt.where(MarketPrice.market == market)
    if date_from:
        stmt = stmt.where(MarketPrice.arrival_date >= date_from)
    if date_to:
        stmt = stmt.where(MarketPrice.arrival_date <= date_to)
    stmt = stmt.order_by(MarketPrice.arrival_date.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt))


@router.get("/prices/timeseries", response_model=list[MarketTimeseriesPoint])
def price_timeseries(
    commodity: str,
    market: str | None = None,
    frequency: str = Query("monthly", pattern="^(daily|weekly|monthly|seasonal|yearly)$"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    """
    Historical daily/weekly/monthly/seasonal/yearly aggregates (mean,
    median, min, max, std dev, CoV, moving average, rolling volatility,
    price change, MoM/YoY change, trend) — see services/aggregation.
    """
    stmt = select(MarketPrice.arrival_date, MarketPrice.modal_price).where(MarketPrice.commodity == commodity)
    if market:
        stmt = stmt.where(MarketPrice.market == market)
    if date_from:
        stmt = stmt.where(MarketPrice.arrival_date >= date_from)
    if date_to:
        stmt = stmt.where(MarketPrice.arrival_date <= date_to)

    rows = db.execute(stmt).all()
    df = pd.DataFrame(rows, columns=["arrival_date", "modal_price"])
    if df.empty:
        return []

    agg = aggregate_timeseries(df, frequency)
    return [
        MarketTimeseriesPoint(
            period_start=row.period_start.date(),
            mean_price=_safe(row.mean),
            median_price=_safe(row.median),
            min_price=_safe(row.minimum),
            max_price=_safe(row.maximum),
            std_dev=_safe(row.std_dev),
            coefficient_of_variation=_safe(row.coefficient_of_variation),
            observation_count=int(row.observation_count),
        )
        for row in agg.itertuples()
    ]


def _safe(value):
    return None if pd.isna(value) else float(value)
