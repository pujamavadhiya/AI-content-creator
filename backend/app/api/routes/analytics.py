from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auth import User
from app.core.dependencies import get_current_user
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Usage & Analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_summary(current_user.organization_id, db)
