"""
Structured logging setup using structlog.
Never logs passwords, API keys, or sensitive credentials.
"""
from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import settings

# Fields that must never appear in log output
_REDACTED_KEYS = {
    "password", "api_key", "secret", "token", "groq_api_key",
    "gemini_api_key", "data_gov_in_api_key", "authorization",
}


def _redact_sensitive(logger, method, event_dict):
    for key in list(event_dict.keys()):
        if any(s in key.lower() for s in _REDACTED_KEYS):
            event_dict[key] = "***REDACTED***"
    return event_dict


def configure_logging() -> None:
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            _redact_sensitive,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer()
            if settings.app_env == "development"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )


def get_logger(name: str | None = None):
    return structlog.get_logger(name)
