"""
Application configuration.
All values are read from environment variables / .env file.
No secrets are hardcoded.
"""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./terramind_dev.db"

    # ── External Data APIs ────────────────────────────────────────────────────
    data_gov_in_api_key: Optional[str] = None
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"

    # ── LLM ──────────────────────────────────────────────────────────────────
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    llm_provider: str = "groq"
    groq_model: str = "llama-3.3-70b-versatile"
    gemini_model: str = "gemini-1.5-flash"

    # ── Application ───────────────────────────────────────────────────────────
    app_env: str = "development"
    demo_mode: bool = False
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"

    # ── Model storage ─────────────────────────────────────────────────────────
    model_artifact_dir: str = "./backend/models"

    # ── Scheduler ─────────────────────────────────────────────────────────────
    scheduler_enabled: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def model_dir(self) -> Path:
        p = Path(self.model_artifact_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


settings = Settings()
