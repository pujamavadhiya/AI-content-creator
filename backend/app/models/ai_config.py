from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey, DateTime
from app.models.base import TimeStampedModel

class AIProvider(TimeStampedModel):
    __tablename__ = "ai_providers"

    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    default_model = Column(String(100), nullable=False)
    embedding_model = Column(String(100), nullable=False)

class AIModelConfig(TimeStampedModel):
    __tablename__ = "ai_model_configs"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_slug = Column(String(50), default="gemini", nullable=False)
    model_name = Column(String(100), default="gemini-2.0-flash", nullable=False)
    embedding_model = Column(String(100), default="text-embedding-004", nullable=False)
    temperature = Column(Float, default=0.7, nullable=False)
    max_tokens = Column(Integer, default=4096, nullable=False)
    top_k = Column(Integer, default=5, nullable=False)
    similarity_threshold = Column(Float, default=0.65, nullable=False)

class APICredential(TimeStampedModel):
    __tablename__ = "api_credentials"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_slug = Column(String(50), nullable=False)  # gemini, openai, claude
    encrypted_api_key = Column(String(1000), nullable=False)
    key_hint = Column(String(20), nullable=False)  # e.g., "...Ab4e"
    is_valid = Column(Boolean, default=True, nullable=False)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
