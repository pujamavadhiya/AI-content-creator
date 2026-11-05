"""
Skill 3: Live Page Audit & AEO Content Rewrite with URL
Audits existing live web pages, diagnoses structural and search intent gaps,
and rewrites the page to achieve Answer Engine Optimization (AEO) and human-tone excellence.
"""

from typing import Dict, Any, Optional
from app.services.parser_service import ParserService
from app.ai.skills.human_tone import get_human_tone_system_rules

def get_url_rewrite_prompt(
    url: str,
    page_diagnostics: Dict[str, Any],
    primary_keyword: str,
    page_type: str = "blog",  # "blog", "service", or "landing"
    author_name: str = "Ashok Rathod - Tech Consultant"
) -> str:
    human_rules = get_human_tone_system_rules()

    return f"""You are a Master SEO and Answer Engine Optimization (AEO) Architect.
Analyze this live page and produce a full, CMS-ready replacement that satisfies Google Search, Google AI Overviews, ChatGPT Search, Gemini, Claude, and Perplexity.

Target URL: {url}
Primary Keyword to Own: {primary_keyword}
Content Purpose: {page_type.upper()} Page
Mandatory Author Credential: {author_name}

=== DIAGNOSED EXISTING LIVE PAGE DATA ===
Current Title: {page_diagnostics.get('title', 'Unknown')}
Current Meta Description: {page_diagnostics.get('meta_description', 'None detected')}
Current H1: {page_diagnostics.get('h1', 'None detected')}
Headings Detected: {', '.join(page_diagnostics.get('headings', [])[:8])}
Current Word Count: ~{page_diagnostics.get('word_count', 0)} words
Detected Schemas: {page_diagnostics.get('schema_types', 'None detected')}
Live Content Sample:
\"\"\"{page_diagnostics.get('text_sample', '')[:1200]}\"\"\"

{human_rules}

=== MANDATORY REWRITE SPECIFICATIONS ===
1. AEO & SEARCH ENGINE STRUCTURE:
   - Provide a direct answer to search intent in the first 40 to 80 words.
   - Follow the existing page structure without breaking original logic, but rewrite each section completely with fresh, high-value depth.
   - Include a clear comparative trade-off breakdown formatted as clean bulleted takeaways (DO NOT use raw markdown pipe tables '|---|').
   - Include a proof section with concrete details and an honest note on limitations.
   - Include an FAQ section with 4-5 genuine user questions derived from search intent.
   - At the bottom, provide authoritative citations/sources.
2. TONE & AUTHOR ATTRIBUTION:
   - Contractions throughout (don't, can't, won't, it's).
   - Zero AI filler words from the blacklist.
   - Author Line: "{author_name}".
   - Provide 2-4 specific internal link recommendations.
   - Provide recommended JSON-LD Schema markup.

Return ONLY a valid JSON object matching this schema:
{{
  "before_diagnosis": {{
    "current_title": "{page_diagnostics.get('title', '')}",
    "current_meta": "{page_diagnostics.get('meta_description', '')}",
    "current_h1": "{page_diagnostics.get('h1', '')}",
    "word_count": {page_diagnostics.get('word_count', 0)},
    "identified_gaps": [
      "Missing direct answer in top 100 words for AI overviews",
      "Thin coverage on practical implementation factors",
      "Lacks structured comparative trade-off breakdown"
    ],
    "schema_status": "Outdated or incomplete schema"
  }},
  "whats_changing_and_why": [
    "Replacing vague introductory claims with an immediate, definitive answer for Google AI mode",
    "Adding an actionable bulleted trade-off breakdown to qualify for featured snippets (no pipe tables)",
    "Incorporating real FAQ block addressing high-intent user objections",
    "Enforcing 100% human-tone voice without banned corporate vocabulary"
  ],
  "replacement_content": {{
    "new_title_tag": "New High-CTR SEO Title",
    "new_meta_description": "New compelling 155-char meta description",
    "new_h1": "New Optimized H1 Heading",
    "body_markdown": "# New H1 Heading\\n\\n[Full replacement body with H2/H3, bullet comparisons, FAQs, and citations]...",
    "comparison_table_markdown": "• **Feature / Factor**: Our Approach vs Traditional Methods...",
    "faq_items": [
      {{"question": "How does this approach solve X?", "answer": "Direct, concrete answer..."}}
    ],
    "recommended_schema_json": {{
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "...",
      "author": {{"@type": "Person", "name": "{author_name}"}}
    }},
    "internal_links_to_add": [
      {{"anchor_text": "Case studies & benchmarks", "target_topic": "/case-studies"}},
      {{"anchor_text": "Technical architecture overview", "target_topic": "/architecture"}}
    ],
    "author_attribution": "{author_name}"
  }}
}}
Output ONLY valid JSON.
"""

