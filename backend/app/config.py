import json
import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent

APPROVED_PRODUCTION_ORIGINS: List[str] = [
    "https://career-pilot-doncscz65-pixel-5edd96ca.vercel.app",
    "https://career-pilot.vercel.app",
]

DEFAULT_DEV_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerPilot AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./careerpilot.db"
    CORS_ORIGINS: Union[List[str], str] = []
    # Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # JWT Authentication
    JWT_SECRET: str = "careerpilot-ai-secure-jwt-key-change-in-production"

    # Demo Evaluation Login Control (Development Only)
    ENABLE_DEMO_LOGIN: bool = True
    DEMO_USER_PASSWORD: str = ""

    # Public Demo Login Configuration (Visitor Exploration)
    ENABLE_PUBLIC_DEMO_LOGIN: bool = False
    DEMO_ACCOUNT_EMAIL: str = "demo@careerpilot.ai"
    DEMO_ACCOUNT_PASSWORD: str = ""

    # Upload Constraints
    MAX_UPLOAD_SIZE_MB: int = 5
    MAX_PDF_PAGES: int = 15

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        env = str(info.data.get("ENVIRONMENT", "development")).strip().lower()
        if env == "production":
            clean_secret = v.strip() if v else ""
            if not clean_secret or clean_secret == "careerpilot-ai-secure-jwt-key-change-in-production" or len(clean_secret) < 32:
                raise ValueError(
                    "CRITICAL PRODUCTION CONFIGURATION ERROR: JWT_SECRET environment variable is missing, "
                    "using default fallback, or shorter than 32 characters. A strong production secret key "
                    "is required to start the server in production mode."
                )
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        env = os.environ.get("ENVIRONMENT", "development").strip().lower()
        default_fallback = (
            list(APPROVED_PRODUCTION_ORIGINS)
            if env == "production"
            else list(DEFAULT_DEV_ORIGINS) + list(APPROVED_PRODUCTION_ORIGINS)
        )
        if isinstance(v, str):
            v_clean = v.strip()
            if not v_clean:
                cleaned = []
            else:
                try:
                    parsed = json.loads(v_clean)
                    if isinstance(parsed, list):
                        cleaned = [str(o).strip().strip("'\"").rstrip("/") for o in parsed if str(o).strip().strip("'\"")]
                    else:
                        cleaned = []
                except Exception:
                    cleaned = [o.strip().strip("'\"").rstrip("/") for o in v_clean.split(",") if o.strip().strip("'\"")]
        elif isinstance(v, list):
            cleaned = [str(o).strip().strip("'\"").rstrip("/") for o in v if str(o).strip().strip("'\"")]
        else:
            cleaned = []

        if not cleaned:
            return default_fallback

        for domain in APPROVED_PRODUCTION_ORIGINS:
            if domain not in cleaned:
                cleaned.append(domain)
        return cleaned

    @field_validator("CORS_ORIGINS")
    @classmethod
    def finalize_cors_origins(cls, v: List[str], info: ValidationInfo) -> List[str]:
        env = str(info.data.get("ENVIRONMENT", os.environ.get("ENVIRONMENT", "development"))).strip().lower()
        if env == "production":
            # In production, ensure development origins are never accidentally authorized
            safe_origins = [o for o in v if not any(dev in o for dev in ["localhost", "127.0.0.1"])]
            return safe_origins or list(APPROVED_PRODUCTION_ORIGINS)
        return v

    model_config = SettingsConfigDict(
        env_file=(
            str(BACKEND_DIR / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
