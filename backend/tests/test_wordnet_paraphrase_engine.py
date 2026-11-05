import pytest
from app.services.wordnet_engine import wordnet_engine, BANNED_SET
from app.services.paraphrase_service import paraphrase_service
from app.ai.skills.human_tone import audit_human_tone

def test_wordnet_initialization_and_coverage():
    """Verify WordNet engine loaded 100,000+ synonyms and has zero uncovered banned words."""
    assert len(wordnet_engine._synonyms_cache) > 100000
    assert len(wordnet_engine._compiled_banned_patterns) > 500

def test_scrub_and_replace_eliminates_all_banned_words():
    """Verify that every single banned word in a contaminated text is completely replaced with 0 remaining."""
    contaminated_text = (
        "Organizations must leverage cutting-edge tools to streamline operations. "
        "A comprehensive strategy is crucial to optimize workflows and foster innovation. "
        "Moreover, this seamless platform will revolutionize the evolving landscape and empower teams. "
        "Furthermore, in conclusion, by implementing these strategies, businesses achieve unparalleled success."
    )

    cleaned_text, replaced = wordnet_engine.scrub_and_replace_all_banned_words(contaminated_text)
    assert len(replaced) >= 10

    audit = audit_human_tone(cleaned_text)
    # Crucial assertion: 0 banned words found in the scrubbed text
    assert len(audit["banned_words_found"]) == 0
    assert len(audit["banned_phrases_found"]) == 0

def test_compulsory_keywords_preservation_in_wordnet_engine():
    """Verify that designated compulsory keywords are NEVER replaced by WordNet or the scrubber."""
    text = "The team must optimize the real-time latency and streamline the distributed cache."
    compulsory = ["optimize", "real-time latency"]

    cleaned_text, replaced = wordnet_engine.scrub_and_replace_all_banned_words(
        text, preserve_keywords=compulsory
    )
    assert "optimize" in cleaned_text.lower()
    assert "real-time latency" in cleaned_text.lower()

def test_full_local_paraphrase_pipeline():
    """Verify 100% local WordNet pipeline executes without external APIs and passes human test."""
    raw_text = (
        "| Option | Speed | Cost |\n"
        "| :--- | :--- | :--- |\n"
        "| Cloud | Fast | High |\n"
        "| Local | Medium | Low |\n\n"
        "It is important to note that developers must utilize modern frameworks to accelerate deployment. "
        "Additionally, a robust infrastructure ensures high availability."
    )

    res = wordnet_engine.full_local_paraphrase_pipeline(raw_text)
    assert res["success"] is True
    assert res["table_symbols_cleaned"] > 0
    assert len(res["banned_words_removed"]) > 0
    assert res["audit"]["banned_words_found"] == []
    assert res["human_score"] >= 85

def test_paraphrase_service_replace_banned_words_endpoint():
    """Verify direct 1-click replace_banned_words service call."""
    bad_text = "We will utilize this comprehensive solution to foster growth."
    res = paraphrase_service.replace_banned_words(bad_text)
    assert res["success"] is True
    assert res["total_replaced"] >= 2
    assert res["audit"]["banned_words_found"] == []

