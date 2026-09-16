"""
Core application configuration.
All settings are loaded from environment variables via Pydantic BaseSettings.
This is the ONLY place where environment variables are read.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

_backend_dir = Path(__file__).resolve().parent.parent.parent
_project_dir = _backend_dir.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[
            str(_project_dir / ".env"),
            str(_backend_dir / ".env"),
            ".env",
            "backend/.env",
        ],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "GOIP Government File Tracking System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    VITE_SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_STORAGE_BUCKET: str = "gov-documents"

    @property
    def is_placeholder_key(self) -> callable:
        def _check(val: str) -> bool:
            if not val:
                return True
            s = val.strip()
            return len(s) < 20 or s.startswith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30") or "your-" in s
        return _check

    @property
    def effective_secret_key(self) -> str:
        """
        Preferred secret/service role key for server-side Supabase operations.
        Falls back to publishable key if no valid secret key is provided.
        """
        is_bad = self.is_placeholder_key
        for key in [self.SUPABASE_SECRET_KEY, self.SUPABASE_SERVICE_ROLE_KEY]:
            if key and not is_bad(key):
                return key.strip()
        # Fallback to publishable key for client initialization
        return self.effective_publishable_key

    @property
    def effective_publishable_key(self) -> str:
        """
        Publishable / anon key for Supabase API interactions.
        """
        is_bad = self.is_placeholder_key
        for key in [self.SUPABASE_PUBLISHABLE_KEY, self.SUPABASE_ANON_KEY, self.VITE_SUPABASE_ANON_KEY]:
            if key and not is_bad(key):
                return key.strip()
        return ""

    # CORS (comma-separated string from env, parsed into list)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 20

    # OCR
    TESSERACT_CMD: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    # ----------------------------------------------------------------
    # Session-Ephemeral Mode
    # When True the procurement SQLite database is wiped and re-seeded
    # from the pristine deterministic baseline on every backend startup.
    # All session-created/modified data (tenders, bidders, documents,
    # compliance results, audit events) disappears on restart.
    # Set to False for production deployments where data must persist.
    # ----------------------------------------------------------------
    DEMO_SESSION_MODE: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


# Singleton — import this everywhere
settings = Settings()

