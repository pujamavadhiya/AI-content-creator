"""
Skill 4: SERP Gap Research Engine
Performs deep competitive SERP gap analysis across 5 target keywords,
extracts missing angles, credible statistics, hard numbers, PAA queries, and generates a research .docx file.
"""

from typing import Dict, Any, List, Optional
import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def get_serp_gap_research_prompt(
    keywords: List[str],
    niche: str,
    content_type: str = "blog",
    intent_preference: str = "mixed",
    language: str = "English"
) -> str:
    kw_str = ", ".join(keywords[:5])
    return f"""You are a Senior Digital Marketing Engineer and SERP Gap Strategist.
Conduct an in-depth competitive SERP gap teardown across these 5 keywords:
Keywords: {kw_str}
Niche/Industry: {niche}
Content Purpose: {content_type}
Question Intent: {intent_preference}
Language: {language}

Your mission is to produce a research document that is more specific, useful, and data-dense than all top ranking competitors combined.

CRITICAL RESEARCH PHASES:
1. SERP Competitor Landscape: Analyze top 5 ranking angles per keyword.
2. Cross-Result Analysis:
   - Common Ground: What all or most competitors cover.
   - Unique to Each: Angles specific to individual URLs.
   - The Gap (What NONE of them cover): Overlooked subtopics, missing recent developments, searcher questions left unanswered.
   - Vague or Generic Content: Superficial advice competitors copy-paste that needs real depth.
3. Unique Additions & Hard Data:
   - 3 Real Statistics directly related to the keywords with Source Name, Source URL, and Year.
   - 3 Real Numbers (market sizes, user counts, benchmark data) with Source Name and URL.
4. People Also Ask (10-12 real, non-filler questions with search intent tags and rationale).
5. AI Overview Summary: A high-density summary in UNDER 50 WORDS capturing the core topic and low-competition semantic keywords.

Return ONLY a valid JSON object matching this schema:
{{
  "niche": "{niche}",
  "keywords": {keywords[:5]},
  "ai_overview_summary": "Under 50 words dense summary...",
  "competitor_landscape": [
    {{"keyword": "{keywords[0] if keywords else 'Keyword'}", "rank": 1, "page_title": "Example Competitor Title", "url": "https://example.com/page", "brand": "Example Brand", "primary_angle": "Overview"}}
  ],
  "common_topics": [
    {{"topic": "Fundamental definition and business benefits", "frequency": "5/5 competitors"}},
    {{"topic": "Basic setup instructions", "frequency": "4/5 competitors"}}
  ],
  "unique_angles": [
    {{"brand_or_url": "Competitor A", "unique_coverage": "Proprietary ROI benchmark calculator"}}
  ],
  "content_gaps": [
    {{"gap_area": "Edge cases in distributed systems", "why_it_matters": "Real practitioners encounter this daily but top guides ignore it"}}
  ],
  "vague_generic_content_to_replace": [
    {{"competitor_claim": "Make sure to monitor your metrics regularly", "flaw": "Zero specific threshold metrics or tooling named", "how_we_fix": "Provide exact Prometheus/Grafana query patterns"}}
  ],
  "recommended_unique_additions": [
    {{"addition": "Step-by-step failure recovery playbook", "source_rationale": "Direct engineer community demand"}}
  ],
  "statistics": [
    {{"stat": "73% of enterprises prioritize RAG over fine-tuning", "source_name": "Gartner Enterprise AI Survey", "source_url": "https://gartner.com", "year": "2025"}}
  ],
  "hard_numbers": [
    {{"number": "$1.3 Trillion estimated generative AI market", "metric_type": "Market Size", "source_name": "Bloomberg Intelligence", "source_url": "https://bloomberg.com"}}
  ],
  "people_also_ask": [
    {{"question": "What is the difference between X and Y?", "intent": "Informational", "source_or_rationale": "High PAA frequency"}}
  ]
}}
Output ONLY valid JSON.
"""

def generate_serp_gap_docx(data: Dict[str, Any]) -> io.BytesIO:
    """Generates a professional .docx research document for SERP Gap findings."""
    doc = Document()
    
    # Title
    title_p = doc.add_paragraph()
    title_run = title_p.add_run(f"SERP Gap Research: {data.get('niche', 'Target Niche')}")
    title_run.font.size = Pt(22)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)
    
    # Metadata
    doc.add_paragraph(f"Keywords Researched: {', '.join(data.get('keywords', []))}")
    doc.add_paragraph("Prepared by: Sevencore AI - SERP Gap Research Specialist\n")
    
    # Section 1: AI Overview Summary
    doc.add_heading("1. AI Overview Summary (Sub-50 Words)", level=1)
    p_ai = doc.add_paragraph(data.get("ai_overview_summary", "Summary not available."))
    p_ai.style = "Intense Quote"
    
    # Section 2: SERP Competitor Landscape
    doc.add_heading("2. SERP Competitor Landscape", level=1)
    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'
    hdr = table.rows[0].cells
    hdr[0].text = "Keyword"
    hdr[1].text = "Rank"
    hdr[2].text = "Title"
    hdr[3].text = "Brand / Angle"
    
    for comp in data.get("competitor_landscape", []):
        row = table.add_row().cells
        row[0].text = str(comp.get("keyword", ""))
        row[1].text = f"#{comp.get('rank', 1)}"
        row[2].text = str(comp.get("page_title", ""))
        row[3].text = f"{comp.get('brand', '')} ({comp.get('primary_angle', '')})"
        
    # Section 3: Content Gaps (What Nobody Covers)
    doc.add_heading("3. High-Value Content Gaps (What Nobody Covers)", level=1)
    for gap in data.get("content_gaps", []):
        p = doc.add_paragraph(style='List Bullet')
        p.add_run(f"{gap.get('gap_area', '')}: ").bold = True
        p.add_run(gap.get('why_it_matters', ''))
        
    # Section 4: Vague & Generic Advice to Replace
    doc.add_heading("4. Generic Competitor Advice to Replace", level=1)
    for v in data.get("vague_generic_content_to_replace", []):
        p = doc.add_paragraph(style='List Bullet')
        p.add_run(f"Competitor Claim: \"{v.get('competitor_claim', '')}\"\n")
        p.add_run(f"Why it's weak: {v.get('flaw', '')}\n")
        p.add_run(f"Our Deep Fix: {v.get('how_we_fix', '')}").bold = True
        
    # Section 5: Real Statistics & Hard Numbers
    doc.add_heading("5. Verified Statistics & Hard Numbers", level=1)
    for s in data.get("statistics", []):
        p = doc.add_paragraph(style='List Bullet')
        p.add_run(f"{s.get('stat', '')} ").bold = True
        p.add_run(f"Source: {s.get('source_name', '')} ({s.get('year', '')}) — {s.get('source_url', '')}")
        
    for n in data.get("hard_numbers", []):
        p = doc.add_paragraph(style='List Bullet')
        p.add_run(f"{n.get('metric_type', '')}: {n.get('number', '')} ").bold = True
        p.add_run(f"Source: {n.get('source_name', '')} — {n.get('source_url', '')}")
        
    # Section 6: People Also Ask (10-12 Questions)
    doc.add_heading("6. People Also Ask (Search Intent Questions)", level=1)
    for i, q in enumerate(data.get("people_also_ask", []), 1):
        p = doc.add_paragraph()
        p.add_run(f"{i}. {q.get('question', '')} ").bold = True
        p.add_run(f"[{q.get('intent', 'General')}] — Rationale: {q.get('source_or_rationale', '')}")

    output_stream = io.BytesIO()
    doc.save(output_stream)
    output_stream.seek(0)
    return output_stream
