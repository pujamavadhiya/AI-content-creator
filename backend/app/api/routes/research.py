from typing import List, Optional
from fastapi import APIRouter, Depends, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auth import User
from app.core.dependencies import get_current_user, require_role
from app.schemas.research import (
    KeywordGenerateRequest, KeywordResponse,
    MultiPlatformKeywordRequest, MultiPlatformKeywordResponse,
    SerpGapRequest, SerpGapResponse,
    TopicGenerateRequest, TopicResponse, TopicClusterResponse,
    OutlineGenerateRequest, OutlineUpdateRequest, OutlineResponse
)
from app.services.keyword_service import KeywordService
from app.services.topic_service import TopicService
from app.services.outline_service import OutlineService
from app.services.serp_service import SerpService

router = APIRouter(prefix="/api/research", tags=["Research & Intelligence"])

# --- Keywords ---
@router.post("/keywords", response_model=List[KeywordResponse])
async def generate_keywords(
    data: KeywordGenerateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    keywords = await KeywordService.generate_keywords(data, current_user.organization_id, current_user.id, db)
    return [KeywordResponse.model_validate(k) for k in keywords]

@router.get("/keywords", response_model=List[KeywordResponse])
async def list_keywords(
    brand_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    keywords = await KeywordService.get_keywords(current_user.organization_id, db, brand_id=brand_id)
    return [KeywordResponse.model_validate(k) for k in keywords]

@router.post("/keywords/multi-platform", response_model=MultiPlatformKeywordResponse)
async def generate_multi_platform_keywords_endpoint(
    data: MultiPlatformKeywordRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await KeywordService.generate_multi_platform_keywords(data, current_user.organization_id, current_user.id, db)
    return MultiPlatformKeywordResponse.model_validate(result)

# --- SERP Gap Research ---
@router.post("/serp-gap", response_model=SerpGapResponse)
async def analyze_serp_gaps_endpoint(
    data: SerpGapRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await SerpService.analyze_serp_gaps(data, current_user.organization_id, current_user.id, db)
    return SerpGapResponse.model_validate(result)

@router.post("/serp-gap/export")
async def export_serp_gap_docx_endpoint(
    data: SerpGapResponse,
    current_user: User = Depends(get_current_user)
):
    doc_io = SerpService.export_docx(data.model_dump())
    return StreamingResponse(
        doc_io,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=SERP_Gap_{data.niche.replace(' ', '_')}.docx"}
    )

# --- Topics ---
@router.post("/topics", response_model=List[TopicResponse])
async def generate_topics(
    data: TopicGenerateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    topics = await TopicService.generate_topics(data, current_user.organization_id, current_user.id, db)
    return [TopicResponse.model_validate(t) for t in topics]

@router.get("/topics", response_model=List[TopicResponse])
async def list_topics(
    brand_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    topics = await TopicService.get_topics(current_user.organization_id, db, brand_id=brand_id)
    return [TopicResponse.model_validate(t) for t in topics]

@router.post("/clusters", response_model=List[TopicClusterResponse])
async def cluster_topics(
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    clusters = await TopicService.cluster_topics(current_user.organization_id, db)
    return [TopicClusterResponse.model_validate(c) for c in clusters]

# --- Outlines ---
@router.post("/outlines", response_model=OutlineResponse, status_code=status.HTTP_201_CREATED)
async def generate_outline(
    data: OutlineGenerateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    outline = await OutlineService.generate_outline(data, current_user.organization_id, current_user.id, db)
    return OutlineResponse.model_validate(outline)

@router.get("/outlines", response_model=List[OutlineResponse])
async def list_outlines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    outlines = await OutlineService.get_outlines(current_user.organization_id, db)
    return [OutlineResponse.model_validate(o) for o in outlines]

@router.get("/outlines/{outline_id}", response_model=OutlineResponse)
async def get_outline(
    outline_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    outline = await OutlineService.get_outline(outline_id, current_user.organization_id, db)
    return OutlineResponse.model_validate(outline)

@router.put("/outlines/{outline_id}", response_model=OutlineResponse)
async def update_outline(
    outline_id: str,
    data: OutlineUpdateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    outline = await OutlineService.update_outline(outline_id, data, current_user.organization_id, db)
    return OutlineResponse.model_validate(outline)

