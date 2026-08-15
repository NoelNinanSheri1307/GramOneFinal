"""Application configuration.

Values are read from environment variables and from a `.env` file at the
repository root (see `.env.example`). No secrets belong in source control.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: str = "development"
    log_level: str = "INFO"

    api_prefix: str = "/api/v1"

    cors_allow_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    database_url: str = "postgresql+psycopg2://gramone:gramone@localhost:5432/gramone"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    ai_provider: str = "unconfigured"
    ai_model: str = ""
    ai_api_key: str = ""

    openrouter_api_key: str = ""
    openrouter_model: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_timeout_seconds: int = 30

    frontend_origin: str = "http://localhost:5173"
    newsdata_api_key: str = ""

    @model_validator(mode="after")
    def _require_jwt_secret_outside_tests(self) -> "Settings":
        if self.environment != "test" and not self.jwt_secret_key:
            raise ValueError(
                "JWT_SECRET_KEY must be set in .env (non-test environments). "
                "Generate one locally, e.g.: "
                'python -c "import secrets; print(secrets.token_urlsafe(64))"'
            )
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()