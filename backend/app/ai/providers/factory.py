from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.openai_provider import OpenAIProvider
from app.ai.providers.claude_provider import ClaudeProvider
from app.ai.providers.mock_provider import MockAIProvider
from app.models.ai_config import APICredential, AIModelConfig
from app.core.encryption import decrypt_credential
from app.config import settings

async def get_ai_provider(
    provider_slug: Optional[str] = None,
    org_id: Optional[str] = None,
    db: Optional[AsyncSession] = None,
    force_mock: bool = False
) -> BaseAIProvider:
    """
    Factory function resolving AI Provider adapter.
    Resolution priority:
    1. force_mock flag -> MockAIProvider
    2. Database stored encrypted credentials for organization
    3. Environment variables (settings)
    """
    if force_mock or settings.ENVIRONMENT == "test":
        return MockAIProvider()

    slug = provider_slug or settings.DEFAULT_AI_PROVIDER or "gemini"
    slug = slug.lower().strip()

    api_key: Optional[str] = None
    model_name: Optional[str] = None

    # Check database for custom org credential and model configuration
    if db and org_id:
        stmt_cred = select(APICredential).where(
            APICredential.organization_id == org_id,
            APICredential.provider_slug == slug
        )
        res_cred = await db.execute(stmt_cred)
        cred = res_cred.scalar_one_or_none()
        if cred and cred.encrypted_api_key:
            api_key = decrypt_credential(cred.encrypted_api_key)

        stmt_cfg = select(AIModelConfig).where(
            AIModelConfig.organization_id == org_id,
            AIModelConfig.provider_slug == slug
        )
        res_cfg = await db.execute(stmt_cfg)
        cfg = res_cfg.scalar_one_or_none()
        if cfg and cfg.model_name:
            model_name = cfg.model_name

    # Fallback to environment variables
    if not api_key:
        if slug == "gemini":
            api_key = settings.GEMINI_API_KEY
            model_name = model_name or settings.GEMINI_MODEL
        elif slug == "openai":
            api_key = settings.OPENAI_API_KEY
            model_name = model_name or settings.OPENAI_MODEL
        elif slug == "claude":
            api_key = settings.ANTHROPIC_API_KEY
            model_name = model_name or settings.ANTHROPIC_MODEL

    # Instantiate provider adapter
    if slug == "gemini":
        return GeminiProvider(api_key=api_key, model_name=model_name)
    elif slug == "openai":
        return OpenAIProvider(api_key=api_key, model_name=model_name)
    elif slug == "claude":
        return ClaudeProvider(api_key=api_key, model_name=model_name)
    elif slug == "mock":
        return MockAIProvider(model_name=model_name or "mock-model")
    else:
        raise ValueError(f"Unsupported AI Provider slug: {slug}")
