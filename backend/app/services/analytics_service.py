from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.reference import ReferenceDocument, ReferenceCollection
from app.models.content import GeneratedContent, ContentCalendar
from app.models.research import Keyword, Topic
from app.models.analytics import UsageLog, ActivityLog
from app.schemas.analytics import AnalyticsSummaryResponse, PlatformUsageItem, RecentActivityItem

class AnalyticsService:
    @staticmethod
    async def get_summary(org_id: str, db: AsyncSession) -> AnalyticsSummaryResponse:
        # 1. Total references
        ref_count_stmt = select(func.count(ReferenceDocument.id)).where(ReferenceDocument.organization_id == org_id)
        ref_count = (await db.execute(ref_count_stmt)).scalar() or 0

        # 2. Total collections
        col_count_stmt = select(func.count(ReferenceCollection.id)).where(ReferenceCollection.organization_id == org_id)
        col_count = (await db.execute(col_count_stmt)).scalar() or 0

        # 3. Blogs & Social
        blog_count_stmt = select(func.count(GeneratedContent.id)).where(GeneratedContent.organization_id == org_id, GeneratedContent.content_type == "blog")
        blog_count = (await db.execute(blog_count_stmt)).scalar() or 0

        social_count_stmt = select(func.count(GeneratedContent.id)).where(GeneratedContent.organization_id == org_id, GeneratedContent.content_type != "blog")
        social_count = (await db.execute(social_count_stmt)).scalar() or 0

        # 4. Keywords & Topics
        kw_count_stmt = select(func.count(Keyword.id)).where(Keyword.organization_id == org_id)
        kw_count = (await db.execute(kw_count_stmt)).scalar() or 0

        tp_count_stmt = select(func.count(Topic.id)).where(Topic.organization_id == org_id)
        tp_count = (await db.execute(tp_count_stmt)).scalar() or 0

        # 5. Calendar Scheduled
        cal_count_stmt = select(func.count(ContentCalendar.id)).where(ContentCalendar.organization_id == org_id)
        cal_count = (await db.execute(cal_count_stmt)).scalar() or 0

        # 6. Usage Logs
        usage_stmt = select(
            func.sum(UsageLog.input_tokens),
            func.sum(UsageLog.output_tokens),
            func.sum(UsageLog.estimated_cost)
        ).where(UsageLog.organization_id == org_id)
        usage_res = (await db.execute(usage_stmt)).one()
        in_tokens = usage_res[0] or 0
        out_tokens = usage_res[1] or 0
        cost = round(float(usage_res[2] or 0.0), 4)

        # 7. Platform distribution
        plat_stmt = select(
            GeneratedContent.platform,
            func.count(GeneratedContent.id)
        ).where(GeneratedContent.organization_id == org_id).group_by(GeneratedContent.platform)
        plat_rows = (await db.execute(plat_stmt)).all()
        platform_breakdown = [PlatformUsageItem(platform=r[0], count=r[1]) for r in plat_rows]

        # 8. Recent Activities
        act_stmt = select(ActivityLog).where(ActivityLog.organization_id == org_id).order_by(ActivityLog.created_at.desc()).limit(8)
        act_rows = (await db.execute(act_stmt)).scalars().all()
        recent_activities = [
            RecentActivityItem(
                id=a.id,
                action=a.action,
                entity_type=a.entity_type,
                entity_id=a.entity_id,
                created_at=a.created_at.strftime("%Y-%m-%d %H:%M")
            )
            for a in act_rows
        ]

        return AnalyticsSummaryResponse(
            total_references=ref_count,
            total_collections=col_count,
            total_blogs=blog_count,
            total_social_posts=social_count,
            total_keywords=kw_count,
            total_topics=tp_count,
            total_calendar_scheduled=cal_count,
            estimated_api_cost=cost,
            total_input_tokens=in_tokens,
            total_output_tokens=out_tokens,
            platform_breakdown=platform_breakdown,
            recent_activities=recent_activities
        )

