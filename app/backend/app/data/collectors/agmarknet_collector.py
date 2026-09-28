"""
AGMARKNET / data.gov.in market price collector.

Source:  data.gov.in — "Current Daily Price of Various Commodities from Various Markets"
URL:     https://api.data.gov.in/resource/9ef84268-d588-448a-a48b-15f1c5718621
Auth:    DATA_GOV_IN_API_KEY (required — register free at data.gov.in)
Provenance: REAL

Hard rules:
  - Returns SOURCE_UNAVAILABLE if API key is missing or request fails.
  - Rejects records missing required fields, invalid dates, non-positive prices.
  - Never creates fallback/synthetic prices on failure.
  - Stores conversion formula when normalizing units.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, List, Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.data.collectors.base import BaseCollector, CollectorResult

logger = get_logger(__name__)

RESOURCE_ID = "9ef84268-d588-448a-a48b-15f1c5718621"
SOURCE_NAME = "data.gov.in · AGMARKNET"
SOURCE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"
REQUIRED_FIELDS = ["state", "district", "market", "commodity", "arrival_date", "modal_price"]

# Unit normalization: convert original unit → ₹/quintal
# Quintal = 100 kg. Prices in ₹/kg need ×100. Per 100kg = ×1 (quintal).
UNIT_TO_QUINTAL: Dict[str, tuple] = {
    "quintal":    (1.0,   "already per quintal"),
    "100 kg":     (1.0,   "100 kg = 1 quintal"),
    "qtl":        (1.0,   "abbreviation for quintal"),
    "kg":         (100.0, "×100 (from ₹/kg to ₹/quintal)"),
    "per kg":     (100.0, "×100 (from ₹/kg to ₹/quintal)"),
    "ton":        (0.1,   "×0.1 (from ₹/tonne to ₹/quintal)"),
    "tonne":      (0.1,   "×0.1 (from ₹/tonne to ₹/quintal)"),
    "mt":         (0.1,   "×0.1 (MT = metric tonne → quintal)"),
}


def _normalize_price(price: float, unit: Optional[str]) -> tuple[Optional[float], Optional[str]]:
    """Return (normalized_price_per_quintal, conversion_formula). None if unit unknown."""
    if unit is None:
        return price, "unit unknown — assumed quintal"
    u = unit.lower().strip()
    factor, formula = UNIT_TO_QUINTAL.get(u, (None, None))
    if factor is None:
        return price, f"unit '{unit}' unrecognized — stored as-is"
    return round(price * factor, 2), formula


def _num(v: Any) -> Optional[float]:
    try:
        n = float(v)
        return n if n == n else None   # NaN check
    except (TypeError, ValueError):
        return None


def _valid_date(s: Any) -> Optional[str]:
    if not s:
        return None
    # AGMARKNET uses DD/MM/YYYY
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(s), fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def _dedup_key(r: Dict) -> str:
    return "|".join([
        str(r.get("state", "")).lower(),
        str(r.get("district", "")).lower(),
        str(r.get("market", "")).lower(),
        str(r.get("commodity", "")).lower(),
        str(r.get("variety", "")).lower(),
        str(r.get("grade", "")).lower(),
        str(r.get("arrival_date", "")),
    ])


class AgmarknetCollector(BaseCollector):
    source_name = SOURCE_NAME
    source_url = SOURCE_URL
    requires_api_key = True
    api_key_env_var = "DATA_GOV_IN_API_KEY"

    async def collect(
        self,
        state: str = "Maharashtra",
        limit: int = 1000,
        offset: int = 0,
        arrival_date: Optional[str] = None,   # DD/MM/YYYY
        on_raw_payload: Optional[Callable[[Dict, int], Awaitable[None]]] = None,
    ) -> CollectorResult:
        result = CollectorResult(
            source_name=SOURCE_NAME,
            source_url=SOURCE_URL,
            data_type="market_prices",
            provenance="REAL",
        )

        api_key = settings.data_gov_in_api_key
        if not api_key:
            result.status = "no_key"
            result.error_message = (
                "DATA_GOV_IN_API_KEY missing. "
                "Register at https://data.gov.in/user/register to obtain a free key. "
                "No synthetic data created."
            )
            logger.warning("agmarknet_no_key")
            return result

        params = {
            "api-key": api_key,
            "format": "json",
            "limit": limit,
            "offset": offset,
            "filters[state]": state,
        }
        if arrival_date:
            params["filters[arrival_date]"] = arrival_date

        try:
            async with self as collector:
                resp = await collector._get(SOURCE_URL, params=params, on_response=on_raw_payload)
        except Exception as exc:
            result.status = "source_unavailable"
            result.error_message = f"Fetch failed: {exc}"
            logger.error("agmarknet_fetch_failed", error=str(exc))
            return result

        result.http_status = resp.status_code
        if not resp.is_success:
            result.status = "source_unavailable"
            result.error_message = f"HTTP {resp.status_code}: {resp.text[:300]}"
            return result

        try:
            body = resp.json()
        except Exception:
            result.status = "source_unavailable"
            result.error_message = "Invalid JSON response"
            return result

        raw_records: List[Dict] = body.get("records", [])
        result.records_received = len(raw_records)
        result.raw_data = body

        accepted: List[Dict] = []
        seen_keys: set = set()
        seen_ids: set = set()

        for r in raw_records:
            missing = [f for f in REQUIRED_FIELDS if not r.get(f)]
            if missing:
                result.records_rejected += 1
                result.rejection_reasons.append(f"missing {missing} in record {r.get('id','?')}")
                continue

            d = _valid_date(r["arrival_date"])
            if not d:
                result.records_rejected += 1
                result.rejection_reasons.append(f"invalid arrival_date '{r['arrival_date']}'")
                continue

            modal = _num(r["modal_price"])
            if modal is None or modal <= 0:
                result.records_rejected += 1
                result.rejection_reasons.append(f"invalid modal_price '{r['modal_price']}'")
                continue

            sid = str(r.get("id", "")) or None
            key = _dedup_key({**r, "arrival_date": d})
            if sid and sid in seen_ids:
                result.records_rejected += 1
                result.rejection_reasons.append(f"duplicate source_record_id {sid}")
                continue
            if key in seen_keys:
                result.records_rejected += 1
                result.rejection_reasons.append(f"duplicate key {key[:80]}")
                continue
            if sid:
                seen_ids.add(sid)
            seen_keys.add(key)

            unit = r.get("unit") or "quintal"
            modal_qtl, conv = _normalize_price(modal, unit)
            min_p = _num(r.get("min_price"))
            max_p = _num(r.get("max_price"))
            min_qtl, _ = _normalize_price(min_p, unit) if min_p is not None else (None, None)
            max_qtl, _ = _normalize_price(max_p, unit) if max_p is not None else (None, None)

            now = datetime.utcnow().isoformat()
            accepted.append({
                "id": str(uuid.uuid4()),
                "state": r["state"].strip(),
                "district": r["district"].strip(),
                "taluk": (r.get("taluk") or "").strip() or None,
                "market_name": r["market"].strip(),
                "commodity": r["commodity"].strip(),
                "variety": (r.get("variety") or "").strip() or None,
                "grade": (r.get("grade") or "").strip() or None,
                "min_price": min_p,
                "max_price": max_p,
                "modal_price": modal,
                "original_unit": unit,
                "min_price_qtl": min_qtl,
                "max_price_qtl": max_qtl,
                "modal_price_qtl": modal_qtl,
                "normalized_unit": "quintal",
                "conversion_formula": conv,
                "arrival_quantity": _num(r.get("arrival")),
                "arrival_unit": r.get("arrival_unit") or None,
                "trading_date": d,
                "data_timestamp": d,
                "retrieved_at": now,
                "fetched_at": now,
                "provenance": "REAL",
                "source": SOURCE_NAME,
                "source_url": SOURCE_URL,
                "source_record_id": sid,
                "verification_status": "verified",
            })

        result.records_accepted = len(accepted)
        result.normalized_data = accepted
        result.status = "success" if accepted else "no_data"
        # Confidence rule: government-verified AGMARKNET source = 0.95
        result.confidence = 0.95 if accepted else 0.0
        logger.info(
            "agmarknet_collect_done",
            state=state, received=result.records_received,
            accepted=result.records_accepted, rejected=result.records_rejected,
        )
        return result
