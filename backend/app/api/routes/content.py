from typing import List, Optional
from fastapi import APIRouter, Depends, Response, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auth import User
from app.core.dependencies import get_current_user, require_role
from app.schemas.content import (
    BlogGenerateRequest, SocialGenerateRequest, MultiPlatformGenerateRequest,
    RewriteRequest, ContentUpdate, ContentResponse, EvaluationResponse,
    HumanToneAuditRequest, HumanToneAuditResponse, UrlRewriteRequest, UrlRewriteResponse,
    ParaphraseHumanizeRequest, ParaphraseHumanizeResponse,
    SanitizeSymbolsRequest, SanitizeSymbolsResponse,
    ReplaceBannedWordsRequest, ReplaceBannedWordsResponse
)
from app.services.content_service import ContentService
from app.services.quality_service import QualityService
from app.services.export_service import ExportService
from app.services.paraphrase_service import paraphrase_service
from app.ai.skills.human_tone import sanitize_ai_symbols

router = APIRouter(prefix="/api/content", tags=["Content Generation & Studio"])

@router.post("/generate-blog", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def generate_blog(
    data: BlogGenerateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    content = await ContentService.generate_blog(data, current_user.organization_id, current_user.id, db)
    return ContentResponse.model_validate(content)

@router.post("/generate-social", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def generate_social(
    data: SocialGenerateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    content = await ContentService.generate_social(data, current_user.organization_id, current_user.id, db)
    return ContentResponse.model_validate(content)

@router.post("/generate-multiple", response_model=List[ContentResponse], status_code=status.HTTP_201_CREATED)
async def generate_multi_platform(
    data: MultiPlatformGenerateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    contents = await ContentService.generate_multi_platform(data, current_user.organization_id, current_user.id, db)
    return [ContentResponse.model_validate(c) for c in contents]

@router.post("/rewrite")
async def rewrite_text(
    data: RewriteRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    return await ContentService.rewrite_text(data, current_user.organization_id, db)

@router.post("/human-audit", response_model=HumanToneAuditResponse)
async def audit_human_tone_endpoint(
    data: HumanToneAuditRequest,
    current_user: User = Depends(get_current_user)
):
    result = ContentService.audit_text(data.text)
    return HumanToneAuditResponse.model_validate(result)

@router.post("/paraphrase-humanize", response_model=ParaphraseHumanizeResponse)
async def paraphrase_humanize_endpoint(
    data: ParaphraseHumanizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Anti-Plagiarism & Humanization Paraphraser:
    Deeply restructures syntax, disrupts n-grams, strips all raw markdown table pipe grids (|---|),
    and enforces high sentence burstiness with natural human rhythm.
    """
    result = await paraphrase_service.paraphrase_and_humanize(
        text=data.text,
        mode=data.mode,
        target_tone=data.target_tone,
        brand_id=data.brand_id,
        org_id=current_user.organization_id if current_user else None,
        provider_slug=data.provider,
        compulsory_keywords=data.compulsory_keywords,
        db=db
    )
    return ParaphraseHumanizeResponse.model_validate(result)

@router.post("/sanitize-symbols", response_model=SanitizeSymbolsResponse)
async def sanitize_symbols_endpoint(
    data: SanitizeSymbolsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Fast utility endpoint to instantly sanitize and convert raw Markdown table pipe grids (|---|)
    into clean human-readable bullet points, removing AI synthetic detector footprints.
    """
    cleaned, count = sanitize_ai_symbols(data.text)
    return SanitizeSymbolsResponse(cleaned_text=cleaned, symbols_cleaned=count)

@router.post("/replace-banned-words", response_model=ReplaceBannedWordsResponse)
async def replace_banned_words_endpoint(
    data: ReplaceBannedWordsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Instant 1-click replacement of all detected banned words and AI tells
    with natural WordNet synonyms and conversational phrasing.
    """
    result = paraphrase_service.replace_banned_words(data.text, data.compulsory_keywords)
    return ReplaceBannedWordsResponse.model_validate(result)

@router.post("/url-rewrite", response_model=UrlRewriteResponse)
async def rewrite_url_content_endpoint(
    data: UrlRewriteRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await ContentService.rewrite_url_content(data, current_user.organization_id, db)
    return UrlRewriteResponse.model_validate(result)

@router.post("/{content_id}/evaluate", response_model=EvaluationResponse)
async def evaluate_content(
    content_id: str,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    evaluation = await QualityService.evaluate_content(content_id, current_user.organization_id, current_user.id, db)
    return EvaluationResponse.model_validate(evaluation)

@router.post("/{content_id}/improve-from-report", response_model=ContentResponse)
async def improve_from_report(
    content_id: str,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    content = await QualityService.improve_content_from_report(content_id, current_user.organization_id, current_user.id, db)
    return ContentResponse.model_validate(content)

@router.get("", response_model=List[ContentResponse])
async def list_content(
    platform: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    contents = await ContentService.get_contents(current_user.organization_id, db, platform, status_filter)
    return [ContentResponse.model_validate(c) for c in contents]

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = await ContentService.get_content(content_id, current_user.organization_id, db)
    return ContentResponse.model_validate(content)

@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: str,
    data: ContentUpdate,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    content = await ContentService.update_content(content_id, data, current_user.organization_id, current_user.id, db)
    return ContentResponse.model_validate(content)

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    content = await ContentService.get_content(content_id, current_user.organization_id, db)
    await db.delete(content)
    await db.commit()

@router.get("/{content_id}/export/{format}")
async def export_content_file(
    content_id: str,
    format: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = await ContentService.get_content(content_id, current_user.organization_id, db)
    fmt = format.lower().strip()

    safe_title = "".join(c for c in content.title if c.isalnum() or c in (" ", "_", "-")).rstrip()[:40].replace(" ", "_")

    if fmt == "docx":
        buf = ExportService.export_docx(content)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{safe_title}.docx"
    elif fmt == "pdf":
        buf = ExportService.export_pdf(content)
        media_type = "application/pdf"
        filename = f"{safe_title}.pdf"
    elif fmt in ("md", "markdown"):
        buf = ExportService.export_markdown(content)
        media_type = "text/markdown"
        filename = f"{safe_title}.md"
    elif fmt in ("txt", "text"):
        buf = ExportService.export_txt(content)
        media_type = "text/plain"
        filename = f"{safe_title}.txt"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported format '{format}'. Use docx, pdf, md, or txt.")

    return Response(
        content=buf.getvalue(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/all/{format}")
async def export_all_metadata(
    format: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    contents = await ContentService.get_contents(current_user.organization_id, db)
    fmt = format.lower().strip()

    if fmt == "csv":
        buf = ExportService.export_csv(contents)
        media_type = "text/csv"
        filename = "content_library.csv"
    elif fmt in ("excel", "xlsx"):
        buf = ExportService.export_excel(contents)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "content_library.xlsx"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use csv or excel.")

    return Response(
        content=buf.getvalue(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

