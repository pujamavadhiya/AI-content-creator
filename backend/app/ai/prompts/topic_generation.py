from typing import Optional, List

def get_topic_generation_prompt(
    primary_keyword: str,
    secondary_keywords: List[str],
    industry: Optional[str] = None,
    target_audience: Optional[str] = None,
    content_objective: Optional[str] = None,
    brand_voice: Optional[str] = None,
    reference_context: Optional[str] = None
) -> str:
    sec_kw = ", ".join(secondary_keywords) if secondary_keywords else "None"
    ref_section = f"\nSupporting Reference Context:\n---\n{reference_context}\n---" if reference_context else ""
    return f"""You are a Chief Content Strategist. Generate high-converting, reference-informed content topic ideas.

Primary Keyword: {primary_keyword}
Secondary Keywords: {sec_kw}
Industry: {industry or 'Industry Standard'}
Target Audience: {target_audience or 'Decision Makers'}
Content Objective: {content_objective or 'Thought Leadership and Organic Search Growth'}
Brand Voice: {brand_voice or 'Professional and authoritative'}
{ref_section}

Generate 10 to 15 unique, strategic topic suggestions.
Available content formats: How-to guides, Listicles, Tutorials, Comparisons, Case studies, Industry insights, Educational articles, Opinion pieces, Thought leadership, News analysis, Product/service content, Frequently asked questions.

Output ONLY a valid JSON list of topic objects:
[
  {{
    "title": "Compelling Title",
    "description": "2-3 sentence strategic rationale and angle",
    "primary_keyword": "{primary_keyword}",
    "secondary_keywords": ["Keyword A", "Keyword B"],
    "search_intent": "Informational|Commercial|Transactional",
    "target_audience": "Audience segment",
    "content_angle": "Unique perspective or contrarian angle",
    "content_format": "How-to Guide|Listicle|Tutorial|Comparison|Case Study|Industry Insights|Educational|Thought Leadership|FAQ",
    "suggested_cta": "Clear call-to-action",
    "relevance_score": 0.95,
    "supporting_reference_info": "Specific factual basis from reference context",
    "recommended_platform": "Blog|LinkedIn|Multi-Platform"
  }}
]
Output ONLY valid JSON.
"""

def get_topic_clustering_prompt(topics_json_str: str) -> str:
    return f"""You are an SEO Architect. Group the following topics into high-performance semantic Topic Clusters (Hub & Spoke / Pillar & Cluster model).

Topics:
{topics_json_str}

Identify the best Pillar topic(s) and their supporting Cluster topics.
Return ONLY a valid JSON list of clusters:
[
  {{
    "cluster_name": "Core Pillar Theme",
    "pillar_topic_title": "Title of the pillar topic",
    "supporting_topic_titles": ["Supporting topic 1", "Supporting topic 2", "Supporting topic 3"],
    "related_keywords": ["keyword 1", "keyword 2"],
    "internal_linking_strategy": "Explain how the cluster topics link into the pillar and vice-versa"
  }}
]
Output ONLY valid JSON.
"""
