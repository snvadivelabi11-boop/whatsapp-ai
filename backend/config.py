import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Determine root dir (.env is in parent of backend)
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    # OpenRouter API
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Firebase Admin SDK (Firestore)
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""

    # WhatsApp Cloud API
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "sih_ai_verify_token_secure_2025"
    WHATSAPP_API_VERSION: str = "v18.0"

    # Admin Settings
    ADMIN_PHONE_NUMBER: str = "+919876543210"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,*"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_firebase_configured(self) -> bool:
        return bool(self.FIREBASE_PROJECT_ID and self.FIREBASE_PRIVATE_KEY and self.FIREBASE_CLIENT_EMAIL)

    @property
    def is_openrouter_configured(self) -> bool:
        return bool(self.OPENROUTER_API_KEY and self.OPENROUTER_API_KEY.strip() and not self.OPENROUTER_API_KEY.startswith("your_"))

    @property
    def is_whatsapp_configured(self) -> bool:
        return bool(self.WHATSAPP_ACCESS_TOKEN and self.WHATSAPP_PHONE_NUMBER_ID)


settings = Settings()
