from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class KeywordGenerateRequest(BaseModel):
    topic: str
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    location: Optional[str] = None
    collection_id: Optional[str] = None
    brand_id: Optional[str] = None
    search_objective: Optional[str] = None

class MultiPlatformKeywordRequest(BaseModel):
    topic: str
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    business_type: str = "B2B"
    brand_id: Optional[str] = None

class MultiPlatformKeywordResponse(BaseModel):
    offering_name: str
    seed_keywords: List[str]
    platform_groups: Dict[str, List[Dict[str, Any]]]
    top_seed_keywords: List[str]
    top_platform_keywords: List[str]
    quick_wins: List[Dict[str, str]]
    keyword_planner_tip: str

class SerpGapRequest(BaseModel):
    keywords: List[str]
    niche: str
    content_type: str = "blog"
    intent_preference: str = "mixed"
    language: str = "English"

class SerpGapResponse(BaseModel):
    niche: str
    keywords: List[str]
    ai_overview_summary: str
    competitor_landscape: List[Dict[str, Any]]
    common_topics: List[Dict[str, Any]]
    unique_angles: List[Dict[str, Any]]
    content_gaps: List[Dict[str, Any]]
    vague_generic_content_to_replace: List[Dict[str, Any]]
    recommended_unique_additions: List[Dict[str, Any]]
    statistics: List[Dict[str, Any]]
    hard_numbers: List[Dict[str, Any]]
    people_also_ask: List[Dict[str, Any]]

class KeywordResponse(BaseModel):
    id: str
    keyword: str
    category: str
    search_intent: str
    relevance_score: float
    related_topic: Optional[str] = None
    suggested_content_type: Optional[str] = None
    supporting_reference: Optional[str] = None
    search_volume: str
    difficulty: str
    created_at: datetime

    class Config:
        from_attributes = True

class TopicGenerateRequest(BaseModel):
    collection_id: Optional[str] = None
    brand_id: Optional[str] = None
    industry: Optional[str] = None
    primary_keyword: str
    secondary_keywords: List[str] = []
    target_audience: Optional[str] = None
    content_objective: Optional[str] = None
    content_format: Optional[str] = None

class TopicResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    primary_keyword: str
    secondary_keywords: List[str] = []
    search_intent: str
    target_audience: Optional[str] = None
    content_angle: Optional[str] = None
    content_format: str
    suggested_cta: Optional[str] = None
    relevance_score: float
    supporting_reference_info: Optional[str] = None
    recommended_platform: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TopicClusterResponse(BaseModel):
    id: str
    cluster_name: str
    pillar_topic_id: str
    pillar_topic: Optional[TopicResponse] = None
    supporting_topics: List[TopicResponse] = []
    related_keywords: List[str] = []
    internal_linking_strategy: Optional[str] = None

    class Config:
        from_attributes = True

class HeadingNode(BaseModel):
    h2: str
    h3: List[str] = []
    points: List[str] = []

class FAQItem(BaseModel):
    q: str
    a_outline: str

class OutlineGenerateRequest(BaseModel):
    topic_id: str
    brand_id: Optional[str] = None
    collection_id: Optional[str] = None
    custom_notes: Optional[str] = None

class OutlineUpdateRequest(BaseModel):
    title: Optional[str] = None
    h1_heading: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    url_slug_suggestion: Optional[str] = None
    headings_hierarchy: Optional[List[HeadingNode]] = None
    faqs: Optional[List[FAQItem]] = None
    cta: Optional[str] = None
    status: Optional[str] = None

class OutlineResponse(BaseModel):
    id: str
    topic_id: Optional[str] = None
    brand_id: Optional[str] = None
    title: str
    seo_title_suggestions: List[str] = []
    primary_keyword: str
    secondary_keywords: List[str] = []
    search_intent: str
    target_audience: Optional[str] = None
    content_objective: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    url_slug_suggestion: Optional[str] = None
    introduction_structure: Optional[str] = None
    h1_heading: str
    headings_hierarchy: List[Dict[str, Any]] = []
    suggested_examples: List[str] = []
    faqs: List[Dict[str, Any]] = []
    conclusion_structure: Optional[str] = None
    cta: Optional[str] = None
    internal_links_suggested: List[str] = []
    supporting_references: List[str] = []
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

