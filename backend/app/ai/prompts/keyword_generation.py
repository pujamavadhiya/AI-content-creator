from typing import Optional, List

def get_keyword_generation_prompt(
    topic: str,
    industry: Optional[str] = None,
    target_audience: Optional[str] = None,
    location: Optional[str] = None,
    brand_voice: Optional[str] = None,
    reference_context: Optional[str] = None
) -> str:
    ref_section = f"\nSupporting Reference Context:\n---\n{reference_context}\n---" if reference_context else ""
    return f"""You are an elite SEO Strategist and Keyword Researcher.
Generate a comprehensive list of high-impact keywords across all 10 strategic categories for:
Topic: {topic}
Industry: {industry or 'General Tech/Business'}
Target Audience: {target_audience or 'Professionals and decision makers'}
Target Location: {location or 'Global'}
Brand Voice: {brand_voice or 'Authoritative & Informative'}
{ref_section}

IMPORTANT RULES:
1. Do not fabricate numerical search volumes, CPC, or difficulty scores.
2. Group keywords across the 10 required categories:
   primary, secondary, long-tail, semantic, related, question, commercial, informational, transactional, navigational.
3. If information is directly derived from the reference context, quote or note the supporting evidence.

Return ONLY a valid JSON list of keyword objects:
[
  {{
    "keyword": "string",
    "category": "primary|secondary|long-tail|semantic|related|question|commercial|informational|transactional|navigational",
    "search_intent": "informational|commercial|transactional|navigational",
    "relevance_score": 0.95,
    "related_topic": "Subtopic name",
    "suggested_content_type": "Blog Post|How-To Guide|Case Study|Social Post",
    "supporting_reference": "Extracted concept from reference or General Domain Knowledge"
  }}
]
Generate 15 to 25 strategic keywords. Output ONLY valid JSON.
"""

