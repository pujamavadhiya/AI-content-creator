from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.auth import User
from app.models.ai_config import AIProvider, AIModelConfig, APICredential
from app.schemas.ai_config import (
    AIProviderResponse, ConfigUpdateRequest, CredentialSaveRequest,
    ConnectionTestRequest, ConnectionTestResponse
)
from app.core.dependencies import get_current_user, require_role
from app.core.encryption import encrypt_credential, decrypt_credential
from app.ai.providers.factory import get_ai_provider
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["AI Model Management"])

@router.get("/providers", response_model=List[AIProviderResponse])
async def list_providers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    providers_def = [
        {
            "id": "prov_gemini",
            "name": "Google Gemini",
            "slug": "gemini",
            "is_active": True,
            "default_model": settings.GEMINI_MODEL or "gemini-2.0-flash",
            "embedding_model": settings.GEMINI_EMBEDDING_MODEL or "text-embedding-004",
            "env_configured": bool(settings.GEMINI_API_KEY)
        },
        {
            "id": "prov_openai",
            "name": "OpenAI",
            "slug": "openai",
            "is_active": True,
            "default_model": settings.OPENAI_MODEL or "gpt-4o",
            "embedding_model": settings.OPENAI_EMBEDDING_MODEL or "text-embedding-3-small",
            "env_configured": bool(settings.OPENAI_API_KEY)
        },
        {
            "id": "prov_claude",
            "name": "Anthropic Claude",
            "slug": "claude",
            "is_active": True,
            "default_model": settings.ANTHROPIC_MODEL or "claude-3-5-sonnet-20241022",
            "embedding_model": "text-embedding-004 (via Gemini)",
            "env_configured": bool(settings.ANTHROPIC_API_KEY)
        }
    ]

    # Check DB stored credentials
    stmt = select(APICredential).where(APICredential.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    db_creds = {c.provider_slug: c for c in res.scalars().all()}

    output: List[AIProviderResponse] = []
    for p in providers_def:
        slug = p["slug"]
        db_c = db_creds.get(slug)
        has_key = p["env_configured"] or (db_c is not None and bool(db_c.encrypted_api_key))
        hint = db_c.key_hint if db_c else ("Configured in .env" if p["env_configured"] else None)
        last_tested = db_c.last_tested_at if db_c else None

        output.append(AIProviderResponse(
            id=p["id"],
            name=p["name"],
            slug=slug,
            is_active=p["is_active"],
            default_model=p["default_model"],
            embedding_model=p["embedding_model"],
            has_key_configured=has_key,
            key_hint=hint,
            last_tested_at=last_tested
        ))

    return output

@router.post("/credentials", status_code=status.HTTP_200_OK)
async def save_credential(
    data: CredentialSaveRequest,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    key = data.api_key.strip()
    if not key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="API key cannot be empty")

    hint = f"...{key[-4:]}" if len(key) >= 4 else "...key"
    encrypted = encrypt_credential(key)

    stmt = select(APICredential).where(
        APICredential.organization_id == current_user.organization_id,
        APICredential.provider_slug == data.provider_slug
    )
    res = await db.execute(stmt)
    cred = res.scalar_one_or_none()

    if cred:
        cred.encrypted_api_key = encrypted
        cred.key_hint = hint
        cred.is_valid = True
    else:
        cred = APICredential(
            organization_id=current_user.organization_id,
            provider_slug=data.provider_slug,
            encrypted_api_key=encrypted,
            key_hint=hint,
            is_valid=True
        )
        db.add(cred)

    await db.commit()
    return {"status": "success", "message": f"Credential for {data.provider_slug} securely stored."}

@router.post("/test-connection", response_model=ConnectionTestResponse)
async def test_connection(
    data: ConnectionTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        provider = await get_ai_provider(provider_slug=data.provider_slug, org_id=current_user.organization_id, db=db)
        test_res = await provider.test_connection()

        # Update last_tested_at in db if cred exists
        stmt = select(APICredential).where(
            APICredential.organization_id == current_user.organization_id,
            APICredential.provider_slug == data.provider_slug
        )
        cred = (await db.execute(stmt)).scalar_one_or_none()
        if cred:
            cred.last_tested_at = datetime.now(timezone.utc)
            await db.commit()

        return ConnectionTestResponse(
            provider_slug=data.provider_slug,
            success=True,
            message=test_res.get("message", "Connection verified successfully"),
            model=test_res.get("model", data.provider_slug)
        )
    except Exception as e:
        return ConnectionTestResponse(
            provider_slug=data.provider_slug,
            success=False,
            message=f"Connection check failed: {str(e)}",
            model=data.provider_slug
        )

