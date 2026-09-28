"""
TerraMind-X — resumable Maharashtra + Tamil Nadu AGMARKNET/CEDA importer.

Downloads daily historical:
  - wholesale min/max/modal prices
  - market arrival quantities

Target:
  Maharashtra (Census 2011 state id 27)
  Tamil Nadu  (Census 2011 state id 33)
  2007-01-01 through 2026-12-31

Design:
  state -> commodity -> month
  Each month is a checkpoint in PostgreSQL.
  Safe to Ctrl+C and restart.
  Successful months are skipped automatically.
  Rows are inserted with ON CONFLICT DO UPDATE.

This script uses CEDA's public AgMarkNet web API:
  GET  https://agmarknet.ceda.ashoka.edu.in/api/states
  GET  https://agmarknet.ceda.ashoka.edu.in/api/commodities
  GET  https://agmarknet.ceda.ashoka.edu.in/api/districts?state_id=<ID>
  POST https://agmarknet.ceda.ashoka.edu.in/api/prices
  POST https://agmarknet.ceda.ashoka.edu.in/api/quantities

For the POST APIs:
  state_id
  district_id = 0      # all districts in the selected state
  commodity_id
  calculation_type = d # daily
  chart_type = datadownload
  start_date / end_date are ISO timestamps.

The upstream API can change. Raw responses are kept in DB JSONB columns.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from calendar import monthrange
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Iterable

import psycopg
import requests
from dotenv import load_dotenv
from dateutil.relativedelta import relativedelta


load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

LOG = logging.getLogger("terramind-market")


CEDA_BASE_URL = os.getenv(
    "CEDA_BASE_URL",
    "https://agmarknet.ceda.ashoka.edu.in/api",
).rstrip("/")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL is required in .env")

START_DATE = date.fromisoformat(os.getenv("START_DATE", "2007-01-01"))
END_DATE = date.fromisoformat(os.getenv("END_DATE", "2026-12-31"))

STATE_IDS = [
    int(x.strip())
    for x in os.getenv("STATE_IDS", "27,33").split(",")
    if x.strip()
]

REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "90"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
REQUEST_DELAY_SECONDS = float(os.getenv("REQUEST_DELAY_SECONDS", "0.8"))
BACKOFF_SECONDS = float(os.getenv("BACKOFF_SECONDS", "3"))

SOURCE_NAME = "CEDA-Agmarknet"

STATE_NAMES = {
    27: "Maharashtra",
    33: "Tamil Nadu",
}

session = requests.Session()
session.headers.update(
    {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://agmarknet.ceda.ashoka.edu.in",
        "Referer": "https://agmarknet.ceda.ashoka.edu.in/",
        "User-Agent": "TerraMind-X/1.0 historical-data-loader",
    }
)


@dataclass
class Period:
    start: date
    end: date


def month_periods(start: date, end: date) -> Iterable[Period]:
    cur = start.replace(day=1)
    while cur <= end:
        month_end = cur.replace(day=monthrange(cur.year, cur.month)[1])
        yield Period(
            start=max(cur, start),
            end=min(month_end, end),
        )
        cur = cur + relativedelta(months=1)


def iso_z(d: date, end_of_day: bool = False) -> str:
    suffix = "T23:59:59Z" if end_of_day else "T00:00:00Z"
    return f"{d.isoformat()}{suffix}"


def get_json(path: str, params: dict[str, Any] | None = None) -> Any:
    url = f"{CEDA_BASE_URL}/{path.lstrip('/')}"
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 429:
                wait = BACKOFF_SECONDS * attempt * 2
                LOG.warning("429 GET %s; sleeping %.1fs", url, wait)
                time.sleep(wait)
                continue

            resp.raise_for_status()
            return resp.json()

        except Exception as exc:
            last_error = exc
            LOG.warning(
                "GET failed attempt %d/%d: %s",
                attempt,
                MAX_RETRIES,
                exc,
            )
            if attempt < MAX_RETRIES:
                time.sleep(BACKOFF_SECONDS * attempt)

    raise RuntimeError(f"GET failed: {url}: {last_error}")


def post_json(path: str, payload: dict[str, Any]) -> tuple[int, Any]:
    url = f"{CEDA_BASE_URL}/{path.lstrip('/')}"
    last_error: Exception | None = None
    last_status: int | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.post(
                url,
                json=payload,
                timeout=REQUEST_TIMEOUT,
            )
            last_status = resp.status_code

            if resp.status_code == 429:
                wait = BACKOFF_SECONDS * attempt * 3
                LOG.warning("429 POST %s; sleeping %.1fs", url, wait)
                time.sleep(wait)
                continue

            resp.raise_for_status()
            return resp.status_code, resp.json()

        except Exception as exc:
            last_error = exc
            LOG.warning(
                "POST failed attempt %d/%d status=%s: %s",
                attempt,
                MAX_RETRIES,
                last_status,
                exc,
            )
            if attempt < MAX_RETRIES:
                time.sleep(BACKOFF_SECONDS * attempt)

    raise RuntimeError(
        f"POST failed: {url}; status={last_status}; error={last_error}"
    )


def unwrap_records(payload: Any) -> list[dict[str, Any]]:
    """
    CEDA responses normally look like {"data": [...]}.
    Be tolerant of list responses and nested wrappers.
    """
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]

    if not isinstance(payload, dict):
        return []

    for key in ("data", "records", "results", "rows"):
        value = payload.get(key)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]

    # Try one level deeper.
    for value in payload.values():
        if isinstance(value, dict):
            records = unwrap_records(value)
            if records:
                return records

    return []


def first_value(
    row: dict[str, Any],
    keys: Iterable[str],
    default: Any = None,
) -> Any:
    lower_map = {str(k).lower(): v for k, v in row.items()}
    for key in keys:
        if key in row:
            return row[key]
        if key.lower() in lower_map:
            return lower_map[key.lower()]
    return default


def as_int(value: Any) -> int | None:
    if value in (None, "", "null"):
        return None
    try:
        return int(float(str(value).replace(",", "")))
    except (TypeError, ValueError):
        return None


def as_float(value: Any) -> float | None:
    if value in (None, "", "null"):
        return None
    try:
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return None


def as_date(value: Any) -> date | None:
    if value in (None, "", "null"):
        return None
    s = str(value).strip()
    for candidate in (s[:10], s):
        try:
            return date.fromisoformat(candidate)
        except ValueError:
            pass
    return None


def normalize_record(
    row: dict[str, Any],
    *,
    state_id: int,
    state_name: str,
    commodity_id: int,
    commodity_name: str,
    metric: str,
) -> dict[str, Any]:
    district_id = as_int(
        first_value(row, ["district_id", "districtId", "dist_id"])
    ) or 0
    market_id = as_int(
        first_value(row, ["market_id", "marketId", "marketid", "mkt_id"])
    ) or 0

    district_name = str(
        first_value(
            row,
            ["district", "district_name", "districtName"],
            "",
        )
        or ""
    ).strip()

    market_name = str(
        first_value(
            row,
            ["market", "market_name", "marketName"],
            "",
        )
        or ""
    ).strip()

    variety_name = str(
        first_value(
            row,
            ["variety", "variety_name", "varietyName"],
            "",
        )
        or ""
    ).strip()

    grade_name = str(
        first_value(
            row,
            ["grade", "grade_name", "gradeName"],
            "",
        )
        or ""
    ).strip()

    observed_date = as_date(first_value(row, ["t", "date", "reported_date"]))
    if observed_date is None:
        raise ValueError(f"No date in upstream row: {row}")

    base = {
        "state_id": state_id,
        "state_name": state_name,
        "district_id": district_id,
        "district_name": district_name,
        "market_id": market_id,
        "market_name": market_name,
        "commodity_id": commodity_id,
        "commodity_name": commodity_name,
        "variety_name": variety_name,
        "grade_name": grade_name,
        "observed_date": observed_date,
        "source": SOURCE_NAME,
        "source_url": (
            f"{CEDA_BASE_URL}/"
            f"{'prices' if metric == 'price' else 'quantities'}"
        ),
        "raw_json": json.dumps(row, ensure_ascii=False),
    }

    if metric == "price":
        base.update(
            {
                "min_price": as_float(
                    first_value(row, ["p_min", "min_price", "min"])
                ),
                "max_price": as_float(
                    first_value(row, ["p_max", "max_price", "max"])
                ),
                "modal_price": as_float(
                    first_value(
                        row,
                        [
                            "p_modal",
                            "modal_price",
                            "model_price",
                            "modal",
                        ],
                    )
                ),
                "price_unit": str(
                    first_value(
                        row,
                        ["price_unit", "unit_name_price", "unit"],
                        "",
                    )
                    or ""
                ),
            }
        )
    else:
        base.update(
            {
                "arrival_qty": as_float(
                    first_value(
                        row,
                        [
                            "quantity",
                            "arrival_qty",
                            "arrival_quantity",
                            "q",
                            "qty",
                        ],
                    )
                ),
                "arrival_unit": str(
                    first_value(
                        row,
                        [
                            "quantity_unit",
                            "arrival_unit",
                            "unit_name_arrival",
                            "unit",
                        ],
                        "",
                    )
                    or ""
                ),
            }
        )

    return base


def get_state_metadata() -> list[dict[str, Any]]:
    return unwrap_records(get_json("/states"))


def get_commodity_metadata() -> list[dict[str, Any]]:
    return unwrap_records(get_json("/commodities"))


def load_metadata(conn: psycopg.Connection) -> list[dict[str, Any]]:
    states = get_state_metadata()
    commodities = get_commodity_metadata()

    with conn.cursor() as cur:
        for raw in states:
            state_id = as_int(
                first_value(raw, ["id", "state_id", "stateId", "code"])
            )
            state_name = str(
                first_value(
                    raw,
                    ["name", "state", "state_name", "stateName"],
                    "",
                )
                or ""
            ).strip()
            if state_id is None or not state_name:
                continue
            cur.execute(
                """
                INSERT INTO market_states(state_id, state_name, census_code)
                VALUES (%s, %s, %s)
                ON CONFLICT (state_id) DO UPDATE
                SET state_name = EXCLUDED.state_name,
                    census_code = EXCLUDED.census_code
                """,
                (state_id, state_name, state_id),
            )

        selected = []
        for raw in commodities:
            cid = as_int(
                first_value(raw, ["id", "commodity_id", "commodityId", "code"])
            )
            cname = str(
                first_value(
                    raw,
                    ["name", "commodity", "commodity_name", "display_name"],
                    "",
                )
                or ""
            ).strip()
            category = str(
                first_value(
                    raw,
                    ["category", "category_name", "group", "commodity_group"],
                    "",
                )
                or ""
            ).strip()

            if cid is None or not cname:
                continue

            cur.execute(
                """
                INSERT INTO commodities(
                    commodity_id, commodity_name, category, raw_json
                )
                VALUES (%s, %s, %s, %s::jsonb)
                ON CONFLICT (commodity_id) DO UPDATE
                SET commodity_name = EXCLUDED.commodity_name,
                    category = EXCLUDED.category,
                    raw_json = EXCLUDED.raw_json
                """,
                (
                    cid,
                    cname,
                    category,
                    json.dumps(raw, ensure_ascii=False),
                ),
            )
            selected.append(
                {
                    "commodity_id": cid,
                    "commodity_name": cname,
                }
            )

    conn.commit()
    return selected


def fetch_metric(
    metric: str,
    *,
    state_id: int,
    commodity_id: int,
    start_date: date,
    end_date: date,
) -> tuple[int, Any]:
    payload = {
        "state_id": state_id,
        "commodity_id": commodity_id,
        "district_id": 0,
        "calculation_type": "d",
        "chart_type": "datadownload",
        "start_date": iso_z(start_date),
        "end_date": iso_z(end_date, end_of_day=True),
    }
    endpoint = "prices" if metric == "price" else "quantities"
    return post_json(f"/{endpoint}", payload)


def checkpoint_status(
    conn: psycopg.Connection,
    *,
    state_id: int,
    commodity_id: int,
    period_start: date,
) -> tuple[str, str] | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT price_status, arrival_status
            FROM ingestion_checkpoints
            WHERE source=%s AND state_id=%s AND commodity_id=%s
              AND period_start=%s
            """,
            (SOURCE_NAME, state_id, commodity_id, period_start),
        )
        row = cur.fetchone()
        return tuple(row) if row else None


