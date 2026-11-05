from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.auth import User
from app.ai.skills.skill_registry import skill_registry
from app.services.router_service import router_service
from app.services.pipeline_service import pipeline_service
from app.services.image_service import image_service
from app.services.paraphrase_service import paraphrase_service
from app.ai.skills.human_tone import sanitize_ai_symbols

router = APIRouter(prefix="/api/pipeline", tags=["Skill Pipeline & Orchestrator"])

# --- Request / Response Schemas ---

class RouteRequest(BaseModel):
    request: str = Field(..., description="User prompt or content instruction in natural language")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Project parameters like keywords, audience, word_count")
    provider: Optional[str] = Field(None, description="Preferred AI provider ('gemini' or 'openai')")

class ExecutePipelineRequest(BaseModel):
    request: str = Field(..., description="User prompt or instruction")
    steps: List[str] = Field(..., description="Ordered list of skill names/aliases to execute")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Project context parameters")
    brand_id: Optional[str] = Field(None, description="Optional brand profile ID to inject voice guidelines")
    provider: Optional[str] = Field(None, description="Preferred AI provider ('gemini' or 'openai')")
    compulsory_keywords: Optional[str] = Field(None, description="Compulsory keywords (one per line or comma-separated)")

class ExecuteStepRequest(BaseModel):
    skill: str = Field(..., description="Skill alias or canonical name (e.g. 'draft', 'fact_check', 'qa')")
    request: str = Field(..., description="Prompt or instructions for this specific step")
    inputs: Optional[str] = Field(None, description="Inputs or prior step output")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    brand_id: Optional[str] = None
    provider: Optional[str] = None

class GenerateOutlineRequest(BaseModel):
    request: str = Field(..., description="Topic or prompt for the content outline")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    brand_id: Optional[str] = None
    provider: Optional[str] = None
    compulsory_keywords: Optional[str] = Field(None, description="Compulsory keywords (one per line or comma-separated)")

class GenerateDraftRequest(BaseModel):
    request: str = Field(..., description="Topic or prompt for the draft")
    outline: str = Field(..., description="User-reviewed or edited content outline to expand")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    brand_id: Optional[str] = None
    provider: Optional[str] = None
    compulsory_keywords: Optional[str] = Field(None, description="Compulsory keywords (one per line or comma-separated)")

class ExpandFullBlogRequest(BaseModel):
    request: str = Field(..., description="Topic or prompt for the full blog")
    draft: Optional[str] = Field(None, description="Initial draft or brief to expand")
    mode: Optional[str] = Field("blog", description="Format mode: 'blog' for engaging web post or 'article' for authoritative thought leadership")
    project_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    brand_id: Optional[str] = None
    provider: Optional[str] = None
    compulsory_keywords: Optional[str] = Field(None, description="Compulsory keywords (one per line or comma-separated)")

class GenerateImageRequest(BaseModel):
    blog_title: str = Field(..., description="Title of the blog to generate a relatable image for")
    blog_body: Optional[str] = Field("", description="Full text or summary of the blog")
    custom_prompt: Optional[str] = Field(None, description="Optional specific image prompt")
    visual_style: Optional[str] = Field("modern minimalist 3d isometric editorial illustration", description="Visual style")
    openai_api_key: Optional[str] = Field(None, description="Optional OpenAI API key")

class AttachImageRequest(BaseModel):
    markdown_text: str = Field(..., description="Blog markdown text")
    image_url: str = Field(..., description="Image URL to embed")
    alt_text: Optional[str] = Field("Featured Blog Illustration", description="Alt text")


# --- Endpoints ---

@router.get("/skills")
async def list_available_skills(
    current_user: User = Depends(get_current_user),
):
    """
    List all 20 registered skills with descriptions, output contracts, and metadata.
    """
    return {
        "skills": skill_registry.list_skills(),
        "total": len(skill_registry.list_skills()),
    }

@router.post("/route")
async def route_user_request(
    body: RouteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Orchestrator Router:
    Uses a fast AI model call to classify user intent and formulate an optimal sequential pipeline.
    """
    if not body.request.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request prompt cannot be empty."
        )

    try:
        plan = await router_service.route_request(
            request=body.request,
            project_context=body.project_context,
            provider_slug=body.provider,
        )
        return plan
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Router failed: {str(e)}"
        )

@router.post("/execute")
async def execute_content_pipeline(
    body: ExecutePipelineRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute chained skill pipeline step-by-step with real search grounding,
    context forward passing, and QA evaluation.
    """
    if not body.steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify at least one skill step in pipeline."
        )

    try:
        ctx = body.project_context.copy() if body.project_context else {}
        if body.compulsory_keywords:
            ctx["compulsory_keywords"] = body.compulsory_keywords

        result = await pipeline_service.execute_pipeline(
            request=body.request,
            steps=body.steps,
            project_context=ctx,
            brand_id=body.brand_id,
            org_id=current_user.organization_id if current_user else None,
            provider_slug=body.provider,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution error: {str(e)}"
        )

