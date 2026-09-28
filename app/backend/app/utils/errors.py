"""Standardised error responses for TerraMind-X API."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import Request
from fastapi.responses import JSONResponse


def error_response(
    status: str,
    message: str,
    missing_data: Optional[List[str]] = None,
    suggested_action: Optional[str] = None,
    http_code: int = 400,
) -> JSONResponse:
    return JSONResponse(
        status_code=http_code,
        content={
            "status": status,
            "message": message,
            "missing_data": missing_data or [],
            "suggested_action": suggested_action,
            "generated_at": datetime.utcnow().isoformat(),
        },
    )


async def validation_exception_handler(request: Request, exc):
    from fastapi.exceptions import RequestValidationError
    errors = []
    for e in exc.errors():
        field = ".".join(str(x) for x in e.get("loc", []))
        errors.append(f"{field}: {e['msg']}")
    return error_response(
        status="VALIDATION_ERROR",
        message="Input validation failed",
        missing_data=errors,
        suggested_action="Check the request body against the API schema at /docs",
        http_code=422,
    )
