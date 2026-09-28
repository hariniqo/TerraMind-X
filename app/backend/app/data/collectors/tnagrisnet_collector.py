"""Optional TN Agri portal adapter; requires a documented data endpoint URL."""
from __future__ import annotations

import os
import asyncio
from html.parser import HTMLParser
from typing import Any, Awaitable, Callable

import httpx

SOURCE = "Tamil Nadu Agri portal"
PORTAL_URL = "https://tnagrisnet.tn.gov.in/"


class _Tables(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell.append(data.strip())

    def handle_endtag(self, tag: str) -> None:
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(" ".join(part for part in self._cell if part))
            self._cell = None
        elif tag == "tr" and self._row:
            self.rows.append(self._row)
            self._row = None


def _records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        for key in ("records", "data", "items", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                return [row for row in value if isinstance(row, dict)]
    return []


async def fetch_tnagrisnet(
    on_raw_payload: Callable[[Any, int], Awaitable[None]] | None = None,
) -> dict[str, Any]:
    endpoint = os.getenv("TNAGRISNET_DATA_URL")
    if not endpoint:
        return {
            "source": SOURCE,
            "source_url": PORTAL_URL,
            "status": "source_unavailable",
            "http_status": None,
            "payload": None,
            "records": [],
            "error": "No public data API was identified; configure TNAGRISNET_DATA_URL only for an authorized structured endpoint.",
        }

    last_error = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=45, follow_redirects=True) as client:
                response = await client.get(endpoint)
                if on_raw_payload:
                    await on_raw_payload(response.text, response.status_code)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if "json" in content_type:
                    payload = response.json()
                    records = _records(payload)
                else:
                    payload = response.text
                    tables = _Tables()
                    tables.feed(response.text)
                    records = []
                    if tables.rows:
                        headers = [" ".join(cell.casefold().split()) for cell in tables.rows[0]]
                        if any("commodity" in header or "crop" in header for header in headers) and any("price" in header for header in headers):
                            records = [dict(zip(headers, row)) for row in tables.rows[1:] if len(row) == len(headers)]
                status = "success" if records else "source_unavailable"
                return {
                    "source": SOURCE,
                    "source_url": str(response.url),
                    "status": status,
                    "http_status": response.status_code,
                    "payload": payload,
                    "records": records,
                    "error": None if records else "Endpoint returned no recognized structured market records.",
                }
        except (httpx.HTTPError, ValueError) as exc:
            last_error = exc
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)
    return {
        "source": SOURCE,
        "source_url": endpoint,
        "status": "source_unavailable",
        "http_status": getattr(getattr(last_error, "response", None), "status_code", None),
        "payload": None,
        "records": [],
        "error": str(last_error),
    }
