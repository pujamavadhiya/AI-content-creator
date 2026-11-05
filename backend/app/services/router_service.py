import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.ai.providers.factory import get_ai_provider
from app.ai.skills.skill_registry import STEP_ALIAS_MAP, SKILL_METADATA

logger = logging.getLogger(__name__)

ROUTER_SYSTEM_PROMPT = """You route content requests for Sevencore AI Content Studio. Read the user request and project context, and return valid JSON only with no preamble or markdown code blocks.

Available steps:
- keyword_research: multi-platform seed and intent keyword research across 8 platforms
- serp_gap: competitor landscape teardown, content gaps, real statistics, PAA questions
- brief: structured brief, H1/H2 outline, word budgets, search intent
- topic_cluster: 1-3 pillars, 6-12 support pieces, content calendar
- brand_voice: tone, vocabulary, formality rules
- eeat: author credentials, real experience, credibility signals
- draft: human-tone long-form writer (zero banned AI words, contractions, natural cadence)
- rewrite_url: audit live web page, diagnosis, AEO direct answer rewrite
- format_playbook: short copy formats (ads, newsletter, cold email, video script, case study)
- fact_check: verify factual claims, stats, numbers against real sources into a claim table
- qa: editor QA scorecard (readability, variety, AI tell score out of 100)
- seo_schema: title options, meta description, slug, JSON-LD structured data
- headline_lab: 10 headline variants scored across psychological angles
- originality: compare draft against ranking pages to prevent duplication
- refresh_audit: audit older post, decide update/merge/retire
- internal_links: suggest internal links with descriptive anchors
- repurpose: turn blog into LinkedIn post, X thread, newsletter, video script, carousel
- localization: adapt culturally and linguistically to target language/region
- compliance: check disclosures, YMYL safety, copyright, and risk flags

Standard Pipelines:
- Topic only (write something new): ["keyword_research", "serp_gap", "brief", "draft", "fact_check", "qa", "seo_schema"]
- Outline supplied: ["draft", "fact_check", "qa", "seo_schema"]
- Rewrite live URL: ["rewrite_url", "fact_check", "qa", "seo_schema"]
- Content refresh: ["refresh_audit", "draft", "fact_check", "qa"]
- Content planning / calendar: ["topic_cluster", "brief"]
- Repurposing: ["repurpose"]
- Short copy (ads, email, social): ["format_playbook", "headline_lab", "qa"]
- Localization / translation: ["localization", "qa"]
- Compressed ("just write it"): ["draft", "fact_check", "qa"]

Rules:
1. Always include fact_check when the content has numbers, quotes, or medical, legal, or financial claims.
2. Always end drafts with qa.
3. If the request is unclear or missing vital details, list missing_inputs.

Return format:
{
  "request_type": "new_content" | "outline_given" | "rewrite_url" | "refresh" | "plan" | "repurpose" | "short_copy" | "localize" | "other",
  "steps": ["step_name_1", "step_name_2"],
  "missing_inputs": [],
  "defaults_assumed": {"audience": "professional peers", "word_count": 1200, "content_type": "blog"},
  "needs_web_search": true,
  "reasoning": "One line explanation"
}
"""