def begin_checkpoint(
    conn: psycopg.Connection,
    *,
    state_id: int,
    commodity_id: int,
    period: Period,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO ingestion_checkpoints(
                source, state_id, commodity_id, period_start, period_end,
                attempts, started_at, updated_at
            )
            VALUES (%s,%s,%s,%s,%s,1,now(),now())
            ON CONFLICT (source,state_id,commodity_id,period_start)
            DO UPDATE SET
                attempts = ingestion_checkpoints.attempts + 1,
                started_at = now(),
                updated_at = now(),
                last_error = NULL,
                last_http_status = NULL
            """,
            (
                SOURCE_NAME,
                state_id,
                commodity_id,
                period.start,
                period.end,
            ),
        )


def update_checkpoint(
    conn: psycopg.Connection,
    *,
    state_id: int,
    commodity_id: int,
    period: Period,
    price_status: str | None = None,
    arrival_status: str | None = None,
    rows_price: int | None = None,
    rows_arrival: int | None = None,
    http_status: int | None = None,
    error: str | None = None,
) -> None:
    assignments = []
    values: list[Any] = []

    if price_status is not None:
        assignments.append("price_status=%s")
        values.append(price_status)
    if arrival_status is not None:
        assignments.append("arrival_status=%s")
        values.append(arrival_status)
    if rows_price is not None:
        assignments.append("rows_price=%s")
        values.append(rows_price)
    if rows_arrival is not None:
        assignments.append("rows_arrival=%s")
        values.append(rows_arrival)
    if http_status is not None:
        assignments.append("last_http_status=%s")
        values.append(http_status)
    if error is not None:
        assignments.append("last_error=%s")
        values.append(error[:4000])

    assignments.append("updated_at=now()")

    if (
        price_status == "done"
        and arrival_status == "done"
    ):
        assignments.append("completed_at=now()")

    values.extend(
        [
            SOURCE_NAME,
            state_id,
            commodity_id,
            period.start,
        ]
    )

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE ingestion_checkpoints
            SET {", ".join(assignments)}
            WHERE source=%s AND state_id=%s AND commodity_id=%s
              AND period_start=%s
            """,
            values,
        )


