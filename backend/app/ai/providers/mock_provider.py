from typing import Optional, List, Dict, Any
from app.ai.providers.base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    """Mock AI Provider strictly for unit testing and deterministic offline verification."""

    def __init__(self, model_name: str = "mock-model"):
        self.model_name = model_name

    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        system_instruction: Optional[str] = None
    ) -> str:
        p_lower = prompt.lower()
        if "article" in p_lower or "blog" in p_lower:
            return """# The Definitive Guide to AI Content Intelligence

## 1. Executive Overview
AI-powered content intelligence revolutionizes modern marketing workflows by grounding every generated paragraph in verifiable reference materials.

## 2. Core Architecture and Methodology
By combining dense vector embeddings with metadata filtering, organizations ensure factual accuracy across all multi-channel content pipelines.

### Key Implementation Principles
- Semantic grounding in primary source documents
- Strict isolation across organizational tenants
- Multi-dimensional quality auditing prior to publishing

## 3. Practical Enterprise Applications
Organizations deploying reference-based generation see measurable increases in audience engagement, organic rankings, and cross-platform consistency.

## 4. Frequently Asked Questions
**Q: How does reference grounding prevent hallucinations?**
A: By constraining context retrieval to validated corporate documents and explicitly flagging external extrapolations.

**Q: Can this scale across global marketing teams?**
A: Yes, multi-tenant RBAC and centralized brand voice guidelines ensure uniform excellence.

## 5. Strategic Conclusion
Reference-driven intelligence transforms generic AI copy into authoritative industry leadership."""
        elif "revise" in p_lower or "improved content" in p_lower:
            return """# The Enhanced Guide to AI Content Intelligence

## 1. Strategic Foundation
AI-powered content intelligence systematically grounds all generated assets in verifiable company references.

## 2. Technical Validation & Quality
Every claim is audited against reference chunks to guarantee absolute factual compliance."""
        return "Mock generated text response for testing purposes."

    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        p_lower = prompt.lower()

        # 1. Reference Document Analysis
        if "senior content intelligence analyst" in p_lower or "reference analysis" in p_lower or "document filename" in p_lower:
            return {
                "main_subject": "AI-Powered Content Strategy & Reference-Driven Generation",
                "key_themes": ["Content Intelligence", "RAG Architecture", "Brand Consistency", "Multi-Platform Distribution"],
                "main_arguments": ["Grounding content in references prevents hallucinations", "Multi-tenancy guarantees enterprise security"],
                "important_facts": ["RAG reduces hallucination rates by over 80%", "Automated 12-factor quality audits improve output depth"],
                "important_entities": ["FastAPI", "Next.js", "Qdrant", "PostgreSQL"],
                "industry_terminology": ["RAG: Retrieval Augmented Generation", "Dense Embeddings: High-dimensional semantic vectors"],
                "primary_keywords": ["content intelligence", "ai content generation", "rag content"],
                "secondary_keywords": ["seo content intelligence", "brand voice ai", "social media studio"],
                "search_intent": "Informational",
                "target_audience": "Enterprise marketing directors and content creators",
                "writing_tone": "Authoritative and Strategic",
                "content_structure": ["Introduction to RAG", "Methodology", "Quality Auditing", "Implementation"],
                "recurring_topics": ["Vector search", "Fact checking", "Quality evaluation"],
                "knowledge_gaps": ["Specific API latency benchmarks on edge devices"],
                "content_opportunities": ["Step-by-step implementation guide for marketing agencies"]
            }

        # 2. Content Outline Generation
        elif "content architect" in p_lower or "headings_hierarchy" in p_lower or "outline" in p_lower:
            return {
                "title": "The Strategic Blueprint for Reference-Driven Content Intelligence",
                "seo_title_suggestions": ["Reference-Driven Content Intelligence Blueprint", "How to Build RAG Content Systems"],
                "primary_keyword": "content intelligence",
                "secondary_keywords": ["rag generation", "ai marketing"],
                "search_intent": "Informational",
                "target_audience": "Marketing Leaders",
                "content_objective": "Comprehensive educational authority guide",
                "meta_title": "Content Intelligence Blueprint | Sevencore AI",
                "meta_description": "Learn how reference-driven content generation eliminates hallucinations and scales enterprise publishing.",
                "url_slug_suggestion": "reference-driven-content-intelligence-blueprint",
                "introduction_structure": "Hook with industry problem -> agitated pain of hallucinated copy -> solution overview",
                "h1_heading": "The Strategic Blueprint for Reference-Driven Content Intelligence",
                "headings_hierarchy": [
                    {
                        "h2": "1. Why Generic AI Content Fails Enterprise Standards",
                        "h3": ["The Hallucination Dilemma", "Brand Voice Drift"],
                        "points": ["Generic LLMs lack company domain facts", "Brand guidelines must be programmatic"]
                    },
                    {
                        "h2": "2. The Reference-Driven Pipeline: From Ingest to Publish",
                        "h3": ["Semantic Chunking", "Hybrid Vector Retrieval"],
                        "points": ["Isolating reference context", "Traceable factual citations"]
                    }
                ],
                "suggested_examples": ["Agency saving 40 hours weekly on client research"],
                "faqs": [
                    {
                        "q": "How does vector search differ from keyword search?",
                        "a_outline": "Vector search captures semantic intent rather than literal matches."
                    }
                ],
                "conclusion_structure": "Summary of 3 key takeaways and forward outlook",
                "cta": "Explore the Sevencore Content Intelligence Platform today",
                "internal_links_suggested": ["/blog/rag-architecture-guide"],
                "supporting_references": ["Reference knowledge base"]
            }

        # 3. Topic Generation & Clustering
        elif "chief content strategist" in p_lower or "content format" in p_lower or "topic ideas" in p_lower:
            return [
                {
                    "title": "The Strategic Blueprint for Reference-Driven Content Intelligence",
                    "description": "How modern marketing teams leverage verified reference documents to eliminate AI hallucinations.",
                    "primary_keyword": "content intelligence",
                    "secondary_keywords": ["rag generation", "ai marketing"],
                    "search_intent": "Informational",
                    "target_audience": "Marketing Leaders",
                    "content_angle": "Technical Rigor vs Generic AI",
                    "content_format": "How-to Guide",
                    "suggested_cta": "Request an Enterprise Architecture Review",
                    "relevance_score": 0.96,
                    "supporting_reference_info": "Grounding reference context",
                    "recommended_platform": "Blog"
                }
            ]

        # 4. Topic Clustering
        elif "seo architect" in p_lower or "topic clusters" in p_lower:
            return [
                {
                    "cluster_name": "RAG Content Architecture",
                    "pillar_topic_title": "The Strategic Blueprint for Reference-Driven Content Intelligence",
                    "supporting_topic_titles": [],
                    "related_keywords": ["rag", "content intelligence"],
                    "internal_linking_strategy": "Direct inter-linking between technical subtopics"
                }
            ]

        # 5. Keyword Research
        elif "seo strategist" in p_lower or "keyword researcher" in p_lower or "10 strategic categories" in p_lower:
            return [
                {
                    "keyword": "content intelligence platform",
                    "category": "primary",
                    "search_intent": "informational",
                    "relevance_score": 0.98,
                    "related_topic": "AI Marketing Systems",
                    "suggested_content_type": "In-depth Guide",
                    "supporting_reference": "Grounding documents"
                },
                {
                    "keyword": "reference driven content generation",
                    "category": "long-tail",
                    "search_intent": "commercial",
                    "relevance_score": 0.92,
                    "related_topic": "RAG Systems",
                    "suggested_content_type": "Comparison Article",
                    "supporting_reference": "Grounding documents"
                }
            ]

        # 6. Social Media
        elif "linkedin" in p_lower:
            return {
                "hook": "Most AI content tools generate generic fluff. Here's how to fix it:",
                "body": "When you generate content without reference material, you get average results.\n\nGrounding AI in verified documents changes everything:\n- 0% fabricated claims\n- 100% brand tone consistency\n- Actionable takeaways for decision makers.",
                "cta": "How are you grounding AI in your marketing stack?",
                "hashtags": ["#ContentIntelligence", "#AIStrategy", "#MarketingOperations"],
                "visual_concept": "Clean 2x2 comparison matrix: Generic AI vs Reference-Grounded AI"
            }
        elif "instagram" in p_lower:
            return {
                "hook": "Stop posting ungrounded AI content.",
                "caption": "Why reference-driven intelligence wins every time. #ContentCreation #AI",
                "slides": [{"slide_number": 1, "headline": "The Grounding Advantage", "body": "Facts matter.", "visual_note": "Minimal dark design"}],
                "reel_script": {"visual_action": "Demoing RAG pipeline", "voiceover": "Here is why references change everything.", "on_screen_text": "Zero Hallucinations"},
                "cta": "Save this guide for later",
                "hashtags": ["#AIContent", "#MarketingTips"],
                "visual_concept": "Sleek dark mode graphics"
            }
        elif "facebook" in p_lower:
            return {
                "hook": "Are your marketing articles getting lost in the AI noise?",
                "body": "Discover how grounding every piece of content in real research separates industry leaders from generic bloggers.",
                "cta": "What's your biggest content challenge this quarter?",
                "hashtags": ["#DigitalMarketing", "#BusinessGrowth"]
            }
        elif "twitter" in p_lower or "thread" in p_lower:
            return {
                "single_tweet": "Most AI content fails because it lacks grounding in real domain knowledge. Fix that, and you dominate search & social.",
                "thread": [
                    {"tweet_number": 1, "text": "1/5 Most AI content fails because it lacks reference grounding. Here is the 2026 playbook:"},
                    {"tweet_number": 2, "text": "2/5 Ingest your whitepapers, blogs, and datasheets into a vector database."},
                    {"tweet_number": 3, "text": "3/5 Retrieve relevant context at generation time to eliminate factual errors."},
                    {"tweet_number": 4, "text": "4/5 Audit with a 12-factor quality check before scheduling."},
                    {"tweet_number": 5, "text": "5/5 Result: 10x output speed, 0% hallucinated claims. Follow for more insights!"}
                ],
                "cta": "Retweet to share with your network",
                "hashtags": ["#AIContent", "#TechTrends"]
            }

        # 7. Quality Evaluation
        elif "quality" in p_lower or "evaluat" in p_lower:
            return {
                "overall_score": 92.0,
                "dimension_scores": {
                    "reference_relevance": 9.5,
                    "factual_accuracy": 9.0,
                    "tone_consistency": 9.2,
                    "brand_consistency": 9.0,
                    "readability": 9.4,
                    "seo_optimization": 9.1,
                    "keyword_relevance": 9.0,
                    "content_structure": 9.5,
                    "audience_relevance": 9.2,
                    "originality_similarity": 9.0,
                    "cta_effectiveness": 8.8,
                    "platform_compliance": 9.5
                },
                "issues_identified": ["Minor technical jargon could be simplified for entry-level readers"],
                "suggested_improvements": ["Add a visual architecture flowchart or bulleted summary in section 2"],
                "unsupported_claims": [],
                "missing_information": ["Could mention open-source embedding model comparisons"]
            }
        
        return {"status": "success", "mock_data": True}

    async def generate_embedding(self, text: str) -> List[float]:
        return [0.05] * 768

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "provider": "mock",
            "success": True,
            "message": "Mock AI Provider is operational for offline testing",
            "model": self.model_name
        }
