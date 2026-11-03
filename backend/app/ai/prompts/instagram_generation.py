from typing import Optional

def get_instagram_prompt(
    topic: str,
    format_type: str,
    slides_count: int,
    brand_voice: str,
    target_audience: str,
    reference_context: Optional[str] = None
) -> str:
    ref_str = f"\nReference Material Context:\n---\n{reference_context}\n---" if reference_context else ""

    return f"""You are a Lead Instagram Creative Strategist.
Create high-retention Instagram content optimized for visual engagement and saves.

Topic: {topic}
Format: {format_type} (e.g. Carousel Script, Reels Script, Educational Caption)
Desired Slides (if carousel): {slides_count}
Brand Voice: {brand_voice}
Target Audience: {target_audience}
{ref_str}

Return ONLY a valid JSON object matching this structure:
{{
  "hook": "Strong text hook for image 1 or video start",
  "caption": "Full rich Instagram caption with line breaks and emoji accents",
  "slides": [
    {{
      "slide_number": 1,
      "headline": "Slide Headline",
      "body": "Bite-sized slide text (under 30 words)",
      "visual_note": "Visual design and iconography direction"
    }}
  ],
  "reel_script": {{
    "visual_action": "On-screen motion/b-roll description",
    "voiceover": "Concise spoken narrative (30-45 seconds)",
    "on_screen_text": "Key text overlays"
  }},
  "cta": "Save this post for later & link in bio",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "visual_concept": "Color palette, imagery style, and aesthetic guidelines"
}}
Output ONLY valid JSON.
"""

