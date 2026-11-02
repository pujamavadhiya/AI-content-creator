from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BlogGenerateRequest(BaseModel):
    brand_id: Optional[str] = None
    collection_id: Optional[str] = None
    topic_id: Optional[str] = None
    outline_id: Optional[str] = None
    topic_title: Optional[str] = None
    target_audience: Optional[str] = None
    writing_tone: str = "Professional"
    language: str = "English"
    desired_word_count: int = 1500
    seo_requirements: Optional[str] = None
    cta_style: Optional[str] = None

class SocialGenerateRequest(BaseModel):
    brand_id: Optional[str] = None
    collection_id: Optional[str] = None
    topic_id: Optional[str] = None
    topic_title: Optional[str] = None
    platform: str  # linkedin, instagram, facebook, twitter
    format_type: str  # e.g., thought_leadership, carousel, reels, thread, business_post
    tone: Optional[str] = "Conversational & Authoritative"
    slides_count: Optional[int] = 7  # for instagram carousel
    tweets_count: Optional[int] = 8  # for twitter thread

class MultiPlatformGenerateRequest(BaseModel):
    brand_id: Optional[str] = None
    collection_id: Optional[str] = None
    topic_id: Optional[str] = None
    topic_title: str
    platforms: List[str] = ["blog", "linkedin", "instagram", "facebook", "twitter"]

class RewriteRequest(BaseModel):
    content_id: Optional[str] = None
    selected_text: str
    action: str  # rewrite, grammar, professional, conversational, simplify, expand, shorten, add_examples, improve_intro, improve_conclusion, alt_headings, improve_seo, change_tone, translate, generate_cta
    custom_instruction: Optional[str] = None
    tone: Optional[str] = None
    language: Optional[str] = None

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    status: Optional[str] = None
    change_summary: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class ContentResponse(BaseModel):
    id: str
    organization_id: str
    brand_id: Optional[str] = None
    outline_id: Optional[str] = None
    title: str
    content_type: str
    platform: str
    body: str
    word_count: int
    character_count: int
    status: str
    is_archived: int
    metadata_json: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContentVersionResponse(BaseModel):
    id: str
    content_id: str
    version_number: int
    title: str
    body: str
    change_summary: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EvaluationResponse(BaseModel):
    id: str
    content_id: str
    overall_score: float
    dimension_scores: Dict[str, float] = {}
    issues_identified: List[str] = []
    suggested_improvements: List[str] = []
    unsupported_claims: List[str] = []
    missing_information: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
