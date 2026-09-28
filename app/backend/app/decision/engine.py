"""
Decision Engine — Phase 6
Combines outputs from all 4 agents + ML forecast + competition + demand signals
into a final structured recommendation.

Weights are documented and configurable — not hidden.
Every output carries evidence, data_quality, and provenance.
Never produces a recommendation when critical data is absent.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger

logger = get_logger(__name__)

# ── Configurable scoring weights ──────────────────────────────────────────────
# These are implementation defaults. Override via config or API param.
# Source: balanced expert judgment — not trained from data.
DEFAULT_WEIGHTS = {
    "crop_suitability": 0.25,
    "market_risk":      0.30,
    "soil_health":      0.15,
    "sustainability":   0.15,
    "competition":      0.15,
}

# Risk level → colour for UI
RISK_COLOUR = {
    "Low":      "green",
    "Medium":   "amber",
    "High":     "red",
    "Critical": "red",
}


def _clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, x))


@dataclass
class DecisionResult:
    request_id: str
    status: str                              # success / partial_data / data_insufficient
    location: Dict = field(default_factory=dict)
    commodity: Optional[str] = None

    # Agent scores (0-100, None = agent had insufficient data)
    crop_suitability_score: Optional[float] = None
    market_risk_score:      Optional[float] = None
    soil_health_score:      Optional[float] = None
    sustainability_score:   Optional[float] = None

    # Market forecast
    market_forecast: Optional[Dict] = None

    # Competition analysis (SDBI)
    competition: Optional[Dict] = None

    # Festival demand signal
    festival_demand: Optional[Dict] = None

    # Final decision
    decision_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_colour: Optional[str] = None
    confidence: Optional[float] = None
    data_quality: Optional[str] = None

    # Recommendations
    recommended_crops: List[Dict] = field(default_factory=list)
    sale_window: Optional[Dict] = None
    recommended_markets: List[Dict] = field(default_factory=list)
    buyers: List[Dict] = field(default_factory=list)

    # Explainability
    evidence: List[Dict] = field(default_factory=list)
    why_this_crop: List[str] = field(default_factory=list)
    why_this_market: List[str] = field(default_factory=list)
    why_this_time: List[str] = field(default_factory=list)
    what_data_supports: List[str] = field(default_factory=list)
    what_data_missing: List[str] = field(default_factory=list)
    what_could_change: List[str] = field(default_factory=list)

    # Weights used (for transparency)
    weights_used: Dict = field(default_factory=dict)

    # Model metadata
    model_metadata: Optional[Dict] = None

    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return {k: v for k, v in self.__dict__.items()}


def run_decision_engine(
    request_id: str,
    location: Dict,
    commodity: Optional[str],
    crop_suitability_result: Optional[Any],   # CropSuitabilityResult or None
    market_risk_result: Optional[Any],         # MarketRiskResult or None
    soil_health_result: Optional[Any],         # SoilHealthResult or None
    sustainability_result: Optional[Any],      # SustainabilityResult or None
    market_forecast: Optional[Dict],
    competition: Optional[Dict] = None,
    festival_demand: Optional[Dict] = None,
    buyers: Optional[List[Dict]] = None,
    weights: Optional[Dict] = None,
) -> DecisionResult:
    """
    Combine 4-agent outputs into a single decision.

    Scoring:
      Each agent provides a score 0-100.
      Missing agent scores are excluded — weights are renormalized.
      Final score = weighted average of available agent scores.
    """
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    decision = DecisionResult(
        request_id=request_id,
        location=location,
        commodity=commodity,
        weights_used=w,
    )
    decision.buyers = buyers or []
    decision.market_forecast = market_forecast
    decision.competition = competition
    decision.festival_demand = festival_demand

    # ── Extract agent scores ───────────────────────────────────────────────────
    agent_scores: Dict[str, Optional[float]] = {}
    missing_data: List[str] = []
    evidence: List[Dict] = []

    # Crop suitability
    if crop_suitability_result and getattr(crop_suitability_result, "status", None) == "ok":
        top = crop_suitability_result.recommendations[0] if crop_suitability_result.recommendations else None
        cs_score = float(top["score"]) if top else None
        agent_scores["crop_suitability"] = cs_score
        decision.crop_suitability_score = cs_score
        if top:
            evidence.append({
                "agent": "CropSuitabilityAgent",
                "present": True,
                "detail": f"Top crop: {top['crop']} · score {top['score']} · {top['verdict']}",
                "provenance": "DERIVED",
            })
            decision.recommended_crops = [
                {
                    "crop":                  r["crop"],
                    "key":                   r["key"],
                    "score":                 r["score"],
                    "verdict":               r["verdict"],
                    "confidence":            r["confidence"],
                    "sowing_months":         r["sowing_months"],
                    "harvest_days":          r["harvest_days"],
                    "preferred_by_farmer":   r.get("preferred_by_farmer", False),
                    "unavailable_inputs":    r["unavailable_inputs"],
                }
                for r in crop_suitability_result.recommendations[:5]
            ]
    else:
        missing_data.append("Crop suitability data (location/weather/soil)")
        evidence.append({"agent": "CropSuitabilityAgent", "present": False, "detail": "no_location or no data", "provenance": "UNKNOWN"})

    # Market risk
    if market_risk_result and getattr(market_risk_result, "status", None) == "ok":
        agent_scores["market_risk"] = market_risk_result.score
        decision.market_risk_score = market_risk_result.score
        evidence.append({
            "agent": "MarketRiskAgent",
            "present": True,
            "detail": f"Market risk score {market_risk_result.score} · {market_risk_result.verdict} · confidence {market_risk_result.confidence}%",
            "provenance": "DERIVED",
        })
    else:
        missing_data.append("Market risk data (no price records in district)")
        evidence.append({"agent": "MarketRiskAgent", "present": False, "detail": "no market data", "provenance": "UNKNOWN"})

    # Soil health
    if soil_health_result and getattr(soil_health_result, "status", None) == "ok":
        agent_scores["soil_health"] = soil_health_result.score
        decision.soil_health_score = soil_health_result.score
        evidence.append({
            "agent": "SoilHealthAgent",
            "present": True,
            "detail": f"Soil score {soil_health_result.score} · degradation risk {soil_health_result.degradation_risk.get('level') if soil_health_result.degradation_risk else '—'}",
            "provenance": "REAL",
        })
    else:
        missing_data.append("Soil health data (no SoilData record — upload Soil Health Card)")
        evidence.append({"agent": "SoilHealthAgent", "present": False, "detail": "no_soil_data", "provenance": "UNKNOWN"})

    # Sustainability
    if sustainability_result and getattr(sustainability_result, "status", None) == "ok":
        agent_scores["sustainability"] = sustainability_result.score
        decision.sustainability_score = sustainability_result.score
        evidence.append({
            "agent": "SustainabilityAgent",
            "present": True,
            "detail": f"Sustainability score {sustainability_result.score} · confidence {sustainability_result.confidence}%",
            "provenance": "DERIVED",
        })
    else:
        missing_data.append("Sustainability data (weather/soil required)")
        evidence.append({"agent": "SustainabilityAgent", "present": False, "detail": "insufficient data", "provenance": "UNKNOWN"})

    # Competition bonus (from SDBI)
    if competition:
        sdbi = competition.get("sdbi")
        comp_score = None
        if sdbi is not None:
            if   sdbi < 0.8:  comp_score = 90.0  # shortage = good for farmer
            elif sdbi <= 1.2: comp_score = 75.0  # balanced
            elif sdbi <= 1.5: comp_score = 40.0  # moderate oversupply
            else:             comp_score = 15.0  # severe oversupply
        agent_scores["competition"] = comp_score
        if comp_score:
            evidence.append({
                "agent": "CompetitionModel (SDBI)",
                "present": True,
                "detail": f"SDBI {round(sdbi,2)} · {competition.get('risk_level','—')} · comp score {comp_score}",
                "provenance": "DERIVED",
            })
    else:
        missing_data.append("Competition / SDBI data (no Lot or BuyerDemand records)")

    # ── Weighted final score ───────────────────────────────────────────────────
    available = {k: v for k, v in agent_scores.items() if v is not None}
    if available:
        total_w = sum(w.get(k, 0) for k in available)
        decision.decision_score = round(
            sum(w.get(k, 0) * v for k, v in available.items()) / total_w
        ) if total_w > 0 else 0
    else:
        decision.decision_score = None
        decision.status = "data_insufficient"
        decision.what_data_missing = missing_data
        decision.evidence = evidence
        return decision

    # ── Risk level ─────────────────────────────────────────────────────────────
    score = decision.decision_score
    decision.risk_level  = "Low" if score >= 70 else ("Medium" if score >= 50 else "High")
    decision.risk_colour = RISK_COLOUR[decision.risk_level]

    # ── Confidence ─────────────────────────────────────────────────────────────
    n_agents_available = len(available)
    decision.confidence = round(min(95.0, 40.0 + n_agents_available * 12.0 + (5.0 if market_forecast else 0)))
    decision.data_quality = (
        "HIGH"   if n_agents_available >= 4 else
        "MEDIUM" if n_agents_available >= 2 else
        "LOW"
    )

    # ── Sale window ────────────────────────────────────────────────────────────
    if market_forecast and market_forecast.get("status") == "success":
        decision.sale_window = {
            "analysis": "model_indicates",
            "forecast_30d": market_forecast.get("forecast_30d"),
            "forecast_60d": market_forecast.get("forecast_60d"),
            "forecast_90d": market_forecast.get("forecast_90d"),
            "lower_30d": market_forecast.get("lower_30d"),
            "upper_30d": market_forecast.get("upper_30d"),
            "model_type": market_forecast.get("model_type"),
            "provenance": "DERIVED",
            "note": (
                "Historical evidence suggests this price range. "
                "Not a guaranteed future price — use as decision support only."
            ),
        }
    else:
        decision.sale_window = {
            "analysis": "insufficient_evidence",
            "note": "Price forecast unavailable — insufficient historical market observations.",
        }

    # ── Explainability ─────────────────────────────────────────────────────────
    decision.why_this_crop = _why_crop(crop_suitability_result, soil_health_result)
    decision.why_this_market = _why_market(market_risk_result, market_forecast)
    decision.why_this_time = _why_time(market_forecast, festival_demand)
    decision.what_data_supports = _what_supports(evidence)
    decision.what_data_missing = missing_data
    decision.what_could_change = _what_could_change(agent_scores, missing_data)

    decision.evidence = evidence
    decision.status = "success" if not missing_data else "partial_data"

    # Model metadata
    decision.model_metadata = {
        "decision_engine_version": "1.0.0",
        "weights": w,
        "agents_scored": list(available.keys()),
        "agents_missing": [k for k in DEFAULT_WEIGHTS if k not in available],
        "forecast_model": market_forecast.get("model_type") if market_forecast else None,
        "generated_at": decision.generated_at,
    }

    logger.info(
        "decision_engine_complete",
        request_id=request_id, score=decision.decision_score,
        risk=decision.risk_level, agents=list(available.keys()),
    )
    return decision


# ── Explainability helpers ─────────────────────────────────────────────────────

def _why_crop(cs, sh) -> List[str]:
    reasons = []
    if cs and getattr(cs, "status", None) == "ok" and cs.recommendations:
        top = cs.recommendations[0]
        for comp in top.get("components", []):
            if comp["score"] >= 70:
                reasons.append(f"{comp['name']}: {comp['value']} is compatible (score {comp['score']}/100, source: {comp['source']})")
    if sh and getattr(sh, "status", None) == "ok" and sh.score:
        reasons.append(f"Soil health index {sh.score}/100 — adequate for recommended crop")
    if not reasons:
        reasons.append("Insufficient data to explain crop recommendation — provide soil and weather data")
    return reasons


def _why_market(mr, fc) -> List[str]:
    reasons = []
    if mr and getattr(mr, "status", None) == "ok":
        if mr.price_summary:
            p = mr.price_summary
            reasons.append(
                f"Latest modal price ₹{p.get('latest')}/{p.get('price_unit','qtl')} "
                f"(source: {p.get('source')}, date: {p.get('trading_date')})"
            )
        reasons.append(f"Market risk verdict: {mr.verdict} (score {mr.score}/100)")
    if fc and fc.get("status") == "success":
        reasons.append(
            f"30-day price estimate ₹{fc.get('forecast_30d')} "
            f"(range ₹{fc.get('lower_30d')}–₹{fc.get('upper_30d')}, "
            f"model: {fc.get('model_type')})"
        )
    if not reasons:
        reasons.append("No verified market price records available for this commodity and district")
    return reasons


def _why_time(fc, fest) -> List[str]:
    reasons = []
    if fc and fc.get("status") == "success":
        reasons.append(
            f"Model indicates price direction based on {fc.get('training_rows')} "
            f"historical observations ({fc.get('observation_period')})"
        )
    if fest and fest.get("status") == "ok":
        reasons.append(
            f"Festival signal: {fest.get('festival')} — harvest overlap "
            f"{fest.get('harvest_overlap_percent','?')}% with demand window"
        )
    if not reasons:
        reasons.append("Timing recommendation requires historical price records — data currently insufficient")
    return reasons


def _what_supports(evidence: List[Dict]) -> List[str]:
    present = [e for e in evidence if e.get("present")]
    return [f"{e['agent']}: {e['detail']}" for e in present] or ["No verified data sources found"]


def _what_could_change(scores: Dict, missing: List[str]) -> List[str]:
    changes = []
    if "soil_health" not in scores or scores.get("soil_health") is None:
        changes.append("Adding a Soil Health Card would enable soil-specific crop recommendations")
    if "market_risk" not in scores or scores.get("market_risk") is None:
        changes.append("Real market price data (AGMARKNET ingestion) would enable market risk scoring")
    if missing:
        changes.append(f"Missing: {'; '.join(missing[:3])}")
    changes.append("Festival demand signals could raise or lower the recommendation if harvest timing aligns")
    changes.append("Changes in arrival volume at nearby mandis could shift market risk assessment")
    return changes
