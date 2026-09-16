from functools import lru_cache
from typing import Optional
from pydantic import Field, AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    database_url: str = Field(default="sqlite+aiosqlite:///./terramind_x.db")
    groq_api_key: Optional[str] = Field(default=None)
    groq_api_url: AnyUrl = Field(default="https://api.groq.ai")
    
    # NVIDIA NIM configurations
    nvidia_api_key: Optional[str] = Field(default=None)
    nvidia_base_url: str = Field(default="https://integrate.api.nvidia.com/v1")
    nvidia_model: str = Field(default="meta/llama-3.3-70b-instruct")

    # Experiential OpenAI-compatible LLM gateway
    explabs_api_key: Optional[str] = Field(default=None)
    explabs_base_url: str = Field(default="https://api.experientiallabs.ai/v1")
    explabs_model: str = Field(default="gpt-6-astra")
    
    # Government OGD Data portal config
    data_gov_api_key: Optional[str] = Field(default=None)
    data_gov_market_resource_id: Optional[str] = Field(default="9ef84268-d588-465a-a308-a864a43d0070")
    data_gov_crop_resource_id: Optional[str] = Field(default=None)
    market_cache_ttl_minutes: int = Field(default=60)
    
    cache_ttl_seconds: int = Field(default=86400)
    
    # n8n Webhook automation secrets
    n8n_base_url: Optional[str] = Field(default="http://localhost:5678")
    n8n_webhook_secret: Optional[str] = Field(default="terramind_n8n_skey_2026")
    
    default_tamil_locale: str = "ta_IN"
    enable_local_explanation: bool = Field(default=True)
    debug: bool = Field(default=False)
    cors_allowed_origins: str = Field(default="http://localhost:5173,http://localhost:4173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:4173,http://127.0.0.1:3000,http://localhost:8000")


@lru_cache()
def get_settings() -> Settings:
    return Settings()



