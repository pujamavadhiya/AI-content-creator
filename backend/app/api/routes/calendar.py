from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auth import User
from app.core.dependencies import get_current_user, require_role
from app.schemas.calendar import CalendarCreate, CalendarUpdate, CalendarResponse
from app.services.calendar_service import CalendarService

router = APIRouter(prefix="/api/calendar", tags=["Content Calendar"])

@router.post("", response_model=CalendarResponse, status_code=status.HTTP_201_CREATED)
async def schedule_item(
    data: CalendarCreate,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    entry = await CalendarService.schedule_content(data, current_user.organization_id, db)
    return CalendarResponse.model_validate(entry)

@router.get("", response_model=List[CalendarResponse])
async def list_calendar_events(
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    events = await CalendarService.get_calendar_events(current_user.organization_id, db, platform=platform)
    return [CalendarResponse.model_validate(e) for e in events]

@router.put("/{event_id}", response_model=CalendarResponse)
async def update_calendar_event(
    event_id: str,
    data: CalendarUpdate,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    entry = await CalendarService.update_event(event_id, data, current_user.organization_id, db)
    return CalendarResponse.model_validate(entry)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(
    event_id: str,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    await CalendarService.delete_event(event_id, current_user.organization_id, db)
