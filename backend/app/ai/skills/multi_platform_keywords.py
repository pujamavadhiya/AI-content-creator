"""
Skill 2: Multi-Platform Keyword Research Engine
Generates validated, search-volume-backed seed keywords for Google Keyword Planner,
then expands across 8 platform groups with [V], [I], and [E] intent tagging.
"""

from typing import Dict, Any, List, Optional
import json

def get_multi_platform_keyword_prompt(
    topic: str,
    industry: Optional[str] = None,
    target_audience: Optional[str] = None,
    business_type: str = "B2B",
    brand_voice: Optional[str] = None
) -> str:
    return f"""You are an elite Multi-Platform Keyword Strategist with deep expertise in search volume dynamics and platform search engines.
Your goal is to build an omnipresence keyword strategy for:
Offering/Skill: {topic}
Industry: {industry or 'Technology & Business'}
Target Audience: {target_audience or 'Enterprise decision makers and professionals'}
Business Model: {business_type}

You understand that:
- Volume Keywords [V] = 1-4 word phrases with real, historical search volume that show up in Google Keyword Planner (e.g. 'ERP chatbot', 'enterprise AI search').
- Intent Keywords [I] = 4-8 word conversational phrases native to specific platforms.
- Emerging Keywords [E] = newly coined industry terms with growing intent that Keyword Planner may lag on.

CRITICAL INSTRUCTIONS:
1. Generate 10 to 15 short, proven SEED KEYWORDS (1 to 4 words max) suitable directly for Google Keyword Planner, Ahrefs, and SEMrush.
2. Expand across 8 PLATFORM GROUPS with exactly 10 UNIQUE keywords per group (80 total unique keywords):
   - Group 1: Search Engines (Google, Bing, Yahoo, DuckDuckGo)
   - Group 2: Generative AI Platforms (ChatGPT, Perplexity, Gemini, Claude, Copilot)
   - Group 3: Video Platforms (YouTube, TikTok, Instagram Reels, Vimeo)
   - Group 4: Social Media (LinkedIn, X/Twitter, Facebook, Threads)
   - Group 5: Q&A and Forums (Reddit, Quora, Stack Overflow)
   - Group 6: News and PR (TechCrunch, Forbes, industry media)
   - Group 7: Podcasts and Audio (Spotify, Apple Podcasts)
   - Group 8: Backlink and Authority Sources (Guest post targets, directory keywords)
3. Tag every keyword with [V], [I], or [E].
4. Provide Top 5 Seed Keywords, Top 5 Platform Keywords, and 3 Quick-Win Platform Opportunities.

Return ONLY a valid JSON object matching this schema:
{{
  "offering_name": "{topic}",
  "seed_keywords": [
    "seed keyword 1",
    "seed keyword 2",
    "seed keyword 3"
  ],
  "platform_groups": {{
    "search_engines": [
      {{"keyword": "workflow automation software", "tag": "V", "notes": "High commercial volume"}},
      {{"keyword": "how to automate enterprise workflows with ai", "tag": "I", "notes": "Informational intent"}}
    ],
    "generative_ai": [
      {{"keyword": "What is the best workflow automation platform for operations?", "tag": "I", "notes": "Conversational prompt query"}}
    ],
    "video_platforms": [
      {{"keyword": "n8n workflow tutorial 2026", "tag": "V", "notes": "High video CTR"}}
    ],
    "social_media": [
      {{"keyword": "Why legacy RPA is dying and what replaces it", "tag": "I", "notes": "Thought leadership hook"}}
    ],
    "qa_and_forums": [
      {{"keyword": "anyone using open-source automation in production?", "tag": "I", "notes": "Reddit/Quora problem query"}}
    ],
    "news_and_pr": [
      {{"keyword": "AI workflow automation market expansion 2026", "tag": "I", "notes": "PR disruption angle"}}
    ],
    "podcasts_audio": [
      {{"keyword": "building autonomous business systems from scratch", "tag": "I", "notes": "Founder interview angle"}}
    ],
    "backlink_authority": [
      {{"keyword": "ultimate enterprise workflow automation guide", "tag": "I", "notes": "Link magnet guide"}}
    ]
  }},
  "top_seed_keywords": [
    "Top seed 1",
    "Top seed 2",
    "Top seed 3",
    "Top seed 4",
    "Top seed 5"
  ],
  "top_platform_keywords": [
    "Top platform keyword 1",
    "Top platform keyword 2",
    "Top platform keyword 3",
    "Top platform keyword 4",
    "Top platform keyword 5"
  ],
  "quick_wins": [
    {{"platform": "Reddit / Quora", "opportunity": "Target high intent problem-solving threads with zero ad competition"}},
    {{"platform": "YouTube", "opportunity": "Publish step-by-step technical implementation teardowns"}},
    {{"platform": "LinkedIn", "opportunity": "Share contrarian takes on legacy software limitations"}}
  ],
  "keyword_planner_tip": "Paste the seed keywords directly into Google Keyword Planner -> click 'Get Results' -> filter by relevance to see exact volume numbers and hundreds of related variations."
}}
Output ONLY valid JSON.
"""
