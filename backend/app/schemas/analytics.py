from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class PlatformUsageItem(BaseModel):
    platform: str
    count: int

class RecentActivityItem(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    created_at: str
    user_name: Optional[str] = None

class AnalyticsSummaryResponse(BaseModel):
    total_references: int
    total_collections: int
    total_blogs: int
    total_social_posts: int
    total_keywords: int
    total_topics: int
    total_calendar_scheduled: int
    estimated_api_cost: float
    total_input_tokens: int
    total_output_tokens: int
    platform_breakdown: List[PlatformUsageItem] = []
    recent_activities: List[RecentActivityItem] = []
