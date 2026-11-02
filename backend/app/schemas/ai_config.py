from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AIProviderResponse(BaseModel):
    id: str
    name: str
    slug: str
    is_active: bool
    default_model: str
    embedding_model: str
    has_key_configured: bool = False
    key_hint: Optional[str] = None
    last_tested_at: Optional[datetime] = None

class ConfigUpdateRequest(BaseModel):
    provider_slug: str
    model_name: Optional[str] = None
    embedding_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None

class CredentialSaveRequest(BaseModel):
    provider_slug: str  # gemini, openai, claude
    api_key: str

class ConnectionTestRequest(BaseModel):
    provider_slug: str

class ConnectionTestResponse(BaseModel):
    provider_slug: str
    success: bool
    message: str
    model: str
