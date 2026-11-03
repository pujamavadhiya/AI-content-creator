from typing import Optional

def get_content_evaluation_prompt(
    content_text: str,
    platform: str,
    brand_voice: str,
    reference_context: Optional[str] = None
) -> str:
    ref_str = f"\nAuthoritative Reference Material Context:\n---\n{reference_context}\n---" if reference_context else "No reference collection attached."

    return f"""You are an objective Chief Content Quality Evaluator and Fact-Checker.
Evaluate the following content across 12 specific quality dimensions.

Platform: {platform}
Brand Voice Requirement: {brand_voice}
{ref_str}

Content to Evaluate:
---
{content_text}
---

CRITICAL EVALUATION RULES:
1. Compare factual statements strictly against the provided reference material.
2. Flag any claims that lack factual grounding as "unsupported_claims".
3. Do not invent simulated originality numbers; measure conceptual overlap honestly.
4. Score each of the 12 dimensions from 0 to 10 (decimal allowed).
5. Compute overall_score out of 100.

Return ONLY a valid JSON object matching this schema:
{{
  "overall_score": 88.5,
  "dimension_scores": {{
    "reference_relevance": 9.0,
    "factual_accuracy": 8.5,
    "tone_consistency": 9.0,
    "brand_consistency": 9.0,
    "readability": 9.5,
    "seo_optimization": 8.5,
    "keyword_relevance": 8.5,
    "content_structure": 9.0,
    "audience_relevance": 9.0,
    "originality_similarity": 8.5,
    "cta_effectiveness": 8.0,
    "platform_compliance": 9.5
  }},
  "issues_identified": [
    "Specific issue or weak assertion 1",
    "Specific issue 2"
  ],
  "suggested_improvements": [
    "Concrete actionable recommendation 1",
    "Concrete actionable recommendation 2"
  ],
  "unsupported_claims": [
    "Specific statement in text that was not confirmed by reference data"
  ],
  "missing_information": [
    "Key topic or nuance from references omitted in content"
  ]
}}
Output ONLY valid JSON.
"""

def get_content_improvement_prompt(
    current_content: str,
    evaluation_issues: list[str],
    evaluation_improvements: list[str],
    unsupported_claims: list[str],
    brand_voice: str
) -> str:
    issues_str = "\n".join(f"- {i}" for i in evaluation_issues)
    improvements_str = "\n".join(f"- {i}" for i in evaluation_improvements)
    unsupported_str = "\n".join(f"- {i}" for i in unsupported_claims)

    return f"""You are an elite Editor-in-Chief. Revise and enhance the following content to resolve all identified quality audit issues.

Brand Voice: {brand_voice}

Issues to fix:
{issues_str}

Actionable improvements to implement:
{improvements_str}

Unsupported claims to verify, qualify, or replace with accurate insights:
{unsupported_str}

Original Content:
---
{current_content}
---

Output the complete improved content directly, maintaining its original topic, formatting, and structural integrity while fixing all flaws.
"""