def insert_prices(
    conn: psycopg.Connection,
    rows: list[dict[str, Any]],
) -> int:
    if not rows:
        return 0

    sql = """
    INSERT INTO market_prices(
        state_id, state_name,
        district_id, district_name,
        market_id, market_name,
        commodity_id, commodity_name,
        variety_name, grade_name,
        observed_date,
        min_price, max_price, modal_price, price_unit,
        source, source_url, fetched_at, raw_json
    )
    VALUES (
        %(state_id)s, %(state_name)s,
        %(district_id)s, %(district_name)s,
        %(market_id)s, %(market_name)s,
        %(commodity_id)s, %(commodity_name)s,
        %(variety_name)s, %(grade_name)s,
        %(observed_date)s,
        %(min_price)s, %(max_price)s, %(modal_price)s, %(price_unit)s,
        %(source)s, %(source_url)s, now(), %(raw_json)s::jsonb
    )
    ON CONFLICT (
        state_id, district_id, district_name, market_id, market_name,
        commodity_id, commodity_name, variety_name, grade_name, observed_date
    )
    DO UPDATE SET
        min_price=EXCLUDED.min_price,
        max_price=EXCLUDED.max_price,
        modal_price=EXCLUDED.modal_price,
        price_unit=EXCLUDED.price_unit,
        source=EXCLUDED.source,
        source_url=EXCLUDED.source_url,
        fetched_at=now(),
        raw_json=EXCLUDED.raw_json
    """

    with conn.cursor() as cur:
        for row in rows:
            cur.execute(sql, row)
    conn.commit()
    return len(rows)


