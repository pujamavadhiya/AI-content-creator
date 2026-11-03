from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CalendarCreate(BaseModel):
    content_id: str
    scheduled_date: datetime
    platform: str
    notes: Optional[str] = None

class CalendarUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CalendarResponse(BaseModel):
    id: str
    organization_id: str
    content_id: str
    scheduled_date: datetime
    platform: str
    status: str
    notes: Optional[str] = None
    content_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

