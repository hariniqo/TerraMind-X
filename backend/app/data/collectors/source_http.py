"""Small async HTTP helper for independent source collectors."""
from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable

import httpx


async def fetch_json(
    url: str,
    params: dict[str, Any] | None = None,
    on_raw_payload: Callable[[Any, int], Awaitable[None]] | None = None,
) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=45, follow_redirects=True) as client:
                response = await client.get(url, params=params)
                if on_raw_payload:
                    await on_raw_payload(response.text, response.status_code)
                if response.status_code == 429 or response.status_code >= 500:
                    if attempt < 2:
                        retry_after = response.headers.get("Retry-After")
                        try:
                            delay = min(float(retry_after), 30.0) if retry_after else 2 ** attempt
                        except ValueError:
                            delay = 2 ** attempt
                        await asyncio.sleep(delay)
                        continue
                response.raise_for_status()
                payload = response.json()
                return {
                    "status": "success",
                    "http_status": response.status_code,
                    "source_url": str(response.url),
                    "payload": payload,
                    "error": None,
                }
        except (httpx.HTTPError, ValueError) as exc:
            last_error = exc
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)
    return {
        "status": "source_unavailable",
        "http_status": getattr(getattr(last_error, "response", None), "status_code", None),
        "source_url": url,
        "payload": None,
        "error": str(last_error),
    }
