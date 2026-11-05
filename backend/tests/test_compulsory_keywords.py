import pytest
from app.ai.skills.skill_registry import skill_registry
from app.ai.prompts.blog_generation import get_blog_generation_prompt
from app.services.pipeline_service import pipeline_service

def test_compulsory_keywords_system_prompt():
    prompt = skill_registry.assemble_system_prompt(
        skill_name_or_alias="draft",
        project_context={
            "compulsory_keywords": "Autonomous Agent Swarms\nDeterministic Fallbacks\nReal-World Latency",
            "word_count": 1200,
        }
    )
    assert "<compulsory_keywords>" in prompt
    assert "CRITICAL REQUIREMENT - MANDATORY KEYWORDS (COMPULSORY)" in prompt
    assert "- Autonomous Agent Swarms" in prompt
    assert "- Deterministic Fallbacks" in prompt
    assert "- Real-World Latency" in prompt

def test_compulsory_keywords_user_message():
    user_msg = skill_registry.assemble_user_message(
        request="Write an architecture guide",
        compulsory_keywords=["Autonomous Agent Swarms", "Deterministic Fallbacks"]
    )
    assert "<compulsory_keywords_reminder>" in user_msg
    assert "Autonomous Agent Swarms" in user_msg
    assert "Deterministic Fallbacks" in user_msg

def test_compulsory_keywords_in_blog_prompt():
    prompt = get_blog_generation_prompt(
        title="Modern AI Architectures",
        outline_data=None,
        brand_voice="Sharp & Authoritative",
        writing_tone="Direct",
        target_audience="Engineers",
        desired_word_count=1500,
        cta_style="Contact us",
        restricted_words=[],
        preferred_keywords=["AI"],
        compulsory_keywords=["Subagent Coordination", "Zero-Shot Transfer"]
    )
    assert "CRITICAL REQUIREMENT - COMPULSORY KEYWORDS" in prompt
    assert "- Subagent Coordination" in prompt
    assert "- Zero-Shot Transfer" in prompt

def test_compulsory_keywords_audit_calculation():
    # Simulate content containing some keywords and missing others
    text = "We implement Autonomous Agent Swarms with minimal Real-World Latency in production."
    compulsory_list = ["Autonomous Agent Swarms", "Real-World Latency", "Deterministic Fallbacks"]
    
    found = [k for k in compulsory_list if k.lower() in text.lower()]
    missing = [k for k in compulsory_list if k.lower() not in text.lower()]
    
    assert "Autonomous Agent Swarms" in found
    assert "Real-World Latency" in found
    assert "Deterministic Fallbacks" in missing
    assert len(found) == 2
    assert len(missing) == 1
    assert round((len(found) / len(compulsory_list)) * 100, 1) == 66.7

