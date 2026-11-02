from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.research import ContentOutline, Topic
from app.models.brand import Brand
from app.schemas.research import OutlineGenerateRequest, OutlineUpdateRequest
from app.ai.providers.factory import get_ai_provider
from app.ai.prompts.outline_generation import get_outline_generation_prompt
from app.ai.rag.retriever import retrieve_context
from app.models.analytics import ActivityLog, UsageLog

class OutlineService:
    @staticmethod
    async def generate_outline(
        data: OutlineGenerateRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> ContentOutline:
        # Load topic
        t_stmt = select(Topic).where(Topic.id == data.topic_id, Topic.organization_id == org_id)
        t_res = await db.execute(t_stmt)
        topic = t_res.scalar_one_or_none()
        if not topic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected topic not found")

        ai_provider = await get_ai_provider(org_id=org_id, db=db)

        brand_voice = None
        brand_id = data.brand_id or topic.brand_id
        if brand_id:
            b_stmt = select(Brand).where(Brand.id == brand_id, Brand.organization_id == org_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice

        # RAG Context
        col_id = data.collection_id or topic.collection_id
        rag_res = await retrieve_context(
            query=f"{topic.title} {topic.primary_keyword} outline points",
            org_id=org_id,
            collection_id=col_id,
            ai_provider=ai_provider,
            top_k=5
        )
        ref_context = rag_res["context_text"] if rag_res["has_context"] else None

        prompt = get_outline_generation_prompt(
            topic_title=topic.title,
            primary_keyword=topic.primary_keyword,
            secondary_keywords=topic.secondary_keywords,
            search_intent=topic.search_intent,
            target_audience=topic.target_audience,
            content_format=topic.content_format,
            brand_voice=brand_voice,
            reference_context=ref_context,
            custom_notes=data.custom_notes
        )

        outline_data = await ai_provider.generate_structured(prompt)

        outline = ContentOutline(
            organization_id=org_id,
            topic_id=topic.id,
            brand_id=brand_id,
            title=outline_data.get("title", topic.title),
            seo_title_suggestions=outline_data.get("seo_title_suggestions", []),
            primary_keyword=outline_data.get("primary_keyword", topic.primary_keyword),
            secondary_keywords=outline_data.get("secondary_keywords", topic.secondary_keywords),
            search_intent=outline_data.get("search_intent", topic.search_intent),
            target_audience=outline_data.get("target_audience", topic.target_audience),
            content_objective=outline_data.get("content_objective"),
            meta_title=outline_data.get("meta_title"),
            meta_description=outline_data.get("meta_description"),
            url_slug_suggestion=outline_data.get("url_slug_suggestion"),
            introduction_structure=outline_data.get("introduction_structure"),
            h1_heading=outline_data.get("h1_heading", topic.title),
            headings_hierarchy=outline_data.get("headings_hierarchy", []),
            suggested_examples=outline_data.get("suggested_examples", []),
            faqs=outline_data.get("faqs", []),
            conclusion_structure=outline_data.get("conclusion_structure"),
            cta=outline_data.get("cta", topic.suggested_cta),
            internal_links_suggested=outline_data.get("internal_links_suggested", []),
            supporting_references=outline_data.get("supporting_references", []),
            status="approved"
        )
        db.add(outline)

        # Update topic status
        topic.status = "in_outline"

        db.add(ActivityLog(
            organization_id=org_id,
            user_id=user_id,
            action="generated_outline",
            entity_type="content_outline",
            entity_id=outline.id,
            details={"topic_title": topic.title}
        ))

        db.add(UsageLog(
            organization_id=org_id,
            user_id=user_id,
            provider="gemini",
            model="gemini-2.0-flash",
            task_type="outline",
            input_tokens=2000,
            output_tokens=1500,
            estimated_cost=0.002
        ))

        await db.commit()
        await db.refresh(outline)
        return outline

    @staticmethod
    async def update_outline(
        outline_id: str,
        data: OutlineUpdateRequest,
        org_id: str,
        db: AsyncSession
    ) -> ContentOutline:
        stmt = select(ContentOutline).where(ContentOutline.id == outline_id, ContentOutline.organization_id == org_id)
        res = await db.execute(stmt)
        outline = res.scalar_one_or_none()
        if not outline:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content outline not found")

        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            setattr(outline, k, v)

        await db.commit()
        await db.refresh(outline)
        return outline

    @staticmethod
    async def get_outlines(org_id: str, db: AsyncSession) -> List[ContentOutline]:
        stmt = select(ContentOutline).where(ContentOutline.organization_id == org_id).order_by(ContentOutline.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_outline(outline_id: str, org_id: str, db: AsyncSession) -> ContentOutline:
        stmt = select(ContentOutline).where(ContentOutline.id == outline_id, ContentOutline.organization_id == org_id)
        res = await db.execute(stmt)
        outline = res.scalar_one_or_none()
        if not outline:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content outline not found")
        return outline
