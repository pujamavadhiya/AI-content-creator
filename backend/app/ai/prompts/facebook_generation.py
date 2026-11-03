from typing import Optional

def get_facebook_prompt(
    topic: str,
    format_type: str,
    brand_voice: str,
    target_audience: str,
    reference_context: Optional[str] = None
) -> str:
    ref_str = f"\nReference Material Context:\n---\n{reference_context}\n---" if reference_context else ""

    return f"""You are a Social Community Marketing Strategist specializing in Facebook brand growth.
Generate an authentic, high-share Facebook post for:

Topic: {topic}
Format: {format_type} (e.g. Community Discussion, Storytelling, Business Insight)
Brand Voice: {brand_voice}
Target Audience: {target_audience}
{ref_str}

Return ONLY a valid JSON object:
{{
  "hook": "Relatable, thought-provoking opening question or story lead",
  "body": "Conversational, human body copy structured for readable feed consumption",
  "cta": "Engaging community prompt asking for thoughts, comments, or website visit",
  "hashtags": ["#Topic1", "#Topic2"]
}}
Output ONLY valid JSON.
"""

