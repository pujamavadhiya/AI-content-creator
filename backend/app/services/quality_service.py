from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.content import GeneratedContent, ContentEvaluation, ContentVersion
from app.models.brand import Brand
from app.ai.providers.factory import get_ai_provider
from app.ai.prompts.content_evaluation import get_content_evaluation_prompt, get_content_improvement_prompt
from app.ai.rag.retriever import retrieve_context
from app.models.analytics import ActivityLog, UsageLog

class QualityService:
    @staticmethod
    async def evaluate_content(
        content_id: str,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> ContentEvaluation:
        stmt = select(GeneratedContent).where(GeneratedContent.id == content_id, GeneratedContent.organization_id == org_id)
        res = await db.execute(stmt)
        content = res.scalar_one_or_none()
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        ai_provider = await get_ai_provider(org_id=org_id, db=db)

        brand_voice = "Professional & Authoritative"
        if content.brand_id:
            b_stmt = select(Brand).where(Brand.id == content.brand_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice

        # RAG context for fact-checking
        rag_res = await retrieve_context(
            query=content.title,
            org_id=org_id,
            collection_id=None,
            ai_provider=ai_provider,
            top_k=4
        )
        ref_context = rag_res["context_text"] if rag_res["has_context"] else None

        prompt = get_content_evaluation_prompt(
            content_text=content.body[:15000],
            platform=content.platform,
            brand_voice=brand_voice,
            reference_context=ref_context
        )

        eval_data = await ai_provider.generate_structured(prompt)

        evaluation = ContentEvaluation(
            content_id=content.id,
            overall_score=float(eval_data.get("overall_score", 85.0)),
            dimension_scores=eval_data.get("dimension_scores", {}),
            issues_identified=eval_data.get("issues_identified", []),
            suggested_improvements=eval_data.get("suggested_improvements", []),
            unsupported_claims=eval_data.get("unsupported_claims", []),
            missing_information=eval_data.get("missing_information", [])
        )
        db.add(evaluation)

        db.add(ActivityLog(
            organization_id=org_id,
            user_id=user_id,
            action="evaluated_content",
            entity_type="content_evaluation",
            entity_id=content.id,
            details={"score": evaluation.overall_score}
        ))

        db.add(UsageLog(
            organization_id=org_id,
            user_id=user_id,
            provider="gemini",
            model="gemini-2.0-flash",
            task_type="quality_eval",
            input_tokens=2000,
            output_tokens=600,
            estimated_cost=0.001
        ))

        await db.commit()
        await db.refresh(evaluation)
        return evaluation

    @staticmethod
    async def improve_content_from_report(
        content_id: str,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> GeneratedContent:
        """
        'Improve Content Based on Quality Report'
        Fetches latest evaluation issues & applies direct AI editorial correction.
        """
        c_stmt = select(GeneratedContent).where(GeneratedContent.id == content_id, GeneratedContent.organization_id == org_id)
        c_res = await db.execute(c_stmt)
        content = c_res.scalar_one_or_none()
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        eval_stmt = select(ContentEvaluation).where(ContentEvaluation.content_id == content.id).order_by(ContentEvaluation.created_at.desc())
        eval_res = await db.execute(eval_stmt)
        latest_eval = eval_res.scalar_one_or_none()
        if not latest_eval:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No evaluation found for this content. Run quality audit first.")

        ai_provider = await get_ai_provider(org_id=org_id, db=db)

        brand_voice = "Authoritative & Objective"
        if content.brand_id:
            b_stmt = select(Brand).where(Brand.id == content.brand_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice

        prompt = get_content_improvement_prompt(
            current_content=content.body,
            evaluation_issues=latest_eval.issues_identified,
            evaluation_improvements=latest_eval.suggested_improvements,
            unsupported_claims=latest_eval.unsupported_claims,
            brand_voice=brand_voice
        )

        improved_body = await ai_provider.generate_text(prompt, temperature=0.5, max_tokens=4096)
        
        # Save new version
        v_stmt = select(ContentVersion).where(ContentVersion.content_id == content.id).order_by(ContentVersion.version_number.desc()).limit(1)
        v_res = await db.execute(v_stmt)
        latest_v = v_res.scalars().first()
        next_num = (latest_v.version_number + 1) if latest_v else 2

        new_version = ContentVersion(
            content_id=content.id,
            version_number=next_num,
            title=content.title,
            body=improved_body,
            change_summary="Enhanced automatically via 12-Factor Quality Audit",
            created_by=user_id
        )
        db.add(new_version)

        content.body = improved_body
        content.word_count = len(improved_body.split())
        content.character_count = len(improved_body)

        await db.commit()
        await db.refresh(content)
        return content

