from typing import Optional, Dict, Any

def get_blog_generation_prompt(
    title: str,
    outline_data: Optional[Dict[str, Any]],
    brand_voice: str,
    writing_tone: str,
    target_audience: str,
    desired_word_count: int,
    cta_style: str,
    restricted_words: list[str],
    preferred_keywords: list[str],
    reference_context: Optional[str] = None
) -> str:
    outline_str = ""
    if outline_data:
        import json
        outline_str = f"\nApproved Content Outline:\n---\n{json.dumps(outline_data, indent=2)}\n---"

    ref_str = f"\nGrounding Reference Context (USE THESE FACTS):\n---\n{reference_context}\n---" if reference_context else ""
    restricted_str = f"\nRESTRICTED WORDS/PHRASES (DO NOT USE): {', '.join(restricted_words)}" if restricted_words else ""
    preferred_str = f"\nPREFERRED KEYWORDS TO WEAVE NATURALLY: {', '.join(preferred_keywords)}" if preferred_keywords else ""

    return f"""You are a World-Class Technical Journalist and SEO Specialist.
Write a comprehensive, publication-grade article based on the following specifications:

Title: {title}
Target Word Count: ~{desired_word_count} words
Brand Voice: {brand_voice}
Writing Tone: {writing_tone}
Target Audience: {target_audience}
Preferred CTA: {cta_style}
{outline_str}
{ref_str}
{restricted_str}
{preferred_str}

CRITICAL EDITORIAL GUIDELINES:
1. Ground facts and technical concepts in the provided reference materials. Never invent citations or make unsupported factual claims.
2. Structure with a single # H1 Title, followed by clear ## H2 and ### H3 sections.
3. Write substantive, analytical paragraphs with concrete examples, bulleted takeaways, and comparison tables where appropriate.
4. Avoid generic filler cliches like "In today's fast-paced digital world" or "Delve into". Begin with an immediate, high-value hook.
5. Include an FAQ section with 3 practical questions and authoritative answers near the end.
6. Conclude with actionable next steps and the specified CTA.
7. Use standard Markdown formatting.

Produce the complete, fully written article now.
"""
