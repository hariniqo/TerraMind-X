"""
Base collector interface.
Every collector returns a standard CollectorResult.
On API failure: returns SOURCE_UNAVAILABLE — never invents data.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, List, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.logging import get_logger

logger = get_logger(__name__)

RETRY_ATTEMPTS = 3
RETRY_WAIT_MIN = 2  # seconds
RETRY_WAIT_MAX = 10


@dataclass
class CollectorResult:
    source_name: str
    source_url: str
    retrieved_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    published_at: Optional[str] = None
    location: Optional[str] = None
    data_type: Optional[str] = None
    provenance: str = "REAL"
    status: str = "success"           # success / error / source_unavailable / no_key
    http_status: Optional[int] = None
    records_received: int = 0
    records_accepted: int = 0
    records_rejected: int = 0
    error_message: Optional[str] = None
    raw_data: Any = field(default_factory=list)
    normalized_data: List[Dict[str, Any]] = field(default_factory=list)
    rejection_reasons: List[str] = field(default_factory=list)
    confidence: float = 0.0           # documented rule: 1.0 = government verified source

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_name": self.source_name,
            "source_url": self.source_url,
            "retrieved_at": self.retrieved_at,
            "provenance": self.provenance,
            "status": self.status,
            "http_status": self.http_status,
            "records_received": self.records_received,
            "records_accepted": self.records_accepted,
            "records_rejected": self.records_rejected,
            "error_message": self.error_message,
            "confidence": self.confidence,
        }


class BaseCollector:
    """Abstract base for all data collectors."""

    source_name: str = "unknown"
    source_url: str = ""
    requires_api_key: bool = False
    api_key_env_var: Optional[str] = None
    default_timeout: int = 30   # seconds

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=self.default_timeout)
        return self

    async def __aexit__(self, *_):
        if self._client:
            await self._client.aclose()

    async def collect(self, **kwargs) -> CollectorResult:
        raise NotImplementedError

    async def _get(
        self,
        url: str,
        params: Dict = None,
        headers: Dict = None,
        on_response: Optional[Callable[[Any, int], Awaitable[None]]] = None,
    ) -> httpx.Response:
        """GET with retry and timeout. Never silently swallows errors."""
        assert self._client, "Use as async context manager"
        for attempt in range(1, RETRY_ATTEMPTS + 1):
            try:
                resp = await self._client.get(url, params=params, headers=headers)
                if on_response:
                    await on_response(resp.text, resp.status_code)
                if (resp.status_code == 429 or resp.status_code >= 500) and attempt < RETRY_ATTEMPTS:
                    retry_after = resp.headers.get("Retry-After")
                    try:
                        wait = min(float(retry_after), RETRY_WAIT_MAX) if retry_after else RETRY_WAIT_MIN * (2 ** (attempt - 1))
                    except ValueError:
                        wait = RETRY_WAIT_MIN * (2 ** (attempt - 1))
                    await asyncio.sleep(wait)
                    continue
                return resp
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                logger.warning(
                    "http_get_failed",
                    url=url, attempt=attempt, error=str(e),
                )
                if attempt == RETRY_ATTEMPTS:
                    raise
                wait = RETRY_WAIT_MIN * (2 ** (attempt - 1))
                await asyncio.sleep(min(wait, RETRY_WAIT_MAX))
