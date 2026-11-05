from typing import Optional, Dict, Any
from app.ai.skills.human_tone import get_human_tone_system_rules

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
    compulsory_keywords: Optional[list[str]] = None,
    reference_context: Optional[str] = None,
    enforce_human_tone: bool = True
) -> str:
    outline_str = ""
    if outline_data:
        import json
        outline_str = f"\nApproved Content Outline:\n---\n{json.dumps(outline_data, indent=2)}\n---"

    ref_str = f"\nGrounding Reference Context (USE THESE FACTS):\n---\n{reference_context}\n---" if reference_context else ""
    restricted_str = f"\nRESTRICTED WORDS/PHRASES (DO NOT USE): {', '.join(restricted_words)}" if restricted_words else ""
    preferred_str = f"\nPREFERRED KEYWORDS TO WEAVE NATURALLY: {', '.join(preferred_keywords)}" if preferred_keywords else ""

    compulsory_str = ""
    if compulsory_keywords:
        kw_bullets = "\n".join(f"- {kw.strip()}" for kw in compulsory_keywords if kw.strip())
        compulsory_str = (
            f"\n\n=======================================================\n"
            f"CRITICAL REQUIREMENT - COMPULSORY KEYWORDS (ZERO EXCEPTIONS):\n"
            f"The user has designated the following keywords as COMPULSORY.\n"
            f"You MUST include EVERY SINGLE ONE of these keywords naturally in the content:\n"
            f"{kw_bullets}\n\n"
            f"Compulsory keyword rules:\n"
            f"1. 100% of these keywords must appear in headings, body paragraphs, or takeaways.\n"
            f"2. Never omit, shorten, or replace any of these compulsory keywords.\n"
            f"3. Weave them smoothly into the narrative without awkward keyword stuffing.\n"
            f"=======================================================\n"
        )

    human_rules = get_human_tone_system_rules() if enforce_human_tone else ""

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
{compulsory_str}

{human_rules}

CRITICAL EDITORIAL GUIDELINES (ANTI-PLAGIARISM & HUMAN-FIRST):
1. Ground facts and technical concepts in the provided reference materials, but COMPLETELY PARAPHRASE and re-synthesize the prose from scratch. Never copy 4+ word sequences verbatim from references.
2. Structure with a single # H1 Title, followed by clear ## H2 and ### H3 sections.
3. Write substantive, analytical paragraphs with concrete examples and bulleted takeaways. STRICTLY AVOID markdown pipe tables, grids, or '|---|' symbols—format all comparisons, contrasts, and trade-offs as clear narrative paragraphs or descriptive bullet points.
4. High Sentence Burstiness: Alternate dramatically between punchy 3-6 word sentences and 25-35 word descriptive compound sentences. Avoid robotic cadence.
5. Avoid generic filler cliches like "In today's fast-paced digital world", "Delve into", or "In conclusion". Begin with an immediate, high-value hook.
6. Include an FAQ section with 3 practical questions and authoritative answers near the end.
7. The final paragraph must NOT summarize. Conclude with a sharp, memorable parting shot and actionable next step CTA.
8. Use clean Markdown formatting (NO raw ASCII table pipe grids).

Produce the complete, fully written article now.
"""

