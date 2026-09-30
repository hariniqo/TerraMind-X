"""
Agent 2 — Market Risk Agent
"If I grow this crop, what market risk will I face?"

Inputs (all from DB — real records only):
  MarketPrice     → price level, volatility (CV), trend
  MarketArrival   → supply/arrival pressure
  BuyerDemand     → demand strength (buyer count + qty)
  CultivationRecord → competition / oversupply risk
  WeatherObservation → context only (not scored)

Missing components are EXCLUDED from score (never zeroed).
Every component is traceable: entity → source → timestamp → provenance.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.logging import get_logger

logger = get_logger(__name__)

REF_SOURCE = "AGMARKNET / data.gov.in market records"
COMPONENT_NAMES = [
    "Price volatility", "Price trend",
    "Supply / Arrival pressure", "Buyer demand",
    "Competition", "Sell window",
]


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _cv(values: List[float]) -> Optional[float]:
    if len(values) < 2:
        return None
    mean = np.mean(values)
    return (float(np.std(values)) / mean) if mean > 0 else None


@dataclass
class MarketRiskResult:
    status: str
    location: Optional[Dict] = None
    crop: Optional[Dict] = None
    available_crops: List[str] = field(default_factory=list)
    price_summary: Optional[Dict] = None
    score: Optional[float] = None
    confidence: Optional[float] = None
    confidence_note: str = ""
    verdict: Optional[str] = None
    components: List[Dict] = field(default_factory=list)
    unavailable_components: List[str] = field(default_factory=list)
    evidence: List[Dict] = field(default_factory=list)
    data_status: Optional[Dict] = None
    recommendations: List[str] = field(default_factory=list)
    ref_source: str = REF_SOURCE
    assessed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return self.__dict__


def assess_market_risk(
    district: str,
    state: str,
    commodity: str,
    price_records: List[Dict],       # MarketPrice rows for this commodity+district
    arrival_records: List[Dict],     # MarketArrival rows
    demand_records: List[Dict],      # BuyerDemand rows
    cultivation_records: List[Dict], # CultivationRecord rows
    sowing_months: List[int] = None,
    harvest_days: int = 120,
) -> MarketRiskResult:

    result = MarketRiskResult(
        status="ok",
        location={"district": district, "state": state},
        crop={"name": commodity},
    )

    if not price_records:
        result.status = "no_market_data"
        result.unavailable_components = COMPONENT_NAMES
        result.confidence = 0.0
        result.confidence_note = "No real MarketPrice records found for this commodity and district."
        return result

    # Sort prices newest first
    price_records = sorted(price_records, key=lambda r: r.get("trading_date", ""), reverse=True)
    latest = price_records[0]
    window = price_records[:12]
    modal_series = [float(r["modal_price"]) for r in window if r.get("modal_price") is not None]
    baseline_rows = price_records[1:11]
    baseline_avg = np.mean([float(r["modal_price"]) for r in baseline_rows if r.get("modal_price")]) if len(baseline_rows) >= 2 else None

    change_pct = None
    if baseline_avg and baseline_avg > 0:
        change_pct = round(((float(latest["modal_price"]) - baseline_avg) / baseline_avg) * 100, 1)

    vol = _cv(modal_series)
    result.price_summary = {
        "latest": float(latest["modal_price"]),
        "min": float(latest.get("min_price") or min(modal_series)),
        "max": float(latest.get("max_price") or max(modal_series)),
        "baseline": round(baseline_avg, 2) if baseline_avg else None,
        "change_pct": change_pct,
        "volatility": round(vol * 100, 1) if vol is not None else None,
        "trading_date": latest.get("trading_date"),
        "price_unit": latest.get("original_unit") or "quintal",
        "source": latest.get("source", REF_SOURCE),
        "source_url": latest.get("source_url"),
        "records": len(price_records),
        "verification_status": latest.get("verification_status"),
        "rolling_30d_avg": latest.get("rolling_30d_avg"),
        "day_over_day_pct_change": latest.get("day_over_day_pct_change"),
        "mandi_price_spread": latest.get("mandi_price_spread"),
        "festival_proximity": latest.get("festival_proximity"),
        "needs_review": latest.get("needs_review", False),
        "provenance": "REAL",
    }

    components = []

    # Price volatility
    if vol is not None:
        components.append({
            "name": "Price volatility",
            "score": _clamp(round(100 - vol * 100 * 3), 0, 100),
            "value": f"CV {round(vol*100,1)}%",
            "target": "lower volatility = more stable",
            "source_entity": "MarketPrice",
            "source_name": latest.get("source", REF_SOURCE),
            "record_count": len(price_records),
            "latest_timestamp": latest.get("trading_date"),
            "location": district,
            "verification_status": latest.get("verification_status"),
            "provenance": "REAL",
        })

    # Price trend
    if change_pct is not None:
        components.append({
            "name": "Price trend",
            "score": _clamp(round(100 + change_pct * 2.5), 0, 100),
            "value": f"{'▲' if change_pct > 0 else '▼'} {abs(change_pct)}% vs 10-day avg",
            "target": "rising/stable = better for sellers",
            "source_entity": "MarketPrice",
            "source_name": latest.get("source", REF_SOURCE),
            "record_count": len(price_records),
            "latest_timestamp": latest.get("trading_date"),
            "location": district,
            "verification_status": latest.get("verification_status"),
            "provenance": "REAL",
        })

    # Supply/Arrival pressure
    if len(arrival_records) >= 2:
        arrival_records = sorted(arrival_records, key=lambda r: r.get("arrival_date", ""), reverse=True)
        latest_arr = arrival_records[0]
        base_arr_avg = np.mean([float(r["arrival_quantity"]) for r in arrival_records[1:11] if r.get("arrival_quantity") is not None])
        latest_qty = float(latest_arr.get("arrival_quantity", 0) or 0)
        if base_arr_avg > 0:
            arr_change = ((latest_qty - base_arr_avg) / base_arr_avg) * 100
            components.append({
                "name": "Supply / Arrival pressure",
                "score": _clamp(round(100 - arr_change * 1.5), 0, 100),
                "value": f"{latest_qty} {latest_arr.get('arrival_unit','')} (latest)",
                "target": f"{round(base_arr_avg)} {latest_arr.get('arrival_unit','')} (10-day avg)",
                "source_entity": "MarketArrival",
                "source_name": latest_arr.get("source", REF_SOURCE),
                "record_count": len(arrival_records),
                "latest_timestamp": latest_arr.get("arrival_date"),
                "location": district,
                "verification_status": latest_arr.get("verification_status"),
                "provenance": "REAL",
            })

    # Buyer demand
    if demand_records:
        buyer_count = len(set(r.get("buyer_id") for r in demand_records if r.get("buyer_id"))) or len(demand_records)
        total_qty = sum(float(r.get("required_quantity") or 0) for r in demand_records)
        d0 = demand_records[0]
        components.append({
            "name": "Buyer demand",
            "score": _clamp(50 + buyer_count * 12, 0, 100),
            "value": f"{buyer_count} buyer{'s' if buyer_count>1 else ''} · {total_qty} {d0.get('quantity_unit','')}",
            "target": "more buyers = stronger offtake",
            "source_entity": "BuyerDemand",
            "source_name": d0.get("source", "BuyerDemand records"),
            "record_count": len(demand_records),
            "latest_timestamp": d0.get("demand_date") or d0.get("retrieved_at"),
            "location": district,
            "verification_status": d0.get("verification_status"),
            "provenance": "REAL",
        })

    # Competition
    if cultivation_records:
        total_area = sum(float(r.get("cultivated_area") or 0) for r in cultivation_records)
        c0 = cultivation_records[0]
        components.append({
            "name": "Competition",
            "score": _clamp(round(100 - total_area * 2), 0, 100),
            "value": f"{total_area} {c0.get('area_unit','ha')} under {commodity}",
            "target": "less area = less oversupply risk",
            "source_entity": "CultivationRecord",
            "source_name": c0.get("source", "Cultivation records"),
            "record_count": len(cultivation_records),
            "latest_timestamp": c0.get("retrieved_at"),
            "location": district,
            "verification_status": c0.get("verification_status"),
            "provenance": "REAL",
        })

    # Sell window
    current_month = datetime.utcnow().month
    if sowing_months:
        sow_ok   = current_month in sowing_months
        sow_near = any(abs(m-current_month)<=1 or abs(m-current_month)>=11 for m in sowing_months)
        harvest_month = None
        if sowing_months:
            nearest = min(sowing_months, key=lambda m: min(abs(m-current_month), 12-abs(m-current_month)))
            harvest_month = ((nearest - 1 + round(harvest_days / 30)) % 12) + 1
        mnames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        components.append({
            "name": "Sell window",
            "score": 100 if sow_ok else (60 if sow_near else 30),
            "value": f"Harvest ~{mnames[harvest_month-1]}" if harvest_month else "—",
            "target": f"sow {','.join(mnames[m-1] for m in sowing_months)} · {harvest_days}d cycle",
            "source_entity": "ICAR reference",
            "source_name": REF_SOURCE,
            "record_count": None,
            "latest_timestamp": None,
            "location": district,
            "verification_status": None,
            "provenance": "REFERENCE",
        })

    result.components = components
    present_names = {c["name"] for c in components}
    result.unavailable_components = [n for n in COMPONENT_NAMES if n not in present_names]

    # Weighted score
    weights = {
        "Price volatility": 0.22, "Price trend": 0.22,
        "Supply / Arrival pressure": 0.18, "Buyer demand": 0.18,
        "Competition": 0.10, "Sell window": 0.10,
    }
    total_w = sum(weights.get(c["name"], 0) for c in components)
    result.score = round(
        sum(weights.get(c["name"], 0) * c["score"] for c in components) / total_w
    ) if total_w > 0 else 0

    # Confidence
    reductions = []
    if len(price_records) < 2: reductions.append("limited price history")
    if not demand_records:     reductions.append("no verified buyer-demand data")
    if not cultivation_records:reductions.append("no cultivation/competition data")
    if not arrival_records:    reductions.append("no arrival data")
    result.confidence = max(20, 100 - len(reductions) * 15)
    result.confidence_note = (
        f"Reduced because: {', '.join(reductions)}" if reductions
        else "All key data sources available"
    )

    result.verdict = ("Low risk" if result.score >= 70 else
                      "Medium risk" if result.score >= 50 else "High risk")

    # Evidence
    result.evidence = [
        {"entity": "MarketPrice",       "present": bool(price_records),       "record_count": len(price_records),       "source_name": latest.get("source"), "provenance": "REAL"},
        {"entity": "MarketArrival",     "present": bool(arrival_records),     "record_count": len(arrival_records),     "source_name": arrival_records[0].get("source") if arrival_records else None, "provenance": "REAL"},
        {"entity": "BuyerDemand",       "present": bool(demand_records),      "record_count": len(demand_records),      "source_name": demand_records[0].get("source") if demand_records else None, "provenance": "REAL"},
        {"entity": "CultivationRecord", "present": bool(cultivation_records), "record_count": len(cultivation_records), "source_name": cultivation_records[0].get("source") if cultivation_records else None, "provenance": "REAL"},
    ]

    result.data_status = {
        "real_data": True,
        "source_verified": bool(price_records),
        "timestamp_available": bool(latest.get("trading_date")),
        "components_available": len(components),
        "components_total": len(COMPONENT_NAMES),
        "missing": result.unavailable_components,
    }

    # Recommendations (evidence-supported only)
    recs = []
    get = lambda n: next((c for c in components if c["name"] == n), None)
    pt = get("Price trend")
    arr = get("Supply / Arrival pressure")
    comp = get("Competition")
    dem = get("Buyer demand")
    if pt and pt["score"] < 50:   recs.append("Price trend declining — compare alternative mandis")
    if arr and arr["score"] < 50: recs.append("Rising arrivals — avoid synchronized selling (oversupply risk)")
    if comp and comp["score"] < 50: recs.append("High area under this crop — diversify or stagger sowing")
    if dem and dem["score"] >= 70:  recs.append("Strong buyer offtake — secure a forward commitment before sowing")
    if not demand_records:          recs.append("Buyer demand unknown — verify offtake before committing large area")
    if result.verdict == "High risk": recs.append("Consider a lower-risk crop or staggered sowing")
    if not recs: recs.append("Market conditions appear favorable — proceed with standard sowing plan")
    result.recommendations = recs

    return result
