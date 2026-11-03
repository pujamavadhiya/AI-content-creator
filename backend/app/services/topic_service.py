import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.research import Topic, TopicCluster
from app.models.brand import Brand
from app.schemas.research import TopicGenerateRequest
from app.ai.providers.factory import get_ai_provider
from app.ai.prompts.topic_generation import get_topic_generation_prompt, get_topic_clustering_prompt
from app.ai.rag.retriever import retrieve_context
from app.models.analytics import ActivityLog, UsageLog

class TopicService:
    @staticmethod
    async def generate_topics(
        data: TopicGenerateRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> List[Topic]:
        ai_provider = await get_ai_provider(org_id=org_id, db=db)

        brand_voice = None
        industry = data.industry
        target_audience = data.target_audience
        content_objective = data.content_objective

        if data.brand_id:
            b_stmt = select(Brand).where(Brand.id == data.brand_id, Brand.organization_id == org_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice
                industry = industry or brand.industry
                target_audience = target_audience or brand.target_audience
                content_objective = content_objective or brand.content_objectives

        # RAG Context
        rag_res = await retrieve_context(
            query=f"{data.primary_keyword} content strategy ideas",
            org_id=org_id,
            collection_id=data.collection_id,
            ai_provider=ai_provider,
            top_k=4
        )
        ref_context = rag_res["context_text"] if rag_res["has_context"] else None

        prompt = get_topic_generation_prompt(
            primary_keyword=data.primary_keyword,
            secondary_keywords=data.secondary_keywords,
            industry=industry,
            target_audience=target_audience,
            content_objective=content_objective,
            brand_voice=brand_voice,
            reference_context=ref_context
        )

        topic_list = await ai_provider.generate_structured(prompt)

        saved_topics: List[Topic] = []
        for item in topic_list:
            if not isinstance(item, dict) or not item.get("title"):
                continue
            topic = Topic(
                organization_id=org_id,
                brand_id=data.brand_id,
                collection_id=data.collection_id,
                title=item.get("title", "").strip(),
                description=item.get("description"),
                primary_keyword=item.get("primary_keyword", data.primary_keyword),
                secondary_keywords=item.get("secondary_keywords", data.secondary_keywords),
                search_intent=item.get("search_intent", "Informational"),
                target_audience=item.get("target_audience", target_audience),
                content_angle=item.get("content_angle"),
                content_format=item.get("content_format", "How-to Guide"),
                suggested_cta=item.get("suggested_cta"),
                relevance_score=float(item.get("relevance_score", 0.95)),
                supporting_reference_info=item.get("supporting_reference_info", "Context Grounded"),
                recommended_platform=item.get("recommended_platform", "Blog"),
                status="suggested"
            )
            db.add(topic)
            saved_topics.append(topic)

        db.add(ActivityLog(
            organization_id=org_id,
            user_id=user_id,
            action="generated_topics",
            entity_type="topic",
            details={"primary_keyword": data.primary_keyword, "count": len(saved_topics)}
        ))

        db.add(UsageLog(
            organization_id=org_id,
            user_id=user_id,
            provider="gemini",
            model="gemini-2.0-flash",
            task_type="topics",
            input_tokens=1500,
            output_tokens=1200,
            estimated_cost=0.0015
        ))

        await db.commit()
        return saved_topics

    @staticmethod
    async def cluster_topics(org_id: str, db: AsyncSession) -> List[TopicCluster]:
        stmt = select(Topic).where(Topic.organization_id == org_id).order_by(Topic.created_at.desc()).limit(20)
        res = await db.execute(stmt)
        topics = list(res.scalars().all())

        if len(topics) < 2:
            return []

        ai_provider = await get_ai_provider(org_id=org_id, db=db)
        topics_payload = [{"id": t.id, "title": t.title, "keyword": t.primary_keyword, "format": t.content_format} for t in topics]
        
        prompt = get_topic_clustering_prompt(json.dumps(topics_payload, indent=2))
        clusters_data = await ai_provider.generate_structured(prompt)

        cluster_records: List[TopicCluster] = []
        for c in clusters_data:
            if not isinstance(c, dict):
                continue
            
            # Find pillar topic
            pillar_title = c.get("pillar_topic_title", "")
            pillar_id = topics[0].id
            for t in topics:
                if t.title.lower() in pillar_title.lower() or pillar_title.lower() in t.title.lower():
                    pillar_id = t.id
                    break

            # Find supporting topic ids
            sup_ids = []
            for sup_title in c.get("supporting_topic_titles", []):
                for t in topics:
                    if t.title.lower() in sup_title.lower() or sup_title.lower() in t.title.lower():
                        sup_ids.append(t.id)
                        break

            cl = TopicCluster(
                organization_id=org_id,
                pillar_topic_id=pillar_id,
                cluster_name=c.get("cluster_name", "Content Pillar Cluster"),
                supporting_topic_ids=sup_ids,
                related_keywords=c.get("related_keywords", []),
                internal_linking_strategy=c.get("internal_linking_strategy", "")
            )
            db.add(cl)
            cluster_records.append(cl)

        await db.commit()
        return cluster_records

    @staticmethod
    async def get_topics(org_id: str, db: AsyncSession, brand_id: Optional[str] = None) -> List[Topic]:
        stmt = select(Topic).where(Topic.organization_id == org_id)
        if brand_id:
            stmt = stmt.where(Topic.brand_id == brand_id)
        stmt = stmt.order_by(Topic.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

