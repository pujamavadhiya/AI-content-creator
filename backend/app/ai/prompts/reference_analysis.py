def get_reference_analysis_prompt(document_text: str, filename: str) -> str:
    return f"""You are a Senior Content Intelligence Analyst. Analyze the following reference document thoroughly to extract actionable intelligence for content generation.

Document Filename: {filename}
Document Content:
---
{document_text[:12000]}
---

Return ONLY a valid JSON object strictly matching this schema:
{{
  "main_subject": "Primary subject of the document (1-2 sentences)",
  "key_themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"],
  "main_arguments": ["Argument 1", "Argument 2", "Argument 3"],
  "important_facts": ["Fact 1 with data/context", "Fact 2", "Fact 3", "Fact 4"],
  "important_entities": ["Entity/Tool/Company/Framework 1", "Entity 2"],
  "industry_terminology": ["Term 1: definition", "Term 2: definition"],
  "primary_keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
  "secondary_keywords": ["Keyword 4", "Keyword 5", "Keyword 6", "Keyword 7"],
  "search_intent": "Informational / Commercial / Transactional",
  "target_audience": "Primary target audience persona",
  "writing_tone": "e.g. Technical, Authoritative, Analytical, Conversational",
  "content_structure": ["Section 1 description", "Section 2 description"],
  "recurring_topics": ["Topic 1", "Topic 2"],
  "knowledge_gaps": ["Gap or unanswered question 1", "Gap 2"],
  "content_opportunities": ["High-value content opportunity 1", "Opportunity 2", "Opportunity 3"]
}}
Do not include any explanation outside the JSON object.
"""