def insert_arrivals(
    conn: psycopg.Connection,
    rows: list[dict[str, Any]],
) -> int:
    if not rows:
        return 0

    sql = """
    INSERT INTO market_arrivals(
        state_id, state_name,
        district_id, district_name,
        market_id, market_name,
        commodity_id, commodity_name,
        variety_name, grade_name,
        observed_date,
        arrival_qty, arrival_unit,
        source, source_url, fetched_at, raw_json
    )
    VALUES (
        %(state_id)s, %(state_name)s,
        %(district_id)s, %(district_name)s,
        %(market_id)s, %(market_name)s,
        %(commodity_id)s, %(commodity_name)s,
        %(variety_name)s, %(grade_name)s,
        %(observed_date)s,
        %(arrival_qty)s, %(arrival_unit)s,
        %(source)s, %(source_url)s, now(), %(raw_json)s::jsonb
    )
    ON CONFLICT (
        state_id, district_id, district_name, market_id, market_name,
        commodity_id, commodity_name, variety_name, grade_name, observed_date
    )
    DO UPDATE SET
        arrival_qty=EXCLUDED.arrival_qty,
        arrival_unit=EXCLUDED.arrival_unit,
        source=EXCLUDED.source,
        source_url=EXCLUDED.source_url,
        fetched_at=now(),
        raw_json=EXCLUDED.raw_json
    """

    with conn.cursor() as cur:
        for row in rows:
            cur.execute(sql, row)
    conn.commit()
    return len(rows)