class RouterService:
    """
    Intelligent AI Orchestrator Router.
    Analyzes content requests and plans the optimal sequential skill chain.
    """

    async def route_request(
        self,
        request: str,
        project_context: Optional[Dict[str, Any]] = None,
        provider_slug: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Classify request and return structured execution plan.
        """
        req_clean = request.strip()
        ctx = project_context or {}

        # First, try calling AI model via fast provider
        try:
            ai_provider = await get_ai_provider(provider_slug=provider_slug or "gemini")
            user_prompt = f"Request: {req_clean}\nContext: {json.dumps(ctx)}"

            result = await ai_provider.generate_structured(
                prompt=user_prompt,
                system_instruction=ROUTER_SYSTEM_PROMPT,
                temperature=0.1
            )

            if isinstance(result, dict) and "steps" in result and isinstance(result["steps"], list):
                sanitized = self._sanitize_plan(result, req_clean)
                return sanitized
        except Exception as e:
            logger.warning(f"AI Router call failed ({e}). Using deterministic fallback router.")

        # Fallback heuristic classification
        return self._heuristic_route(req_clean, ctx)

    def _sanitize_plan(self, plan: Dict[str, Any], raw_request: str) -> Dict[str, Any]:
        """Validate step names against registered skills and enforce rules."""
        raw_steps = plan.get("steps", [])
        validated_steps: List[str] = []

        for step in raw_steps:
            s = str(step).strip().lower()
            if s in STEP_ALIAS_MAP:
                validated_steps.append(s)
            else:
                # Check canonical match
                for alias, canonical in STEP_ALIAS_MAP.items():
                    if s == canonical:
                        validated_steps.append(alias)
                        break

        # If empty, fallback
        if not validated_steps:
            validated_steps = ["draft", "fact_check", "qa"]

        # Rule: Drafts must end with QA
        if "draft" in validated_steps and "qa" not in validated_steps:
            validated_steps.append("qa")

        # Determine if web search is needed
        needs_search = any(
            SKILL_METADATA.get(STEP_ALIAS_MAP.get(s, s), {}).get("needs_search", False)
            for s in validated_steps
        )

        return {
            "request_type": plan.get("request_type", "new_content"),
            "steps": validated_steps,
            "missing_inputs": plan.get("missing_inputs", []),
            "defaults_assumed": plan.get("defaults_assumed", {"word_count": 1200, "audience": "professional"}),
            "needs_web_search": needs_search or plan.get("needs_web_search", False),
            "reasoning": plan.get("reasoning", "Routed based on user intent and quality requirements."),
        }

    def _heuristic_route(self, request: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic heuristic router for zero-latency or offline fallback."""
        lowered = request.lower()

        # URL Rewrite check
        url_match = re.search(r"https?://[^\s]+", request)
        if url_match or "rewrite url" in lowered or "rewrite page" in lowered or "audit url" in lowered:
            return {
                "request_type": "rewrite_url",
                "steps": ["rewrite_url", "fact_check", "qa", "seo_schema"],
                "missing_inputs": [] if url_match else ["live_url"],
                "defaults_assumed": {"word_count": 1500, "content_type": "webpage"},
                "needs_web_search": True,
                "reasoning": "Detected live webpage URL rewrite request.",
            }

        # Repurposing
        if any(w in lowered for w in ["repurpose", "thread", "linkedin post", "carousel", "social posts"]):
            return {
                "request_type": "repurpose",
                "steps": ["repurpose"],
                "missing_inputs": [],
                "defaults_assumed": {"formats": ["linkedin", "twitter_thread", "newsletter"]},
                "needs_web_search": False,
                "reasoning": "Detected multi-channel content repurposing request.",
            }

        # Short copy / ads / email
        if any(w in lowered for w in ["ad copy", "cold email", "newsletter", "product description", "video script", "press release"]):
            return {
                "request_type": "short_copy",
                "steps": ["format_playbook", "headline_lab", "qa"],
                "missing_inputs": [],
                "defaults_assumed": {"variants": 3},
                "needs_web_search": False,
                "reasoning": "Detected specialized short copy format playbook request.",
            }

        # Calendar / Strategy / Topics
        if any(w in lowered for w in ["calendar", "topic cluster", "editorial plan", "month of content", "pillar"]):
            return {
                "request_type": "plan",
                "steps": ["topic_cluster", "brief"],
                "missing_inputs": [],
                "defaults_assumed": {"posting_frequency": "weekly", "pillars": 2},
                "needs_web_search": False,
                "reasoning": "Detected editorial calendar and topic cluster planning request.",
            }

        # Content refresh
        if any(w in lowered for w in ["refresh", "decay", "update old", "audit post"]):
            return {
                "request_type": "refresh",
                "steps": ["refresh_audit", "draft", "fact_check", "qa"],
                "missing_inputs": [],
                "defaults_assumed": {"target_length": 1500},
                "needs_web_search": True,
                "reasoning": "Detected content refresh and decay audit request.",
            }

        # Outline supplied
        if ctx.get("outline") or "outline:" in lowered or "here is the outline" in lowered:
            return {
                "request_type": "outline_given",
                "steps": ["draft", "fact_check", "qa", "seo_schema"],
                "missing_inputs": [],
                "defaults_assumed": {"word_count": 1200},
                "needs_web_search": False,
                "reasoning": "Outline detected; jumping straight to drafting, fact-checking, and QA.",
            }

        # Just write it
        if "just write" in lowered or "quick draft" in lowered:
            return {
                "request_type": "compressed",
                "steps": ["draft", "fact_check", "qa"],
                "missing_inputs": [],
                "defaults_assumed": {"word_count": 800},
                "needs_web_search": False,
                "reasoning": "Compressed drafting requested; retaining mandatory fact-check and QA.",
            }

        # Default: Full comprehensive pipeline (Topic only)
        return {
            "request_type": "new_content",
            "steps": ["keyword_research", "serp_gap", "brief", "draft", "fact_check", "qa", "seo_schema"],
            "missing_inputs": [] if ctx.get("primary_keyword") else ["primary_keyword"],
            "defaults_assumed": {"word_count": 1200, "audience": "smart professional peers", "language": "English"},
            "needs_web_search": True,
            "reasoning": "New topic request; executing full research, brief, drafting, and quality pipeline.",
        }

router_service = RouterService()

