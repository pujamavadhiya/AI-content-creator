from typing import Optional

def get_twitter_prompt(
    topic: str,
    format_type: str,
    tweets_count: int,
    brand_voice: str,
    reference_context: Optional[str] = None
) -> str:
    ref_str = f"\nReference Material Context:\n---\n{reference_context}\n---" if reference_context else ""

    return f"""You are an elite Twitter/X Ghostwriter specializing in viral educational threads and punchy insights.

Topic: {topic}
Format: {format_type} (e.g. Thread, Single Tweet Insight, Breakdown)
Desired Thread Length: {tweets_count} tweets
Brand Voice: {brand_voice}
{ref_str}

RULES:
- Each tweet must be strictly UNDER 280 characters.
- Tweet 1 must be an irresistible hook promising clear ROI.
- Supporting tweets provide crisp, data-backed frameworks or takeaways.
- Final tweet summarizes key takeaway and provides a clean CTA.

Return ONLY a valid JSON object:
{{
  "single_tweet": "Standalone punchy tweet under 280 characters with hashtags",
  "thread": [
    {{
      "tweet_number": 1,
      "text": "Hook tweet 1/X under 280 chars"
    }},
    {{
      "tweet_number": 2,
      "text": "Point 1 with practical detail under 280 chars"
    }}
  ],
  "cta": "Follow for more insights & repost tweet #1",
  "hashtags": ["#Topic1", "#Topic2"]
}}
Output ONLY valid JSON.
"""
