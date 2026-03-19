"""
Configuration management for the Anime World API.

Settings are loaded from environment variables with sensible defaults.
Use the `get_settings()` function (cached via lru_cache) to access config
throughout the application — never import os.environ directly in route files.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load .env from the backend directory (or project root as fallback)
_ROOT = Path(__file__).parent
load_dotenv(_ROOT / ".env", override=False)


class Settings:
    """
    Central configuration object.

    All values are read from environment variables at instantiation time.
    Sensitive defaults are only used for local development; production
    deployments must supply real secrets via the environment.
    """

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    APP_NAME: str = os.environ.get("APP_NAME", "Anime World API")
    APP_VERSION: str = os.environ.get("APP_VERSION", "1.0.0")
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")  # development | staging | production
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"
    PORT: int = int(os.environ.get("PORT", "8001"))

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    MONGO_URL: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.environ.get("DB_NAME", "anime_world")
    # Motor connection pool
    DB_MIN_POOL_SIZE: int = int(os.environ.get("DB_MIN_POOL_SIZE", "5"))
    DB_MAX_POOL_SIZE: int = int(os.environ.get("DB_MAX_POOL_SIZE", "20"))
    DB_CONNECT_TIMEOUT_MS: int = int(os.environ.get("DB_CONNECT_TIMEOUT_MS", "5000"))
    DB_SERVER_SELECTION_TIMEOUT_MS: int = int(
        os.environ.get("DB_SERVER_SELECTION_TIMEOUT_MS", "5000")
    )

    # ------------------------------------------------------------------
    # JWT / Auth
    # ------------------------------------------------------------------
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "anime-world-dev-secret-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = int(os.environ.get("JWT_EXPIRATION_HOURS", "72"))
    JWT_REFRESH_EXPIRATION_DAYS: int = int(os.environ.get("JWT_REFRESH_EXPIRATION_DAYS", "30"))

    # ------------------------------------------------------------------
    # Security
    # ------------------------------------------------------------------
    MAX_LOGIN_ATTEMPTS: int = int(os.environ.get("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_DURATION_MINUTES: int = int(os.environ.get("LOCKOUT_DURATION_MINUTES", "15"))
    PASSWORD_RESET_EXPIRY_HOURS: int = int(os.environ.get("PASSWORD_RESET_EXPIRY_HOURS", "24"))
    PASSWORD_MIN_LENGTH: int = int(os.environ.get("PASSWORD_MIN_LENGTH", "8"))

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    # Comma-separated list of allowed origins; "*" allows all (dev only)
    CORS_ORIGINS_RAW: str = os.environ.get("CORS_ORIGINS", "*")

    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = self.CORS_ORIGINS_RAW.strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    # ------------------------------------------------------------------
    # Rate limiting (requests per minute per IP)
    # ------------------------------------------------------------------
    RATE_LIMIT_ENABLED: bool = os.environ.get("RATE_LIMIT_ENABLED", "false").lower() == "true"
    RATE_LIMIT_AUTH_RPM: int = int(os.environ.get("RATE_LIMIT_AUTH_RPM", "10"))
    RATE_LIMIT_API_RPM: int = int(os.environ.get("RATE_LIMIT_API_RPM", "120"))

    # ------------------------------------------------------------------
    # Logging
    # ------------------------------------------------------------------
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    LOG_JSON: bool = os.environ.get("LOG_JSON", "false").lower() == "true"

    # ------------------------------------------------------------------
    # Error tracking (Sentry)
    # ------------------------------------------------------------------
    SENTRY_DSN: Optional[str] = os.environ.get("SENTRY_DSN")
    SENTRY_TRACES_SAMPLE_RATE: float = float(
        os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.1")
    )

    # ------------------------------------------------------------------
    # Feature flags
    # ------------------------------------------------------------------
    FEATURE_EMAIL_VERIFICATION: bool = (
        os.environ.get("FEATURE_EMAIL_VERIFICATION", "false").lower() == "true"
    )
    FEATURE_PREMIUM_CONTENT: bool = (
        os.environ.get("FEATURE_PREMIUM_CONTENT", "false").lower() == "true"
    )
    FEATURE_OAUTH2: bool = (
        os.environ.get("FEATURE_OAUTH2", "false").lower() == "true"
    )
    FEATURE_WEBHOOKS: bool = (
        os.environ.get("FEATURE_WEBHOOKS", "false").lower() == "true"
    )

    # ------------------------------------------------------------------
    # File uploads
    # ------------------------------------------------------------------
    UPLOAD_DIR: Path = Path(os.environ.get("UPLOAD_DIR", str(_ROOT / "uploads")))
    MAX_AVATAR_SIZE_MB: int = int(os.environ.get("MAX_AVATAR_SIZE_MB", "20"))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def max_avatar_size_bytes(self) -> int:
        return self.MAX_AVATAR_SIZE_MB * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the singleton Settings instance (cached after first call)."""
    return Settings()
