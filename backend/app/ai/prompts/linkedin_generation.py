from typing import Optional

def get_linkedin_prompt(
    topic: str,
    format_type: str,
    brand_voice: str,
    target_audience: str,
    cta_style: str,
    reference_context: Optional[str] = None
) -> str:
    ref_str = f"\nReference Material Context:\n---\n{reference_context}\n---" if reference_context else ""

    return f"""You are a Top LinkedIn Content Strategist and Ghostwriter for Fortune 500 Executives.
Generate an engaging, high-conversion LinkedIn post for the following:

Topic: {topic}
Format: {format_type} (e.g. Thought Leadership, Educational Breakdown, Contrarian Perspective, Carousel Script, Case Story)
Brand Voice: {brand_voice}
Target Audience: {target_audience}
CTA Objective: {cta_style}
{ref_str}

Return ONLY a valid JSON object matching this structure:
{{
  "hook": "First 1-2 lines that stop the scroll and earn the 'see more' click",
  "body": "The full post text with short paragraphs, whitespace, bulleted insights, and human narrative tone",
  "cta": "Engaging final discussion question or call-to-action",
  "hashtags": ["#Topic1", "#Topic2", "#Topic3"],
  "visual_concept": "Detailed recommendation for accompanying image, diagram, or carousel style"
}}
Output ONLY valid JSON.
"""
