from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security & Auth
    SECRET_KEY: str = "sevencore_super_secret_session_key_production_grade_32_bytes"
    JWT_SECRET_KEY: str = "sevencore_jwt_secret_token_signing_key_secure_32_bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    CREDENTIAL_ENCRYPTION_KEY: str = "JlV_RC1AD72wP2DoN4QG4x56K4tWMy-nNOvQw7kCYuA="
    
    # URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"
    
    # Vector Database
    QDRANT_URL: str = "./data/qdrant"
    QDRANT_API_KEY: Optional[str] = None
    
    # Cache / Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Primary Default AI Provider
    DEFAULT_AI_PROVIDER: str = "gemini"
    
    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Anthropic
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    EXPORT_DIR: str = "./exports"
    MAX_UPLOAD_SIZE_MB: int = 25
    
    # Model config
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure required local directories exist
for folder in ["./data", settings.UPLOAD_DIR, settings.EXPORT_DIR]:
    Path(folder).mkdir(parents=True, exist_ok=True)
