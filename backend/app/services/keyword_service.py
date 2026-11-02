from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.research import Keyword
from app.models.brand import Brand
from app.schemas.research import KeywordGenerateRequest
from app.ai.providers.factory import get_ai_provider
from app.ai.prompts.keyword_generation import get_keyword_generation_prompt
from app.ai.rag.retriever import retrieve_context
from app.models.analytics import ActivityLog, UsageLog

class KeywordService:
    @staticmethod
    async def generate_keywords(
        data: KeywordGenerateRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> List[Keyword]:
        ai_provider = await get_ai_provider(org_id=org_id, db=db)

        brand_voice = None
        industry = data.industry
        target_audience = data.target_audience

        if data.brand_id:
            b_stmt = select(Brand).where(Brand.id == data.brand_id, Brand.organization_id == org_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice
                industry = industry or brand.industry
                target_audience = target_audience or brand.target_audience

        # RAG Context
        rag_res = await retrieve_context(
            query=f"{data.topic} keywords {industry or ''}",
            org_id=org_id,
            collection_id=data.collection_id,
            ai_provider=ai_provider,
            top_k=4
        )
        ref_context = rag_res["context_text"] if rag_res["has_context"] else None

        prompt = get_keyword_generation_prompt(
            topic=data.topic,
            industry=industry,
            target_audience=target_audience,
            location=data.location,
            brand_voice=brand_voice,
            reference_context=ref_context
        )

        keyword_list = await ai_provider.generate_structured(prompt)

        saved_keywords: List[Keyword] = []
        for item in keyword_list:
            if not isinstance(item, dict) or not item.get("keyword"):
                continue
            kw = Keyword(
                organization_id=org_id,
                brand_id=data.brand_id,
                collection_id=data.collection_id,
                keyword=item.get("keyword", "").strip(),
                category=item.get("category", "primary"),
                search_intent=item.get("search_intent", "informational"),
                relevance_score=float(item.get("relevance_score", 0.9)),
                related_topic=item.get("related_topic"),
                suggested_content_type=item.get("suggested_content_type"),
                supporting_reference=item.get("supporting_reference", "General Context"),
                search_volume="Unavailable",
                difficulty="Unavailable"
            )
            db.add(kw)
            saved_keywords.append(kw)

        db.add(ActivityLog(
            organization_id=org_id,
            user_id=user_id,
            action="generated_keywords",
            entity_type="keyword",
            details={"topic": data.topic, "count": len(saved_keywords)}
        ))

        db.add(UsageLog(
            organization_id=org_id,
            user_id=user_id,
            provider="gemini",
            model="gemini-2.0-flash",
            task_type="keywords",
            input_tokens=1200,
            output_tokens=800,
            estimated_cost=0.001
        ))

        await db.commit()
        return saved_keywords

    @staticmethod
    async def get_keywords(org_id: str, db: AsyncSession, brand_id: str = None) -> List[Keyword]:
        stmt = select(Keyword).where(Keyword.organization_id == org_id)
        if brand_id:
            stmt = stmt.where(Keyword.brand_id == brand_id)
        stmt = stmt.order_by(Keyword.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())
