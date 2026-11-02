from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BrandGuidelineSchema(BaseModel):
    restricted_words: List[str] = []
    preferred_keywords: List[str] = []
    competitors: List[str] = []
    products_services: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class BrandCreate(BaseModel):
    name: str
    company_name: Optional[str] = None
    industry: str
    business_description: Optional[str] = None
    website_url: Optional[str] = None
    target_audience: Optional[str] = None
    target_geographical_market: Optional[str] = None
    preferred_language: str = "English"
    brand_voice: str = "Professional & Insightful"
    writing_tone: str = "Professional"
    communication_style: str = "Clear & Authoritative"
    content_objectives: Optional[str] = None
    preferred_cta_style: str = "Learn more with us"
    custom_instructions: Optional[str] = None
    guidelines: Optional[BrandGuidelineSchema] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    business_description: Optional[str] = None
    website_url: Optional[str] = None
    target_audience: Optional[str] = None
    target_geographical_market: Optional[str] = None
    preferred_language: Optional[str] = None
    brand_voice: Optional[str] = None
    writing_tone: Optional[str] = None
    communication_style: Optional[str] = None
    content_objectives: Optional[str] = None
    preferred_cta_style: Optional[str] = None
    custom_instructions: Optional[str] = None
    guidelines: Optional[BrandGuidelineSchema] = None

class BrandResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    company_name: Optional[str] = None
    industry: str
    business_description: Optional[str] = None
    website_url: Optional[str] = None
    target_audience: Optional[str] = None
    target_geographical_market: Optional[str] = None
    preferred_language: str
    brand_voice: str
    writing_tone: str
    communication_style: str
    content_objectives: Optional[str] = None
    preferred_cta_style: str
    custom_instructions: Optional[str] = None
    guidelines: Optional[BrandGuidelineSchema] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
