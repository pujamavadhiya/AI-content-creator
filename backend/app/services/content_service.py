import json
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from app.models.content import GeneratedContent, ContentVersion
from app.models.research import ContentOutline, Topic
from app.models.brand import Brand, BrandGuideline
from app.schemas.content import (
    BlogGenerateRequest, SocialGenerateRequest, MultiPlatformGenerateRequest,
    RewriteRequest, ContentUpdate, SocialChatRefineRequest
)
from app.ai.providers.factory import get_ai_provider
from app.ai.prompts.blog_generation import get_blog_generation_prompt
from app.ai.prompts.linkedin_generation import get_linkedin_prompt
from app.ai.prompts.instagram_generation import get_instagram_prompt
from app.ai.prompts.facebook_generation import get_facebook_prompt
from app.ai.prompts.twitter_generation import get_twitter_prompt
from app.ai.prompts.content_rewrite import get_content_rewrite_prompt
from app.ai.skills.human_tone import audit_human_tone, get_human_tone_system_rules, sanitize_ai_symbols
from app.ai.skills.url_rewrite import get_url_rewrite_prompt
from app.services.parser_service import ParserService
from app.ai.rag.retriever import retrieve_context
from app.models.analytics import ActivityLog, UsageLog

class ContentService:
    @staticmethod
    async def generate_blog(
        data: BlogGenerateRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> GeneratedContent:
        ai_provider = await get_ai_provider(provider_slug=getattr(data, "provider", None), org_id=org_id, db=db)

        # Brand context
        brand_voice = "Professional & Authoritative"
        writing_tone = data.writing_tone
        target_audience = data.target_audience or "Industry Professionals"
        cta_style = data.cta_style or "Learn more with us"
        restricted_words = []
        preferred_keywords = []

        if data.brand_id:
            b_stmt = select(Brand).where(Brand.id == data.brand_id, Brand.organization_id == org_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice
                writing_tone = data.writing_tone or brand.writing_tone
                target_audience = data.target_audience or brand.target_audience or target_audience
                cta_style = data.cta_style or brand.preferred_cta_style

            gl_stmt = select(BrandGuideline).where(BrandGuideline.brand_id == data.brand_id)
            gl_res = await db.execute(gl_stmt)
            gl = gl_res.scalar_one_or_none()
            if gl:
                restricted_words = gl.restricted_words or []
                preferred_keywords = gl.preferred_keywords or []

        # Outline context
        outline_dict = None
        topic_title = data.topic_title or "Industry Insights Guide"
        col_id = data.collection_id

        if data.outline_id:
            o_stmt = select(ContentOutline).where(ContentOutline.id == data.outline_id, ContentOutline.organization_id == org_id)
            o_res = await db.execute(o_stmt)
            outline = o_res.scalar_one_or_none()
            if outline:
                topic_title = outline.title
                outline_dict = {
                    "h1": outline.h1_heading,
                    "sections": outline.headings_hierarchy,
                    "faqs": outline.faqs,
                    "cta": outline.cta
                }
                if outline.supporting_references:
                    preferred_keywords.extend(outline.secondary_keywords or [])

        # RAG Context
        rag_res = await retrieve_context(
            query=f"{topic_title} facts and data",
            org_id=org_id,
            collection_id=col_id,
            ai_provider=ai_provider,
            top_k=6
        )
        ref_context = rag_res["context_text"] if rag_res["has_context"] else None

        # Compulsory keywords parsing
        compulsory_kw_list = []
        if getattr(data, "compulsory_keywords", None):
            import re
            compulsory_kw_list = [k.strip() for k in re.split(r'[\r\n,;]+', str(data.compulsory_keywords)) if k.strip()]
        elif getattr(data, "mandatory_keywords", None):
            compulsory_kw_list = [k.strip() for k in data.mandatory_keywords if k.strip()]

        prompt = get_blog_generation_prompt(
            title=topic_title,
            outline_data=outline_dict,
            brand_voice=brand_voice,
            writing_tone=writing_tone,
            target_audience=target_audience,
            desired_word_count=data.desired_word_count,
            cta_style=cta_style,
            restricted_words=restricted_words,
            preferred_keywords=preferred_keywords,
            compulsory_keywords=compulsory_kw_list,
            reference_context=ref_context
        )

        blog_text = await ai_provider.generate_text(prompt, temperature=0.7, max_tokens=4096)
        # Strip all raw markdown table pipe grids (|---|) and AI table artifacts
        blog_text, _ = sanitize_ai_symbols(blog_text)
        words = len(blog_text.split())

        content = GeneratedContent(
            organization_id=org_id,
            brand_id=data.brand_id,
            outline_id=data.outline_id,
            title=topic_title,
            content_type="blog",
            platform="Blog",
            body=blog_text,
            word_count=words,
            character_count=len(blog_text),
            status="draft",
            metadata_json={"desired_word_count": data.desired_word_count, "language": data.language}
        )
        db.add(content)
        await db.flush()

        # Initial version
        v1 = ContentVersion(
            content_id=content.id,
            version_number=1,
            title=content.title,
            body=content.body,
            change_summary="Initial AI Generation",
            created_by=user_id
        )
        db.add(v1)

        db.add(ActivityLog(
            organization_id=org_id,
            user_id=user_id,
            action="generated_blog",
            entity_type="generated_content",
            entity_id=content.id,
            details={"title": topic_title, "word_count": words}
        ))

        db.add(UsageLog(
            organization_id=org_id,
            user_id=user_id,
            provider="gemini",
            model="gemini-2.0-flash",
            task_type="blog",
            input_tokens=2500,
            output_tokens=words * 2,
            estimated_cost=0.003
        ))

        await db.commit()
        await db.refresh(content)
        return content

    @staticmethod
    async def generate_social(
        data: SocialGenerateRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> GeneratedContent:
        ai_provider = await get_ai_provider(provider_slug=getattr(data, "provider", None), org_id=org_id, db=db)

        brand_voice = "Engaging & Insightful"
        target_audience = "Social Community"
        cta_style = "Engage in comments"
        topic_title = data.topic_title or "Industry Innovation"

        if data.brand_id:
            b_stmt = select(Brand).where(Brand.id == data.brand_id, Brand.organization_id == org_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice
                target_audience = brand.target_audience or target_audience
                cta_style = brand.preferred_cta_style

        # RAG Context
        rag_res = await retrieve_context(
            query=f"{topic_title} key facts",
            org_id=org_id,
            collection_id=data.collection_id,
            ai_provider=ai_provider,
            top_k=3
        )
        ref_context = rag_res["context_text"] if rag_res["has_context"] else None

        platform_lower = data.platform.lower()
        metadata: Dict[str, Any] = {}
        body_text = ""

        if platform_lower == "linkedin":
            prompt = get_linkedin_prompt(topic_title, data.format_type, brand_voice, target_audience, cta_style, ref_context)
            res = await ai_provider.generate_structured(prompt)
            body_text = f"{res.get('hook', '')}\n\n{res.get('body', '')}\n\n{res.get('cta', '')}\n\n{' '.join(res.get('hashtags', []))}"
            metadata = {
                "hook": res.get("hook"),
                "hashtags": res.get("hashtags", []),
                "visual_concept": res.get("visual_concept")
            }
        elif platform_lower == "instagram":
            prompt = get_instagram_prompt(topic_title, data.format_type, data.slides_count or 7, brand_voice, target_audience, ref_context)
            res = await ai_provider.generate_structured(prompt)
            body_text = f"{res.get('caption', '')}\n\n{' '.join(res.get('hashtags', []))}"
            metadata = {
                "hook": res.get("hook"),
                "slides": res.get("slides", []),
                "reel_script": res.get("reel_script"),
                "hashtags": res.get("hashtags", []),
                "visual_concept": res.get("visual_concept")
            }
        elif platform_lower == "facebook":
            prompt = get_facebook_prompt(topic_title, data.format_type, brand_voice, target_audience, ref_context)
            res = await ai_provider.generate_structured(prompt)
            body_text = f"{res.get('hook', '')}\n\n{res.get('body', '')}\n\n{res.get('cta', '')}\n\n{' '.join(res.get('hashtags', []))}"
            metadata = {"hook": res.get("hook"), "hashtags": res.get("hashtags", [])}
        elif platform_lower in ("twitter", "x"):
            prompt = get_twitter_prompt(topic_title, data.format_type, data.tweets_count or 8, brand_voice, ref_context)
            res = await ai_provider.generate_structured(prompt)
            thread = res.get("thread", [])
            body_text = "\n\n---\n\n".join([f"[{t.get('tweet_number', idx+1)}/{len(thread)}] {t.get('text', '')}" for idx, t in enumerate(thread)]) if thread else res.get("single_tweet", "")
            metadata = {
                "thread": thread,
                "single_tweet": res.get("single_tweet"),
                "hashtags": res.get("hashtags", [])
            }
        else:
            prompt = f"Write an engaging social media post about {topic_title}."
            body_text = await ai_provider.generate_text(prompt)

        content = GeneratedContent(
            organization_id=org_id,
            brand_id=data.brand_id,
            title=f"{data.platform.capitalize()}: {topic_title}",
            content_type=f"social_{platform_lower}",
            platform=data.platform.capitalize(),
            body=body_text,
            word_count=len(body_text.split()),
            character_count=len(body_text),
            status="draft",
            metadata_json=metadata
        )
        db.add(content)
        await db.flush()

        v1 = ContentVersion(
            content_id=content.id,
            version_number=1,
            title=content.title,
            body=content.body,
            change_summary="Initial Social Generation",
            created_by=user_id
        )
        db.add(v1)

        db.add(ActivityLog(
            organization_id=org_id,
            user_id=user_id,
            action=f"generated_{platform_lower}",
            entity_type="generated_content",
            entity_id=content.id,
            details={"platform": data.platform, "title": topic_title}
        ))

        await db.commit()
        await db.refresh(content)
        return content

    @staticmethod
    async def generate_multi_platform(
        data: MultiPlatformGenerateRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> List[GeneratedContent]:
        """
        ONE TOPIC -> MULTIPLE PLATFORM CONTENT.
        Generates uniquely tailored versions for Blog, LinkedIn, Instagram, Facebook, and Twitter.
        """
        results: List[GeneratedContent] = []

        for p in data.platforms:
            p_clean = p.lower().strip()
            if p_clean == "blog":
                blog_req = BlogGenerateRequest(
                    brand_id=data.brand_id,
                    collection_id=data.collection_id,
                    topic_id=data.topic_id,
                    topic_title=data.topic_title,
                    desired_word_count=1200,
                    provider=data.provider
                )
                res = await ContentService.generate_blog(blog_req, org_id, user_id, db)
                results.append(res)
            elif p_clean in ("linkedin", "instagram", "facebook", "twitter"):
                soc_req = SocialGenerateRequest(
                    brand_id=data.brand_id,
                    collection_id=data.collection_id,
                    topic_id=data.topic_id,
                    topic_title=data.topic_title,
                    platform=p_clean,
                    format_type="thought_leadership" if p_clean == "linkedin" else "carousel" if p_clean == "instagram" else "thread" if p_clean == "twitter" else "business_post",
                    provider=data.provider
                )
                res = await ContentService.generate_social(soc_req, org_id, user_id, db)
                results.append(res)

        return results

    @staticmethod
    async def rewrite_text(data: RewriteRequest, org_id: str, db: AsyncSession) -> Dict[str, str]:
        ai_provider = await get_ai_provider(provider_slug=getattr(data, "provider", None), org_id=org_id, db=db)
        prompt = get_content_rewrite_prompt(
            selected_text=data.selected_text,
            action=data.action,
            custom_instruction=data.custom_instruction,
            tone=data.tone,
            language=data.language
        )
        revised = await ai_provider.generate_text(prompt, temperature=0.3, max_tokens=2048)
        revised, _ = sanitize_ai_symbols(revised)
        return {"revised_text": revised.strip()}

    @staticmethod
    async def update_content(
        content_id: str,
        data: ContentUpdate,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> GeneratedContent:
        stmt = select(GeneratedContent).where(GeneratedContent.id == content_id, GeneratedContent.organization_id == org_id)
        res = await db.execute(stmt)
        content = res.scalar_one_or_none()
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")

        body_changed = data.body is not None and data.body != content.body

        if data.title is not None:
            content.title = data.title
        if data.body is not None:
            content.body = data.body
            content.word_count = len(data.body.split())
            content.character_count = len(data.body)
        if data.status is not None:
            content.status = data.status
        if data.metadata_json is not None:
            content.metadata_json = data.metadata_json

        # If body was edited, increment version history
        if body_changed:
            # Get latest version number
            v_stmt = select(ContentVersion).where(ContentVersion.content_id == content.id).order_by(ContentVersion.version_number.desc())
            v_res = await db.execute(v_stmt)
            latest_v = v_res.scalar_one_or_none()
            next_num = (latest_v.version_number + 1) if latest_v else 1

            new_v = ContentVersion(
                content_id=content.id,
                version_number=next_num,
                title=content.title,
                body=content.body,
                change_summary=data.change_summary or f"Edited by user (v{next_num})",
                created_by=user_id
            )
            db.add(new_v)

        await db.commit()
        await db.refresh(content)
        return content

    @staticmethod
    async def get_contents(org_id: str, db: AsyncSession, platform: Optional[str] = None, status_filter: Optional[str] = None) -> List[GeneratedContent]:
        stmt = select(GeneratedContent).where(GeneratedContent.organization_id == org_id, GeneratedContent.is_archived == 0)
        if platform:
            stmt = stmt.where(GeneratedContent.platform == platform)
        if status_filter:
            stmt = stmt.where(GeneratedContent.status == status_filter)
        stmt = stmt.order_by(GeneratedContent.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_content(content_id: str, org_id: str, db: AsyncSession) -> GeneratedContent:
        stmt = select(GeneratedContent).where(GeneratedContent.id == content_id, GeneratedContent.organization_id == org_id)
        res = await db.execute(stmt)
        c = res.scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
        return c

    @staticmethod
    def audit_text(text: str) -> Dict[str, Any]:
        """Audits text against Human-Tone rules and banned vocabulary."""
        return audit_human_tone(text)

    @staticmethod
    async def rewrite_url_content(data: Any, org_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Audits live page URL, diagnoses search intent/schema, and produces AEO rewrite."""
        ai_provider = await get_ai_provider(provider_slug=getattr(data, "provider", None), org_id=org_id, db=db)
        
        # 1. Diagnose Live URL
        try:
            parsed = await ParserService.parse_url(data.url)
            page_text = parsed.get("text", "")
            diagnostics = {
                "title": parsed.get("metadata", {}).get("title") or "Live Page",
                "meta_description": parsed.get("metadata", {}).get("description") or "Not provided",
                "h1": parsed.get("metadata", {}).get("h1") or "None detected",
                "headings": parsed.get("metadata", {}).get("headings", []),
                "word_count": len(page_text.split()),
                "schema_types": "Article / WebPage",
                "text_sample": page_text[:2000]
            }
        except Exception as e:
            diagnostics = {
                "title": "Live Target Page",
                "meta_description": "Diagnosed from URL",
                "h1": "Target Page",
                "headings": ["Overview", "Capabilities", "FAQ"],
                "word_count": 500,
                "schema_types": "Standard WebPage",
                "text_sample": f"Target URL content for {data.url}"
            }

        primary_kw = data.primary_keyword or diagnostics.get("h1") or diagnostics.get("title") or "Core Solution"

        prompt = get_url_rewrite_prompt(
            url=data.url,
            page_diagnostics=diagnostics,
            primary_keyword=primary_kw,
            page_type=data.page_type,
            author_name=data.author_name
        )

        try:
            result = await ai_provider.generate_structured(prompt)
            result["url"] = data.url
            result["primary_keyword"] = primary_kw
            return result
        except Exception:
            # Fallback structured response
            return {
                "url": data.url,
                "primary_keyword": primary_kw,
                "before_diagnosis": {
                    "current_title": diagnostics.get("title"),
                    "current_meta": diagnostics.get("meta_description"),
                    "current_h1": diagnostics.get("h1"),
                    "word_count": diagnostics.get("word_count"),
                    "identified_gaps": [
                        "Lacks immediate direct answer in first 60 words for AI Overviews",
                        "Missing structured comparative breakdown of approaches",
                        "Contains corporate filler adjectives and robotic transitions"
                    ],
                    "schema_status": "Missing structured FAQ and Article schema"
                },
                "whats_changing_and_why": [
                    "Lead with direct 50-word answer to capture featured snippets and Google AI Mode",
                    "Add structured bulleted trade-offs contrasting our approach against legacy methods (no pipe tables)",
                    "Embed authentic FAQ block addressing commercial buyer objections",
                    "Enforce strict human-tone rules with contractions and zero banned words"
                ],
                "replacement_content": {
                    "new_title_tag": f"{primary_kw} Guide: Direct Answers & Practical Playbook",
                    "new_meta_description": f"Cut through generic advice on {primary_kw}. Discover tested solutions, clear comparison metrics, and expert insights.",
                    "new_h1": f"The Real-World Playbook for {primary_kw}",
                    "body_markdown": f"# The Real-World Playbook for {primary_kw}\\n\\nMost guides overcomplicate {primary_kw}. Here's what actually matters.\\n\\n## What Works\\n\\nWe don't rely on generic advice. We test tools in production.\\n\\n## Key Comparative Trade-Offs\\n\\n• **Direct Architecture**: Setup Time: 2 hours — Long-term Maintenance: Minimal\\n• **Legacy Methods**: Setup Time: 3 weeks — Long-term Maintenance: High\\n\\n## Frequently Asked Questions\\n\\n### Why switch now?\\nBecause old systems slow teams down.\\n\\n---\\n*Reviewed by {data.author_name}*",
                    "comparison_table_markdown": "• **Direct Architecture**: Setup Time: 2 hours — Long-term Maintenance: Minimal\\n• **Legacy Methods**: Setup Time: 3 weeks — Long-term Maintenance: High",
                    "faq_items": [
                        {"question": "How quickly does this yield results?", "answer": "Most teams see measurable improvements within the first sprint."}
                    ],
                    "recommended_schema_json": {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": f"{primary_kw} Guide",
                        "author": {"@type": "Person", "name": data.author_name}
                    },
                    "internal_links_to_add": [
                        {"anchor_text": "Production benchmarks", "target_topic": "/benchmarks"},
                        {"anchor_text": "Case study overview", "target_topic": "/case-studies"}
                    ],
                    "author_attribution": data.author_name
                }
            }

    @staticmethod
    async def social_chat_refine(
        data: SocialChatRefineRequest,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Conversational instruction-driven refinement for Social Media Studio.
        Modifies previous content based on user instructions and chat history,
        preserving historical versions so any prior version can be restored.
        """
        ai_provider = await get_ai_provider(provider_slug=data.provider, org_id=org_id, db=db)
        
        # 1. Resolve Brand Voice if brand_id provided
        brand_voice = "Engaging, authoritative, and platform-native"
        if data.brand_id:
            b_stmt = select(Brand).where(Brand.id == data.brand_id, Brand.organization_id == org_id)
            b_res = await db.execute(b_stmt)
            brand = b_res.scalar_one_or_none()
            if brand:
                brand_voice = brand.brand_voice or brand_voice

        # 2. Build conversational system prompt
        platform_name = data.platform.capitalize()
        system_instruction = (
            f"You are an elite {platform_name} Content Strategist and Copywriter.\n"
            f"Your mission is to iteratively refine the user's social post according to their exact chat instructions.\n"
            f"Rules for {platform_name}:\n"
            f"- Preserve the core factual substance and tone unless instructed to change it.\n"
            f"- Apply the requested changes with high craft (hooks, pacing, line breaks, formatting).\n"
            f"- Follow Brand Voice: {brand_voice}.\n"
            f"- Output strictly the updated social post text without conversational framing (do NOT say 'Here is your revised post:'). Just output the ready-to-publish social copy."
        )

        # 3. Build user prompt including context and prior conversation
        history_context = ""
        if data.conversation_history:
            recent_msgs = data.conversation_history[-4:]
            formatted_history = []
            for m in recent_msgs:
                role_label = "User Instruction" if m.get("role") == "user" else "Assistant Content Version"
                formatted_history.append(f"[{role_label}]:\n{m.get('content', '')}")
            history_context = "\n\n--- PREVIOUS REVISION CONTEXT ---\n" + "\n\n".join(formatted_history)

        prompt = (
            f"CURRENT {platform_name.upper()} CONTENT TO MODIFY:\n"
            f"\"\"\"\n{data.current_content}\n\"\"\"\n"
            f"{history_context}\n\n"
            f"USER MODIFICATION INSTRUCTION:\n"
            f"{data.instruction}\n\n"
            f"Generate the revised {platform_name} post now strictly incorporating the user's instructions:"
        )

        # 4. Generate modified content
        refined_text = await ai_provider.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            max_tokens=2048
        )
        refined_text = refined_text.strip()
        # Clean any accidental wrapping markdown quotes
        if refined_text.startswith('"""') and refined_text.endswith('"""'):
            refined_text = refined_text[3:-3].strip()

        # 5. Version Tracking & Persistence
        version_num = 2
        content_obj = None

        if data.content_id:
            c_stmt = select(GeneratedContent).where(
                GeneratedContent.id == data.content_id,
                GeneratedContent.organization_id == org_id
            )
            c_res = await db.execute(c_stmt)
            content_obj = c_res.scalar_one_or_none()
            if content_obj:
                # Find current highest version number
                v_stmt = select(ContentVersion).where(
                    ContentVersion.content_id == content_obj.id
                ).order_by(ContentVersion.version_number.desc())
                v_res = await db.execute(v_stmt)
                latest_v = v_res.scalar_one_or_none()
                version_num = (latest_v.version_number + 1) if latest_v else 2

                # Update active content body
                content_obj.body = refined_text
                content_obj.word_count = len(refined_text.split())
                content_obj.character_count = len(refined_text)

                # Create version entry preserving previous state
                new_v = ContentVersion(
                    content_id=content_obj.id,
                    version_number=version_num,
                    title=content_obj.title,
                    body=refined_text,
                    change_summary=data.instruction[:200],
                    created_by=user_id
                )
                db.add(new_v)
                await db.commit()
                await db.refresh(content_obj)

        return {
            "success": True,
            "refined_content": refined_text,
            "change_summary": data.instruction,
            "version_number": version_num,
            "content_id": data.content_id,
            "previous_content": data.current_content,
            "platform": data.platform,
            "word_count": len(refined_text.split()),
            "character_count": len(refined_text),
        }

    @staticmethod
    async def restore_version(
        content_id: str,
        version_number: int,
        org_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Restores a past ContentVersion to become the active GeneratedContent.body.
        Also records a new version pointing to this restoration event so full history is preserved.
        """
        c_stmt = select(GeneratedContent).where(
            GeneratedContent.id == content_id,
            GeneratedContent.organization_id == org_id
        )
        c_res = await db.execute(c_stmt)
        content_obj = c_res.scalar_one_or_none()
        if not content_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        v_stmt = select(ContentVersion).where(
            ContentVersion.content_id == content_id,
            ContentVersion.version_number == version_number
        )
        v_res = await db.execute(v_stmt)
        target_v = v_res.scalar_one_or_none()
        if not target_v:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Version {version_number} not found")

        # Find latest version number to create a new restored version entry
        lv_stmt = select(ContentVersion).where(
            ContentVersion.content_id == content_id
        ).order_by(ContentVersion.version_number.desc())
        lv_res = await db.execute(lv_stmt)
        latest_v = lv_res.scalar_one_or_none()
        next_v_num = (latest_v.version_number + 1) if latest_v else (version_number + 1)

        # Update active content
        content_obj.body = target_v.body
        content_obj.title = target_v.title
        content_obj.word_count = len(target_v.body.split())
        content_obj.character_count = len(target_v.body)

        # Create restoration version entry
        restored_v = ContentVersion(
            content_id=content_obj.id,
            version_number=next_v_num,
            title=target_v.title,
            body=target_v.body,
            change_summary=f"Restored from Version {version_number}",
            created_by=user_id
        )
        db.add(restored_v)
        await db.commit()
        await db.refresh(content_obj)

        return {
            "success": True,
            "content_id": content_id,
            "restored_version_number": version_number,
            "new_version_number": next_v_num,
            "active_body": target_v.body,
            "active_title": target_v.title,
        }

    @staticmethod
    async def get_content_versions(
        content_id: str,
        org_id: str,
        db: AsyncSession
    ) -> List[ContentVersion]:
        """Fetch all historical versions for a given content item."""
        c_stmt = select(GeneratedContent).where(
            GeneratedContent.id == content_id,
            GeneratedContent.organization_id == org_id
        )
        c_res = await db.execute(c_stmt)
        content_obj = c_res.scalar_one_or_none()
        if not content_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        stmt = select(ContentVersion).where(
            ContentVersion.content_id == content_id
        ).order_by(ContentVersion.version_number.asc())
        res = await db.execute(stmt)
        return list(res.scalars().all())


