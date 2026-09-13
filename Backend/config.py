from __future__ import annotations

import os


def env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


LLM_MODEL = os.getenv("LLM_MODEL", "GPT-6 Astra")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "").rstrip("/")
LLM_CHAT_COMPLETIONS_PATH = os.getenv("LLM_CHAT_COMPLETIONS_PATH", "/chat/completions")
DEMO_MODE = env_flag("DEMO_MODE")
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "20"))
FRONTEND_ORIGINS = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173").split(",") if origin.strip()]
