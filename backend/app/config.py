import json
import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerPilot AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./careerpilot.db"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    # Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # JWT Authentication
    JWT_SECRET: str = "careerpilot-ai-secure-jwt-key-change-in-production"

    # Demo Evaluation Login Control
    ENABLE_DEMO_LOGIN: bool = True
    DEMO_USER_PASSWORD: str = ""

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
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
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
