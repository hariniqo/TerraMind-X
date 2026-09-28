"""Deterministic market record cleaning and numeric feature engineering."""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta
from statistics import mean, pstdev
from typing import Any, Iterable, Mapping


COMMODITY_ALIASES = {
    "arhar": "Tur",
    "arhar (tur/red gram) (whole)": "Tur",
    "bengal gram(gram)(whole)": "Gram",
    "paddy(dhan)(common)": "Rice",
    "soyabean": "Soybean",
    "soy bean": "Soybean",
    "jowar(sorghum)": "Jowar",
    "bajra(pearl millet)": "Bajra",
}
MARKET_ALIASES = {
    "apmc usilampatti": "Usilampatti",
    "usilampatti apmc": "Usilampatti",
    "apmc madurai": "Madurai",
    "lasalgaon apmc": "Lasalgaon",
}
_UNIT_TO_QUINTAL = {
    "kg": 100.0,
    "per kg": 100.0,
    "rs/kg": 100.0,
    "rs/100kg": 1.0,
    "rs/100 kg": 1.0,
    "kilogram": 100.0,
    "ton": 0.1,
    "tons": 0.1,
    "tonne": 0.1,
    "metric tonne": 0.1,
    "mt": 0.1,
    "quintal": 1.0,
    "qtl": 1.0,
    "100 kg": 1.0,
    "rs/quintal": 1.0,
}


def _clean_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _key(value: Any) -> str:
    return _clean_text(value).casefold()


def _parse_number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = re.sub(r"(?i)(?:INR|Rs\.?|₹)", "", str(value).strip()).replace(",", "")
    text = re.sub(r"[^0-9.+-]", "", text)
    try:
        result = float(text)
    except ValueError:
        return None
    return result if result == result and abs(result) != float("inf") else None


def _parse_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = _clean_text(value)
    for pattern in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(text[:10], pattern).date()
        except ValueError:
            continue
    return None


def _normalize_commodity(value: Any, aliases: Mapping[str, str] | None = None) -> str:
    text = _clean_text(value)
    key = text.casefold()
    return (aliases or {}).get(key, COMMODITY_ALIASES.get(key, text.title()))


def _normalize_market(value: Any, aliases: Mapping[str, str] | None = None) -> str:
    text = _clean_text(value)
    canonical = (aliases or {}).get(text.casefold()) or MARKET_ALIASES.get(text.casefold())
    if canonical:
        return canonical
    return re.sub(r"^(?:APMC|Mandi)\s+", "", text, flags=re.IGNORECASE).strip()


def _raw_record(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "state": record.get("state"),
        "district": record.get("district"),
        "market_name": record.get("market_name") or record.get("market"),
        "commodity": record.get("commodity"),
        "variety": record.get("variety"),
        "grade": record.get("grade"),
        "trading_date": record.get("trading_date") or record.get("arrival_date"),
        "min_price": record.get("min_price"),
        "max_price": record.get("max_price"),
        "modal_price": record.get("modal_price"),
        "original_unit": record.get("original_unit") or record.get("unit") or "quintal",
        "arrival_quantity": record.get("arrival_quantity") or record.get("arrival"),
        "arrival_unit": record.get("arrival_unit"),
        "source": record.get("source"),
        "source_url": record.get("source_url"),
        "source_record_id": record.get("source_record_id") or record.get("id"),
    }


