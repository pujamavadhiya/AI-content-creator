from typing import Optional, List

def get_outline_generation_prompt(
    topic_title: str,
    primary_keyword: str,
    secondary_keywords: List[str],
    search_intent: str,
    target_audience: Optional[str] = None,
    content_format: Optional[str] = None,
    brand_voice: Optional[str] = None,
    reference_context: Optional[str] = None,
    custom_notes: Optional[str] = None
) -> str:
    sec_kw = ", ".join(secondary_keywords) if secondary_keywords else primary_keyword
    ref_section = f"\nRelevant Reference Knowledge:\n---\n{reference_context}\n---" if reference_context else ""
    notes_section = f"\nUser Requirements: {custom_notes}" if custom_notes else ""

    return f"""You are a Master Content Architect. Create an exhaustive, production-ready SEO Content Outline for an in-depth article.

Topic Title: {topic_title}
Primary Keyword: {primary_keyword}
Secondary Keywords: {sec_kw}
Search Intent: {search_intent}
Target Audience: {target_audience or 'Industry Professionals'}
Content Format: {content_format or 'In-depth Article'}
Brand Voice: {brand_voice or 'Authoritative and Actionable'}
{notes_section}
{ref_section}

Return ONLY a valid JSON object matching this exact structure:
{{
  "title": "{topic_title}",
  "seo_title_suggestions": [
    "SEO Title Option 1 with keyword",
    "SEO Title Option 2 (High CTR)",
    "SEO Title Option 3 (Direct & Authoritative)"
  ],
  "primary_keyword": "{primary_keyword}",
  "secondary_keywords": {secondary_keywords or [primary_keyword]},
  "search_intent": "{search_intent}",
  "target_audience": "{target_audience or 'Industry Practitioners'}",
  "content_objective": "Comprehensive guide educating readers while establishing brand thought leadership",
  "meta_title": "Optimized meta title under 60 chars",
  "meta_description": "Compelling meta description between 140-155 characters containing primary keyword",
  "url_slug_suggestion": "short-clean-url-slug",
  "introduction_structure": "Hook with compelling statistic/pain point -> Problem agitation -> Thesis statement -> Overview of what reader will gain",
  "h1_heading": "Clear, High-Impact H1 Heading",
  "headings_hierarchy": [
    {{
      "h2": "First Major Section Heading",
      "h3": ["Subheading A", "Subheading B"],
      "points": ["Specific discussion point 1 with data", "Point 2 with reference grounding"]
    }},
    {{
      "h2": "Second Major Core Framework Heading",
      "h3": ["Deep dive element 1", "Deep dive element 2"],
      "points": ["Actionable step-by-step guidance", "Key implementation nuances"]
    }},
    {{
      "h2": "Third Critical Analysis Section",
      "h3": ["Common pitfalls", "Best practice mitigations"],
      "points": ["Strategic evaluation", "Real-world trade-offs"]
    }}
  ],
  "suggested_examples": [
    "Practical enterprise use case or real-world example",
    "Comparative workflow illustration"
  ],
  "faqs": [
    {{
      "q": "What is the primary challenge when implementing this?",
      "a_outline": "Key takeaway answer summarizing the strategic response"
    }},
    {{
      "q": "How does this compare to traditional approaches?",
      "a_outline": "Direct comparison highlighting efficiency and ROI"
    }},
    {{
      "q": "What is the typical timeframe or resource requirement?",
      "a_outline": "Realistic expectations and staged roadmap"
    }}
  ],
  "conclusion_structure": "Synthesize key insights -> Reiterate strategic competitive advantage -> Final inspiring forward-looking thought",
  "cta": "Compelling CTA aligned with brand goals",
  "internal_links_suggested": ["Link to related topic guide", "Link to case studies"],
  "supporting_references": ["Key fact or data point from reference"]
}}
Output ONLY valid JSON.
"""
