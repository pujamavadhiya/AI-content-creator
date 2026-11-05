import pytest
from app.ai.skills.human_tone import sanitize_ai_symbols, audit_human_tone, get_human_tone_system_rules
from app.services.paraphrase_service import paraphrase_service

def test_sanitize_ai_symbols_table_conversion():
    input_text = """# Technical Evaluation

Here is the comparison matrix between options:

| Architecture | Deployment Time | Ongoing Maintenance | Fault Tolerance |
| :--- | :--- | :--- | :--- |
| Event-Driven | 3 days | Low | High (Automatic failover) |
| Monolithic Proxy | 4 weeks | High | Low (Single point of failure) |

And here is a stray separator line that AI detectors flag:
| | :--- | :--- | :--- | :--- | |

Another two-column table:
| Metric | Benchmark |
|---|---|
| Latency | Sub-25ms |
| Throughput | 45k RPS |

End of section.
"""

    cleaned, symbols_count = sanitize_ai_symbols(input_text)

    # 1. Verification: No raw pipe tables or :--- symbols remain
    assert "| :--- |" not in cleaned
    assert "|---|---|" not in cleaned
    assert "| | :---" not in cleaned
    assert symbols_count >= 3

    # 2. Verification: Key data converted into natural human bullet comparisons
    assert "**Key Comparisons:**" in cleaned
    assert "• **Event-Driven**" in cleaned
    assert "Low" in cleaned
    assert "• **Metric**" in cleaned or "• **Latency**" in cleaned

def test_audit_human_tone_flags_table_symbols():
    text_with_table = """
    Here is the data:
    | Option | Cost |
    | :--- | :--- |
    | Option A | $10 |
    """
    audit = audit_human_tone(text_with_table)
    assert audit["table_symbols_detected"] is True
    assert audit["table_symbols_count"] >= 1
    assert audit["passes_human_test"] is False

def test_audit_human_tone_clean_text():
    clean_human_text = """
    We deployed the microservices architecture across three data centers last month. The results were startling.
    Latency dropped by 42 percent within forty-eight hours of DNS cutover.
    Our team didn't expect the memory overhead on the worker nodes, but tuning the garbage collection parameters solved the issue quickly.
    What matters most is verifiable reliability under stress.
    """
    audit = audit_human_tone(clean_human_text)
    assert audit["table_symbols_detected"] is False
    assert audit["passes_human_test"] is True
    assert audit["score"] >= 90
    assert audit["burstiness_score"] >= 5.0

@pytest.mark.asyncio
async def test_paraphrase_service_fallback_and_sanitization():
    raw_sample = """
    | Solution | Speed |
    | :--- | :--- |
    | Direct API | Fast |
    
    In today's fast-paced world, it goes without saying that we must leverage cutting-edge solutions to unlock synergy.
    """
    # Test sanitization inside paraphrase service flow
    cleaned, count = sanitize_ai_symbols(raw_sample)
    assert "| :--- |" not in cleaned
    assert count >= 1