def clean_market_records(
    records: Iterable[dict[str, Any]],
    *,
    festival_dates: Iterable[str | date] = (),
    festival_window_days: int = 7,
    canonical_aliases: Mapping[str, Mapping[str, str]] | None = None,
) -> list[dict[str, Any]]:
    """Normalize, deduplicate and enrich market records without imputing data."""
    cleaned: list[dict[str, Any]] = []
    seen: set[tuple[str, ...]] = set()
    for source_record in records:
        record = _raw_record(source_record)
        aliases = canonical_aliases or {}
        market = _normalize_market(record["market_name"], aliases.get("market"))
        commodity = _normalize_commodity(record["commodity"], aliases.get("commodity"))
        trading_date = _parse_date(record["trading_date"])
        district = _clean_text(record["district"])
        state = _clean_text(record["state"])
        variety = _clean_text(record["variety"])
        if not market or not commodity or not trading_date:
            continue

        identity = (state.casefold(), district.casefold(), market.casefold(), commodity.casefold(), trading_date.isoformat())
        if identity in seen:
            continue
        seen.add(identity)

        unit = _clean_text(record["original_unit"]) or "quintal"
        unit_key = unit.casefold().replace("rs./", "rs/").replace("₹/", "rs/")
        factor = _UNIT_TO_QUINTAL.get(unit_key)
        modal = _parse_number(record["modal_price"])
        minimum = _parse_number(record["min_price"])
        maximum = _parse_number(record["max_price"])
        arrival = _parse_number(record["arrival_quantity"])
        flags: list[str] = []
        if not district:
            flags.append("missing_district")
        if modal is None:
            flags.append("missing_modal_price")
        if minimum is None:
            flags.append("missing_min_price")
        if maximum is None:
            flags.append("missing_max_price")
        if arrival is None:
            flags.append("missing_arrival_quantity")
        if factor is None:
            flags.append("unknown_price_unit")

        row = {
            "state": state,
            "district": district,
            "market_name": market,
            "commodity": commodity,
            "variety": variety or None,
            "grade": _clean_text(record["grade"]) or None,
            "trading_date": trading_date,
            "min_price": minimum,
            "max_price": maximum,
            "modal_price": modal,
            "original_unit": unit,
            "conversion_formula": (
                "unchanged (already per quintal)" if factor == 1.0
                else "multiply by 100 (₹/kg to ₹/quintal)" if factor == 100.0
                else "divide by 10 (₹/tonne to ₹/quintal)" if factor == 0.1
                else None
            ),
            "min_price_qtl": round(minimum * factor, 2) if minimum is not None and factor else None,
            "max_price_qtl": round(maximum * factor, 2) if maximum is not None and factor else None,
            "modal_price_qtl": round(modal * factor, 2) if modal is not None and factor else None,
            "normalized_unit": "quintal" if factor is not None else None,
            "arrival_quantity": arrival,
            "arrival_unit": _clean_text(record["arrival_unit"]) or None,
            "source": _clean_text(record["source"]) or "unknown",
            "source_url": record["source_url"],
            "source_record_id": record["source_record_id"],
            "quality_flags": flags,
            "needs_review": False,
            "rolling_30d_avg": None,
            "day_over_day_pct_change": None,
            "mandi_price_spread": None,
            "festival_proximity": False,
        }
        cleaned.append(row)

    festivals = [d for d in (_parse_date(item) for item in festival_dates) if d is not None]
    groups: dict[tuple[str, str, str], list[dict[str, Any]]] = {}
    market_day: dict[tuple[str, str, date], list[float]] = {}
    for row in cleaned:
        group = (
            row["state"].casefold(), row["district"].casefold(),
            row["market_name"].casefold(), row["commodity"].casefold(),
        )
        groups.setdefault(group, []).append(row)
        if row["modal_price_qtl"] is not None:
            market_day.setdefault((row["state"].casefold(), row["commodity"].casefold(), row["trading_date"]), []).append(row["modal_price_qtl"])

    for rows in groups.values():
        rows.sort(key=lambda row: row["trading_date"])
        for index, row in enumerate(rows):
            current = row["modal_price_qtl"]
            if current is None:
                continue
            trailing = [
                prior["modal_price_qtl"]
                for prior in rows[:index]
                if prior["modal_price_qtl"] is not None
                and timedelta(0) < row["trading_date"] - prior["trading_date"] <= timedelta(days=30)
            ]
            window_values = trailing + [current]
            row["rolling_30d_avg"] = round(mean(window_values), 2)
            previous = next((value for value in reversed(trailing)), None)
            if previous not in (None, 0):
                row["day_over_day_pct_change"] = round((current - previous) / previous * 100, 2)
            if len(trailing) >= 2:
                avg = mean(trailing)
                deviation = pstdev(trailing)
                if abs(current - avg) > 3 * deviation:
                    row["needs_review"] = True
                    row["quality_flags"].append("price_outlier_3sd")
            prices = market_day[(row["state"].casefold(), row["commodity"].casefold(), row["trading_date"])]
            row["mandi_price_spread"] = round(max(prices) - min(prices), 2) if len(prices) > 1 else None
            row["festival_proximity"] = any(
                abs((festival - row["trading_date"]).days) <= festival_window_days
                for festival in festivals
            )
            row["quality_flags_json"] = json.dumps(row["quality_flags"], separators=(",", ":"))

    return sorted(cleaned, key=lambda row: (row["trading_date"], row["state"], row["district"], row["market_name"], row["commodity"]))
