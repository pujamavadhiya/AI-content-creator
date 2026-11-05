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
    compulsory_keywords: Optional[str] = None  # Compulsory keywords (one per line or comma-separated)
    mandatory_keywords: Optional[List[str]] = None
    provider: Optional[str] = None

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
    provider: Optional[str] = None

class MultiPlatformGenerateRequest(BaseModel):
    brand_id: Optional[str] = None
    collection_id: Optional[str] = None
    topic_id: Optional[str] = None
    topic_title: str
    platforms: List[str] = ["blog", "linkedin", "instagram", "facebook", "twitter"]
    provider: Optional[str] = None

class RewriteRequest(BaseModel):
    content_id: Optional[str] = None
    selected_text: str
    action: str  # rewrite, grammar, professional, conversational, simplify, expand, shorten, add_examples, improve_intro, improve_conclusion, alt_headings, improve_seo, change_tone, translate, generate_cta, human_tone
    custom_instruction: Optional[str] = None
    tone: Optional[str] = None
    language: Optional[str] = None
    provider: Optional[str] = None

class HumanToneAuditRequest(BaseModel):
    text: str

class HumanToneAuditResponse(BaseModel):
    score: float
    passes_human_test: bool
    total_violations: int
    banned_words_found: List[str]
    banned_phrases_found: List[str]
    uncontracted_forms_found: List[str]
    table_symbols_detected: bool = False
    table_symbols_count: int = 0
    burstiness_score: float = 8.5
    burstiness_rating: str = "Good"
    cliche_opener_detected: bool
    summary_conclusion_detected: bool
    suggested_replacements: Dict[str, str]

class ParaphraseHumanizeRequest(BaseModel):
    text: str
    mode: str = "anti_plagiarism"  # anti_plagiarism, humanize_burstiness, deep_rewrite, sanitize_symbols
    target_tone: Optional[str] = None
    brand_id: Optional[str] = None
    provider: Optional[str] = None
    compulsory_keywords: Optional[str] = None

class ParaphraseHumanizeResponse(BaseModel):
    success: bool
    original_text: str
    paraphrased_text: str
    human_score: int
    human_content_estimate: int = 90
    passes_human_test: bool
    burstiness_score: float
    burstiness_rating: str
    plagiarism_risk: str
    table_symbols_cleaned: int
    banned_words_removed: List[str] = []
    wordnet_matches_count: Optional[int] = 0
    paws_grounded: bool = True
    wordnet_grounded: bool = True
    local_model_matched: Optional[bool] = True
    compulsory_keywords_audit: Optional[Dict[str, Any]] = None
    audit: Dict[str, Any] = {}
    duration_seconds: float
    error: Optional[str] = None

class SanitizeSymbolsRequest(BaseModel):
    text: str

class SanitizeSymbolsResponse(BaseModel):
    cleaned_text: str
    symbols_cleaned: int

class ReplaceBannedWordsRequest(BaseModel):
    text: str
    compulsory_keywords: Optional[str] = None

class ReplaceBannedWordsResponse(BaseModel):
    cleaned_text: str
    replaced_words: List[str]
    total_replaced: int
    audit: Dict[str, Any]
    success: bool = True

class UrlRewriteRequest(BaseModel):
    url: str
    primary_keyword: Optional[str] = None
    page_type: str = "blog"  # blog, service, landing
    author_name: str = "Ashok Rathod - Tech Consultant"
    provider: Optional[str] = None

class UrlRewriteResponse(BaseModel):
    url: str
    primary_keyword: str
    before_diagnosis: Dict[str, Any]
    whats_changing_and_why: List[str]
    replacement_content: Dict[str, Any]

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

class SocialChatRefineRequest(BaseModel):
    content_id: Optional[str] = None
    platform: str = "linkedin"
    current_content: str
    instruction: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    provider: Optional[str] = None
    brand_id: Optional[str] = None

class SocialChatRefineResponse(BaseModel):
    success: bool
    refined_content: str
    change_summary: str
    version_number: int
    content_id: Optional[str] = None
    previous_content: str
    platform: str
    word_count: int
    character_count: int

class RestoreVersionResponse(BaseModel):
    success: bool
    content_id: str
    restored_version_number: int
    new_version_number: int
    active_body: str
    active_title: str


