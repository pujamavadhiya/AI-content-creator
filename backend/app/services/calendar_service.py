from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.content import ContentCalendar, GeneratedContent
from app.schemas.calendar import CalendarCreate, CalendarUpdate

class CalendarService:
    @staticmethod
    async def schedule_content(
        data: CalendarCreate,
        org_id: str,
        db: AsyncSession
    ) -> ContentCalendar:
        # Verify content exists and belongs to org
        c_stmt = select(GeneratedContent).where(GeneratedContent.id == data.content_id, GeneratedContent.organization_id == org_id)
        c_res = await db.execute(c_stmt)
        content = c_res.scalar_one_or_none()
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        cal_entry = ContentCalendar(
            organization_id=org_id,
            content_id=data.content_id,
            scheduled_date=data.scheduled_date,
            platform=data.platform,
            status="scheduled",
            notes=data.notes
        )
        db.add(cal_entry)
        
        # Update content status
        content.status = "scheduled"

        await db.commit()
        await db.refresh(cal_entry)
        return cal_entry

    @staticmethod
    async def get_calendar_events(
        org_id: str,
        db: AsyncSession,
        platform: Optional[str] = None
    ) -> List[dict]:
        stmt = select(ContentCalendar, GeneratedContent.title).join(
            GeneratedContent, ContentCalendar.content_id == GeneratedContent.id
        ).where(ContentCalendar.organization_id == org_id)

        if platform:
            stmt = stmt.where(ContentCalendar.platform == platform)

        stmt = stmt.order_by(ContentCalendar.scheduled_date.asc())
        res = await db.execute(stmt)
        
        events = []
        for row in res.all():
            cal = row[0]
            title = row[1]
            events.append({
                "id": cal.id,
                "organization_id": cal.organization_id,
                "content_id": cal.content_id,
                "content_title": title,
                "scheduled_date": cal.scheduled_date,
                "platform": cal.platform,
                "status": cal.status,
                "notes": cal.notes,
                "created_at": cal.created_at,
                "updated_at": cal.updated_at
            })
        return events

    @staticmethod
    async def update_event(
        event_id: str,
        data: CalendarUpdate,
        org_id: str,
        db: AsyncSession
    ) -> ContentCalendar:
        stmt = select(ContentCalendar).where(ContentCalendar.id == event_id, ContentCalendar.organization_id == org_id)
        res = await db.execute(stmt)
        entry = res.scalar_one_or_none()
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found")

        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            setattr(entry, k, v)

        await db.commit()
        await db.refresh(entry)
        return entry

    @staticmethod
    async def delete_event(event_id: str, org_id: str, db: AsyncSession):
        stmt = select(ContentCalendar).where(ContentCalendar.id == event_id, ContentCalendar.organization_id == org_id)
        res = await db.execute(stmt)
        entry = res.scalar_one_or_none()
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found")
        await db.delete(entry)
        await db.commit()

