from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self) -> None:
        self.app_name = os.getenv("APP_NAME", "Business Discovery and Enrichment API")
        self.app_env = os.getenv("APP_ENV", "development")
        self.api_prefix = os.getenv("API_PREFIX", "/api")
        self.google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        self.request_timeout_seconds = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "20"))
        self.max_retry_attempts = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
        self.default_max_results = int(os.getenv("DEFAULT_MAX_RESULTS", "20"))
        self.max_allowed_results = int(os.getenv("MAX_ALLOWED_RESULTS", "100"))

        cors_raw = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000")
        self.backend_cors_origins: List[str] = [
            origin.strip() for origin in cors_raw.split(",") if origin.strip()
        ]

        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

        self.google_sheets_webhook_url = os.getenv("GOOGLE_SHEETS_WEBHOOK_URL", "")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

