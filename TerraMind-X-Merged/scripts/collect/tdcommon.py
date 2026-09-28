"""Shared helpers for TerraMind agricultural data collection.

Design rules (see docs/next_actions.md):
  * never fabricate an observation,
  * never overwrite an existing downloaded file,
  * every real download is hashed and recorded in a staging manifest that is
    later promoted into data/metadata/source_registry.csv.
"""
from __future__ import annotations

import hashlib
import json
import socket
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# Hard default socket timeout so a stalled DNS/TLS handshake cannot hang a run.
socket.setdefaulttimeout(20)

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
RAW = DATA_DIR / "raw"
PROCESSED = DATA_DIR / "processed"
COMBINED = DATA_DIR / "combined"
METADATA = DATA_DIR / "metadata"
FAILURES = DATA_DIR / "failures"
REPORTS_CHARTS = REPO_ROOT / "reports" / "charts"
REPORTS_TABLES = REPO_ROOT / "reports" / "tables"
DOCS = REPO_ROOT / "docs"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "*/*",
}

SSL_CTX = ssl.create_default_context()

# Some official Indian government hosts serve incomplete certificate chains
# (SSL: CERTIFICATE_VERIFY_FAILED). A second, unverified context is used ONLY
# after a verify failure on a known official host, and the fact is recorded in
# the source registry notes so the provenance trail stays honest.
SSL_CTX_LAX = ssl.create_default_context()
SSL_CTX_LAX.check_hostname = False
SSL_CTX_LAX.verify_mode = ssl.CERT_NONE

STAGING = METADATA / "download_manifest.jsonl"


