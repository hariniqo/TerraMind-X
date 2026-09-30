"""
Market data service — reads MarketPrice + MarketArrival from DB.
Provides cleaned, validated records to agents and ML pipeline.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import select, and_, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import District, GisMarketLocation, MarketPrice, MarketArrival
from app.core.logging import get_logger

logger = get_logger(__name__)


def _has_normalized_price_unit():
    return or_(
        MarketPrice.modal_price_qtl.is_not(None),
        MarketPrice.original_unit.ilike("%quintal%"),
        MarketPrice.original_unit.ilike("%qtl%"),
        MarketPrice.original_unit.ilike("%100 kg%"),
    )


async def get_price_records(
    db: AsyncSession,
    commodity: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    days_back: int = 365,
    limit: int = 500,
) -> List[Dict]:
    """
    Fetch real MarketPrice records for a commodity.
    Returns dicts (not ORM objects) so they're JSON-serialisable.
    Only verified/source_available records returned.
    """
    cutoff = date.today() - timedelta(days=days_back)
    stmt = (
        select(MarketPrice)
        .where(
            and_(
                MarketPrice.commodity.ilike(f"%{commodity}%"),
                MarketPrice.trading_date >= cutoff,
                MarketPrice.verification_status.in_(["verified", "source_available"]),
                MarketPrice.modal_price.is_not(None),
                _has_normalized_price_unit(),
                or_(
                    MarketPrice.quality_flags.is_(None),
                    ~MarketPrice.quality_flags.ilike("%unknown_price_unit%"),
                ),
            )
        )
    )
    if district:
        stmt = stmt.where(MarketPrice.district.ilike(f"%{district}%"))
    if state:
        stmt = stmt.where(MarketPrice.state.ilike(f"%{state}%"))

    stmt = stmt.order_by(desc(MarketPrice.trading_date)).limit(limit)

    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [_price_to_dict(r) for r in rows]

async def get_arrival_records(
    db: AsyncSession,
    commodity: str,
    district: Optional[str] = None,
    days_back: int = 180,
    limit: int = 300,
) -> List[Dict]:
    cutoff = date.today() - timedelta(days=days_back)
    stmt = (
        select(MarketArrival)
        .where(
            and_(
                MarketArrival.commodity.ilike(f"%{commodity}%"),
                MarketArrival.arrival_date >= cutoff,
            )
        )
    )
    if district:
        stmt = stmt.where(MarketArrival.district.ilike(f"%{district}%"))
    stmt = stmt.order_by(desc(MarketArrival.arrival_date)).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [_arrival_to_dict(r) for r in rows]


async def get_distinct_commodities(db: AsyncSession) -> List[str]:
    from sqlalchemy import distinct
    stmt = select(distinct(MarketPrice.commodity)).where(
        MarketPrice.verification_status.in_(["verified", "source_available"])
    ).order_by(MarketPrice.commodity)
    result = await db.execute(stmt)
    return [r[0] for r in result.fetchall() if r[0]]


async def get_mandi_price_groups(
    db: AsyncSession,
    commodity: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 1000,
) -> List[Dict]:
    """Return the latest and previous real price per mandi and commodity."""
    stmt = select(MarketPrice).where(
        MarketPrice.verification_status.in_(["verified", "source_available"]),
        MarketPrice.modal_price.is_not(None),
        _has_normalized_price_unit(),
        or_(MarketPrice.quality_flags.is_(None), ~MarketPrice.quality_flags.ilike("%unknown_price_unit%")),
    )
    if commodity:
        stmt = stmt.where(MarketPrice.commodity.ilike(f"%{commodity}%"))
    if district:
        stmt = stmt.where(MarketPrice.district.ilike(f"%{district}%"))
    if state:
        stmt = stmt.where(MarketPrice.state.ilike(f"%{state}%"))
    result = await db.execute(stmt.order_by(desc(MarketPrice.trading_date)).limit(limit))

    location_result = await db.execute(select(
        GisMarketLocation.market_name,
        GisMarketLocation.latitude,
        GisMarketLocation.longitude,
        District.name,
    ).outerjoin(District, GisMarketLocation.district_id == District.id))
    market_locations = {
        (market.casefold(), (district_name or "").casefold()): {"latitude": latitude, "longitude": longitude}
        for market, latitude, longitude, district_name in location_result.all()
        if market and latitude is not None and longitude is not None
    }

    grouped: Dict[tuple[str, str, str], List[Dict]] = {}
    for row in result.scalars():
        record = _price_to_dict(row)
        key = (row.market_name, row.district, row.commodity)
        grouped.setdefault(key, []).append(record)

    output = []
    for (market_name, market_district, crop), history_desc in grouped.items():
        latest = history_desc[0]
        coordinates = market_locations.get((market_name.casefold(), market_district.casefold()), {})
        output.append({
            "market_name": market_name,
            "location_id": None,
            "latitude": coordinates.get("latitude"),
            "longitude": coordinates.get("longitude"),
            "district": market_district,
            "commodity": crop,
            "latest": latest,
            "previous": history_desc[1] if len(history_desc) > 1 else None,
            "history": list(reversed(history_desc)),
        })
    return sorted(output, key=lambda market: market["latest"]["trading_date"] or "", reverse=True)


def _price_to_dict(r: MarketPrice) -> Dict:
    return {
        "id": r.id,
        "state": r.state,
        "district": r.district,
        "market_name": r.market_name,
        "commodity": r.commodity,
        "variety": r.variety,
        "min_price": r.min_price_qtl if r.min_price_qtl is not None else r.min_price,
        "max_price": r.max_price_qtl if r.max_price_qtl is not None else r.max_price,
        "modal_price": r.modal_price_qtl if r.modal_price_qtl is not None else r.modal_price,
        "modal_price_qtl": r.modal_price_qtl,
        "original_unit": r.original_unit,
        "normalized_unit": r.normalized_unit or ("quintal" if r.modal_price_qtl is not None else None),
        "price_unit": "quintal" if r.modal_price_qtl is not None else r.original_unit,
        "conversion_formula": r.conversion_formula,
        "arrival_quantity": r.arrival_quantity,
        "arrival_unit": r.arrival_unit,
        "trading_date": str(r.trading_date) if r.trading_date else None,
        "retrieved_at": str(r.retrieved_at) if r.retrieved_at else None,
        "fetched_at": str(r.fetched_at) if r.fetched_at else None,
        "source": r.source,
        "source_url": r.source_url,
        "source_record_id": r.source_record_id,
        "verification_status": r.verification_status,
        "provenance": r.provenance,
        "quality_flags": r.quality_flags,
        "needs_review": r.needs_review,
        "rolling_30d_avg": r.rolling_30d_avg,
        "day_over_day_pct_change": r.day_over_day_pct_change,
        "mandi_price_spread": r.mandi_price_spread,
        "festival_proximity": r.festival_proximity,
    }


def _arrival_to_dict(r: MarketArrival) -> Dict:
    return {
        "id": r.id,
        "market_name": r.market_name,
        "district": r.district,
        "commodity": r.commodity,
        "arrival_quantity": r.arrival_quantity,
        "arrival_unit": r.arrival_unit,
        "arrival_date": str(r.arrival_date) if r.arrival_date else None,
        "source": r.source,
        "source_url": r.source_url,
        "verification_status": r.verification_status,
        "provenance": r.provenance,
    }