def create_run(conn: psycopg.Connection) -> str:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO ingestion_runs(source, start_date, end_date, states)
            VALUES (%s,%s,%s,%s::jsonb)
            RETURNING run_id
            """,
            (
                SOURCE_NAME,
                START_DATE,
                END_DATE,
                json.dumps(
                    [
                        {
                            "state_id": sid,
                            "state_name": STATE_NAMES.get(
                                sid,
                                f"state-{sid}",
                            ),
                        }
                        for sid in STATE_IDS
                    ]
                ),
            ),
        )
        run_id = str(cur.fetchone()[0])
    conn.commit()
    return run_id


def finish_run(conn: psycopg.Connection, run_id: str, status: str, note: str = ""):
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE ingestion_runs
            SET finished_at=now(), status=%s, notes=%s
            WHERE run_id=%s
            """,
            (status, note[:4000], run_id),
        )
    conn.commit()


def process_period(
    conn: psycopg.Connection,
    *,
    state_id: int,
    commodity_id: int,
    commodity_name: str,
    period: Period,
) -> None:
    state_name = STATE_NAMES.get(state_id, f"State {state_id}")

    status = checkpoint_status(
        conn,
        state_id=state_id,
        commodity_id=commodity_id,
        period_start=period.start,
    )

    if status == ("done", "done"):
        return

    existing_price_done = bool(status and status[0] == "done")
    existing_arrival_done = bool(status and status[1] == "done")

    begin_checkpoint(
        conn,
        state_id=state_id,
        commodity_id=commodity_id,
        period=period,
    )
    conn.commit()

    LOG.info(
        "Fetching %s | %s | %s → %s",
        state_name,
        commodity_name,
        period.start,
        period.end,
    )

    if not existing_price_done:
        try:
            http_status, payload = fetch_metric(
                "price",
                state_id=state_id,
                commodity_id=commodity_id,
                start_date=period.start,
                end_date=period.end,
            )
            price_records = unwrap_records(payload)

            normalized_price = []
            for raw in price_records:
                try:
                    row = normalize_record(
                        raw,
                        state_id=state_id,
                        state_name=state_name,
                        commodity_id=commodity_id,
                        commodity_name=commodity_name,
                        metric="price",
                    )
                    if row["modal_price"] is not None or (
                        row["min_price"] is not None
                        and row["max_price"] is not None
                    ):
                        normalized_price.append(row)
                except Exception as exc:
                    LOG.debug("Skipped price row: %s", exc)

            saved_prices = insert_prices(conn, normalized_price)
            update_checkpoint(
                conn,
                state_id=state_id,
                commodity_id=commodity_id,
                period=period,
                price_status="done",
                rows_price=saved_prices,
                http_status=http_status,
            )
            conn.commit()

        except Exception as exc:
            conn.rollback()
            update_checkpoint(
                conn,
                state_id=state_id,
                commodity_id=commodity_id,
                period=period,
                price_status="failed",
                error=str(exc),
            )
            conn.commit()
            LOG.error(
                "PRICE failed %s %s %s: %s",
                state_name,
                commodity_name,
                period.start,
                exc,
            )

        time.sleep(REQUEST_DELAY_SECONDS)

    if not existing_arrival_done:
        try:
            http_status, payload = fetch_metric(
                "arrival",
                state_id=state_id,
                commodity_id=commodity_id,
                start_date=period.start,
                end_date=period.end,
            )
            arrival_records = unwrap_records(payload)

            normalized_arrivals = []
            for raw in arrival_records:
                try:
                    row = normalize_record(
                        raw,
                        state_id=state_id,
                        state_name=state_name,
                        commodity_id=commodity_id,
                        commodity_name=commodity_name,
                        metric="arrival",
                    )
                    if row["arrival_qty"] is not None:
                        normalized_arrivals.append(row)
                except Exception as exc:
                    LOG.debug("Skipped arrival row: %s", exc)

            saved_arrivals = insert_arrivals(conn, normalized_arrivals)
            update_checkpoint(
                conn,
                state_id=state_id,
                commodity_id=commodity_id,
                period=period,
                arrival_status="done",
                rows_arrival=saved_arrivals,
                http_status=http_status,
            )
            conn.commit()

        except Exception as exc:
            conn.rollback()
            update_checkpoint(
                conn,
                state_id=state_id,
                commodity_id=commodity_id,
                period=period,
                arrival_status="failed",
                error=str(exc),
            )
            conn.commit()
            LOG.error(
                "ARRIVAL failed %s %s %s: %s",
                state_name,
                commodity_name,
                period.start,
                exc,
            )



