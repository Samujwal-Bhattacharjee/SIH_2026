"""
Core application configuration.
All settings are loaded from environment variables via Pydantic BaseSettings.
This is the ONLY place where environment variables are read.
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "GOIP Government File Tracking System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_STORAGE_BUCKET: str = "gov-documents"

    # CORS (comma-separated string from env, parsed into list)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 20

    # OCR
    TESSERACT_CMD: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


# Singleton — import this everywhere
settings = Settings()