@router.post("/execute-step")
async def execute_single_skill_step(
    body: ExecuteStepRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a single discrete modular skill with inputs.
    """
    try:
        result = await pipeline_service.execute_single_step(
            skill_name_or_alias=body.skill,
            request=body.request,
            inputs=body.inputs,
            project_context=body.project_context,
            provider_slug=body.provider,
            org_id=current_user.organization_id if current_user else None,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Step execution error: {str(e)}"
        )

@router.post("/generate-outline")
async def generate_pipeline_outline(
    body: GenerateOutlineRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 1: Generate a comprehensive, reviewable content outline strictly based
    on keywords (primary + compulsory) and user instructions.
    """
    try:
        ctx = body.project_context.copy() if body.project_context else {}
        if body.compulsory_keywords:
            ctx["compulsory_keywords"] = body.compulsory_keywords

        result = await pipeline_service.generate_pipeline_outline(
            request=body.request,
            project_context=ctx,
            brand_id=body.brand_id,
            org_id=current_user.organization_id if current_user else None,
            provider_slug=body.provider,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Outline generation failed: {str(e)}"
        )

@router.post("/generate-draft")
async def generate_pipeline_draft(
    body: GenerateDraftRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 2: Generate an authentic, human-toned initial draft from the
    user-reviewed/edited outline and compulsory keywords.
    """
    try:
        ctx = body.project_context.copy() if body.project_context else {}
        if body.compulsory_keywords:
            ctx["compulsory_keywords"] = body.compulsory_keywords

        result = await pipeline_service.generate_pipeline_draft(
            request=body.request,
            outline=body.outline,
            project_context=ctx,
            brand_id=body.brand_id,
            org_id=current_user.organization_id if current_user else None,
            provider_slug=body.provider,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Draft generation failed: {str(e)}"
        )

@router.post("/generate-full-blog")
async def generate_full_blog(
    body: ExpandFullBlogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Expand draft or topic into a comprehensive full-length production blog (1500-2500 words)
    using all research, drafting, fact-checking, and QA skills.
    """
    try:
        ctx = body.project_context.copy() if body.project_context else {}
        if body.compulsory_keywords:
            ctx["compulsory_keywords"] = body.compulsory_keywords

        result = await pipeline_service.expand_draft_to_full_blog(
            draft=body.draft or "",
            topic_or_request=body.request,
            mode=body.mode or "blog",
            project_context=ctx,
            brand_id=body.brand_id,
            org_id=current_user.organization_id if current_user else None,
            provider_slug=body.provider,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Full blog generation failed: {str(e)}"
        )

@router.post("/generate-image")
async def generate_blog_image(
    body: GenerateImageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Optional: Generate a relatable featured image for the blog using OpenAI DALL-E 3.
    Requires OpenAI API key in .env or supplied in request body.
    """
    result = await image_service.generate_image(
        blog_title=body.blog_title,
        blog_body=body.blog_body or "",
        custom_prompt=body.custom_prompt,
        visual_style=body.visual_style,
        openai_api_key=body.openai_api_key,
    )
    if not result.get("success") and result.get("requires_key"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    return result

@router.post("/attach-image")
async def attach_image_to_blog(
    body: AttachImageRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Attach and embed generated image into blog markdown directly beneath the H1 title.
    """
    updated_markdown = image_service.attach_image_to_markdown(
        markdown_text=body.markdown_text,
        image_url=body.image_url,
        alt_text=body.alt_text or "Featured Blog Image"
    )
    return {
        "success": True,
        "updated_markdown": updated_markdown
    }

class PipelineParaphraseRequest(BaseModel):
    text: str
    mode: str = "anti_plagiarism"
    target_tone: Optional[str] = None
    brand_id: Optional[str] = None
    provider: Optional[str] = None

@router.post("/paraphrase-humanize")
async def pipeline_paraphrase_humanize(
    body: PipelineParaphraseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    On-demand anti-plagiarism paraphrasing and humanization for pipeline content.
    Removes table pipe grids (|---|) and elevates burstiness.
    """
    return await paraphrase_service.paraphrase_and_humanize(
        text=body.text,
        mode=body.mode,
        target_tone=body.target_tone,
        brand_id=body.brand_id,
        org_id=current_user.organization_id if current_user else None,
        provider_slug=body.provider,
        db=db,
    )

@router.post("/sanitize-symbols")
async def pipeline_sanitize_symbols(
    body: Dict[str, str],
    current_user: User = Depends(get_current_user),
):
    """
    Sanitize and eliminate synthetic AI table pipe grids (|---|) and stray separator symbols.
    """
    text = body.get("text", "")
    cleaned, count = sanitize_ai_symbols(text)
    return {
        "cleaned_text": cleaned,
        "symbols_cleaned": count,
        "success": True
    }

@router.post("/replace-banned-words")
async def pipeline_replace_banned_words(
    body: Dict[str, str],
    current_user: User = Depends(get_current_user),
):
    """
    Instant 1-click replacement of all detected banned words and AI tells
    with natural WordNet synonyms and conversational phrasing in the pipeline.
    """
    text = body.get("text", "")
    compulsory_keywords = body.get("compulsory_keywords")
    return paraphrase_service.replace_banned_words(text, compulsory_keywords)