def main() -> int:
    LOG.info("TerraMind-X market history loader")
    LOG.info("CEDA base URL: %s", CEDA_BASE_URL)
    LOG.info("Date range: %s → %s", START_DATE, END_DATE)
    LOG.info("States: %s", STATE_IDS)

    with psycopg.connect(DATABASE_URL) as conn:
        run_id = create_run(conn)
        LOG.info("Run ID: %s", run_id)

        try:
            commodities = load_metadata(conn)
            LOG.info("Loaded %d commodities", len(commodities))

            # Only process the configured two states.
            selected_commodities = [
                c for c in commodities if c["commodity_id"] is not None
            ]

            periods = list(month_periods(START_DATE, END_DATE))
            LOG.info(
                "Periods: %d months × %d states × %d commodities",
                len(periods),
                len(STATE_IDS),
                len(selected_commodities),
            )

            total = 0

            for state_id in STATE_IDS:
                state_name = STATE_NAMES.get(
                    state_id,
                    f"State {state_id}",
                )

                # This verifies that CEDA knows the requested geography.
                try:
                    districts = unwrap_records(
                        get_json(
                            "/districts",
                            params={"state_id": state_id},
                        )
                    )
                    LOG.info(
                        "%s: metadata check returned %d districts",
                        state_name,
                        len(districts),
                    )
                except Exception as exc:
                    LOG.warning(
                        "%s district metadata check failed: %s",
                        state_name,
                        exc,
                    )

                for commodity in selected_commodities:
                    cid = commodity["commodity_id"]
                    cname = commodity["commodity_name"]

                    for period in periods:
                        process_period(
                            conn,
                            state_id=state_id,
                            commodity_id=cid,
                            commodity_name=cname,
                            period=period,
                        )
                        total += 1

                        if total % 100 == 0:
                            LOG.info(
                                "Progress: %d state/commodity/month jobs attempted",
                                total,
                            )

            finish_run(
                conn,
                run_id,
                "completed",
                "Completed all configured state/commodity/month jobs. "
                "Individual failures remain visible in ingestion_checkpoints "
                "for re-run.",
            )

            LOG.info("✅ Import run finished.")
            return 0

        except KeyboardInterrupt:
            finish_run(conn, run_id, "interrupted", "Stopped by user.")
            LOG.warning(
                "Interrupted. Re-run the script; completed checkpoints will be skipped."
            )
            return 130

        except Exception as exc:
            conn.rollback()
            finish_run(conn, run_id, "failed", str(exc))
            LOG.exception("Fatal importer failure")
            return 1


if __name__ == "__main__":
    sys.exit(main())
