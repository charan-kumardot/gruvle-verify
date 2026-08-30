"""
Central settings. Every external integration is optional at the settings layer —
absence of a key means that provider is unavailable, not a startup crash. Providers
decide for themselves how to degrade (see providers/*/router.py).
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root is two levels up from backend/app/ — .env.local lives there (shared
# location documented in current_status.md), not inside backend/, so resolve it by
# path rather than relying on the process's working directory.
_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_REPO_ROOT / ".env.local", _REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_db_url: str | None = None
    supabase_jwt_secret: str | None = None

    # LLM providers
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    openrouter_api_key: str | None = None

    # Search
    searxng_base_url: str | None = None

    # Email
    resend_api_key: str | None = None

    # Misc
    puter_js_enabled: bool = False
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
