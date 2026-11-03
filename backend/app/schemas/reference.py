from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    brand_id: Optional[str] = None

class CollectionResponse(BaseModel):
    id: str
    organization_id: str
    brand_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    reference_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IngestUrlRequest(BaseModel):
    collection_id: str
    url: str
    title: Optional[str] = None

class ManualTextInput(BaseModel):
    collection_id: str
    title: str
    text: str

class ReferenceAnalysisResponse(BaseModel):
    id: str
    document_id: str
    main_subject: str
    key_themes: List[str] = []
    main_arguments: List[str] = []
    important_facts: List[str] = []
    important_entities: List[str] = []
    industry_terminology: List[str] = []
    primary_keywords: List[str] = []
    secondary_keywords: List[str] = []
    search_intent: Optional[str] = None
    target_audience: Optional[str] = None
    writing_tone: Optional[str] = None
    content_structure: List[str] = []
    recurring_topics: List[str] = []
    knowledge_gaps: List[str] = []
    content_opportunities: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    collection_id: str
    organization_id: str
    filename: str
    file_type: str
    source_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    word_count: int
    chunk_count: int
    analysis: Optional[ReferenceAnalysisResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