def today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def ensure_dirs() -> None:
    for p in (
        RAW / "tamil_nadu",
        RAW / "maharashtra",
        RAW / "national",
        RAW / "reference",
        PROCESSED / "tamil_nadu",
        PROCESSED / "maharashtra",
        COMBINED,
        METADATA,
        FAILURES,
        REPORTS_CHARTS,
        REPORTS_TABLES,
        DOCS,
    ):
        p.mkdir(parents=True, exist_ok=True)


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            b = fh.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def record(entry: dict) -> None:
    """Append one manifest record (JSON Lines) - never mutates old records."""
    ensure_dirs()
    entry = dict(entry)
    entry.setdefault("logged_at", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    with STAGING.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


def log(msg: str) -> None:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


class DownloadResult:
    def __init__(self, status: str, path: Path | None = None, bytes_: int = 0,
                 http_status: int | None = None, error: str | None = None,
                 content_type: str | None = None, attempts: int = 1,
                 skipped: bool = False):
        self.status = status
        self.path = path
        self.bytes = bytes_
        self.http_status = http_status
        self.error = error
        self.content_type = content_type
        self.attempts = attempts
        self.skipped = skipped

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (f"DownloadResult(status={self.status}, path={self.path}, bytes={self.bytes}, "
                f"http={self.http_status}, attempts={self.attempts}, err={self.error})")


def classify_exception(exc: BaseException) -> str:
    if isinstance(exc, (socket.timeout, TimeoutError)):
        return "TIMEOUT"
    if isinstance(exc, urllib.error.HTTPError):
        code = exc.code
        if code in (401, 403, 429):
            return "ACCESS_DENIED"
        if code == 404:
            return "BROKEN_LINK"
        if 500 <= code < 600:
            return "SERVER_ERROR"
        return "HTTP_ERROR"
    if isinstance(exc, urllib.error.URLError):
        return "TIMEOUT" if "timed out" in str(exc).lower() else "CONNECTION_ERROR"
    if isinstance(exc, ssl.SSLError):
        return "SSL_ERROR"
    return "ERROR"


def exists_nonempty(path: Path) -> bool:
    return path.exists() and path.stat().st_size > 0


def download_url(
    url: str,
    dest: Path,
    *,
    min_bytes: int = 1,
    max_attempts: int = 3,
    timeout: int = 60,
    headers: dict | None = None,
    data: bytes | None = None,
    method: str | None = None,
    overwrite: bool = False,
    expect_json: bool = False,
) -> DownloadResult:
    """Download `url` to `dest`. Existing non-empty files are kept unless overwrite.

    Returns a DownloadResult with a status from the project's failure taxonomy.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    if exists_nonempty(dest) and not overwrite:
        return DownloadResult(
            "DOWNLOADED", dest, dest.stat().st_size, None, None, None, 0, skipped=True
        )

    hdrs = dict(HEADERS)
    if headers:
        hdrs.update(headers)

    last_err: str | None = None
    last_status = "ERROR"
    for attempt in range(1, max_attempts + 1):
        tmp = dest.with_suffix(dest.suffix + ".part")
        try:
            req = urllib.request.Request(url, headers=hdrs, data=data, method=method)
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                ctype = resp.headers.get("content-type")
                payload = resp.read()
                code = resp.status
            if len(payload) < min_bytes:
                last_err = f"payload {len(payload)} bytes < min {min_bytes}"
                last_status = "MISSING_DATA"
                time.sleep(1.5 * attempt)
                continue
            if expect_json:
                try:
                    json.loads(payload.decode("utf-8", "replace"))
                except Exception as e:  # noqa: BLE001
                    last_err = f"invalid JSON: {e}"
                    last_status = "PARSING_ERROR"
                    time.sleep(1.5 * attempt)
                    continue
            tmp.write_bytes(payload)
            tmp.replace(dest)
            return DownloadResult("DOWNLOADED", dest, len(payload), code, None, ctype, attempt)
        except Exception as e:  # noqa: BLE001
            last_status = classify_exception(e)
            last_err = f"{type(e).__name__}: {e}"
            try:
                tmp.unlink(missing_ok=True)
            except OSError:
                pass
            if attempt < max_attempts:
                time.sleep(2 * attempt)
    return DownloadResult(last_status, None, 0, None, last_err, None, max_attempts)


def http_get_json(url: str, *, timeout: int = 45, max_attempts: int = 3,
                  method: str = "GET", payload: dict | None = None,
                  headers: dict | None = None, lax_ssl: bool = False):
    """Return (parsed_json_or_None, status_str, error_str)."""
    hdrs = dict(HEADERS)
    hdrs["Accept"] = "application/json, text/plain, */*"
    if payload is not None:
        hdrs["Content-Type"] = "application/json"
    if headers:
        hdrs.update(headers)
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    ctx = SSL_CTX_LAX if lax_ssl else SSL_CTX
    last_status, last_err = "ERROR", None
    for attempt in range(1, max_attempts + 1):
        try:
            req = urllib.request.Request(url, headers=hdrs, data=body, method=method)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                raw = resp.read()
            return json.loads(raw.decode("utf-8", "replace")), "OK", None
        except Exception as e:  # noqa: BLE001
            last_status, last_err = classify_exception(e), f"{type(e).__name__}: {e}"
            if isinstance(e, urllib.error.URLError) and "CERTIFICATE_VERIFY_FAILED" in str(e):
                last_status = "SSL_ERROR"
                break
            if attempt < max_attempts:
                time.sleep(2 * attempt)
    return None, last_status, last_err


def fetch_bytes(url: str, *, timeout: int = 45, lax_ssl: bool = False,
                data: bytes | None = None, method: str | None = None,
                headers: dict | None = None):
    """Return (payload_or_None, status_str, error_str). Retries the strict TLS
    context first, then retries once with the lax context if - and only if -
    certificate verification is what failed."""
    hdrs = dict(HEADERS)
    if headers:
        hdrs.update(headers)
    attempts = [(SSL_CTX, "strict"), (SSL_CTX_LAX, "lax")] if lax_ssl else [(SSL_CTX, "strict")]
    last_status, last_err = "ERROR", None
    for ctx, mode in attempts:
        for attempt in range(1, 3):
            try:
                req = urllib.request.Request(url, headers=hdrs, data=data, method=method)
                with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                    return resp.read(), "OK", mode
            except Exception as e:  # noqa: BLE001
                last_status, last_err = classify_exception(e), f"{type(e).__name__}: {e}"
                if isinstance(e, urllib.error.URLError) and "CERTIFICATE_VERIFY_FAILED" in str(e):
                    break  # try lax context next
                if last_status in ("BROKEN_LINK", "ACCESS_DENIED"):
                    return None, last_status, last_err
                time.sleep(1.5 * attempt)
    return None, last_status, last_err


def write_failure(name: str, payload: dict) -> None:
    """Persist a failure record into data/failures/ (never into raw/)."""
    ensure_dirs()
    safe = "".join(c if (c.isalnum() or c in "-_.") else "_" for c in name)
    out = FAILURES / f"{safe}.json"
    payload = dict(payload)
    payload.setdefault("logged_at", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    hist = []
    if out.exists():
        try:
            hist = json.loads(out.read_text(encoding="utf-8"))
            if not isinstance(hist, list):
                hist = [hist]
        except Exception:  # noqa: BLE001
            hist = []
    hist.append(payload)
    out.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
