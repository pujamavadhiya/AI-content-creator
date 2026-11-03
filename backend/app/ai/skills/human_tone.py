"""
Skill 1: Human-Tone Content Writer & Auditor
Produces and verifies text indistinguishable from an opinionated, sharp human expert.
Eliminates banned vocabulary, robotic cadence, and AI symmetry.
"""

import re
from typing import Dict, Any, List
from app.ai.skills.banned_vocabulary import (
    BANNED_VERBS, BANNED_ADJECTIVES, BANNED_TRANSITIONS,
    BANNED_PHRASES, UNCONTRACTED_FORMS, HUMAN_REPLACEMENTS
)

def get_human_tone_system_rules() -> str:
    """Returns the strict system instructions governing human-tone writing."""
    sample_banned_v = list(BANNED_VERBS)[:18]
    sample_banned_adj = list(BANNED_ADJECTIVES)[:18]
    sample_banned_trans = list(BANNED_TRANSITIONS)[:18]
    
    return f"""
HUMAN-TONE WRITER CONSTRAINTS (MANDATORY ANTI-AI RULES):
You must write text indistinguishable from a confident, sharp human writer. Zero AI tells permitted.

1. BANNED VOCABULARY BLACKLIST:
   - NEVER use corporate AI verbs (e.g. {', '.join(sample_banned_v)}, leverage, implement, streamline, optimize, harness).
   - NEVER use buzzword adjectives (e.g. {', '.join(sample_banned_adj)}, robust, seamless, cutting-edge, comprehensive, groundbreaking, holistic).
   - NEVER use robotic transitions (e.g. {', '.join(sample_banned_trans)}, moreover, furthermore, in conclusion, to sum up).
   - NEVER use cliche openers ("In today's fast-paced world", "In the digital age", "Let's dive in").
   - NEVER use filler constructions ("It is important to note", "It goes without saying", "Not only / but also").

2. SYNTAX & CADENCE (ANTI-AI SYMMETRY):
   - Mix very short punchy sentences (3-5 words) with longer ones. Sentence fragments are welcome.
   - Do NOT write triple-adjective lists (e.g., "fast, reliable, and easy").
   - Vary bullet points in length; never make every bullet identical in cadence.
   - Start in the middle of an argument with a bold claim, not a generic academic introduction.

3. TONAL ATTRIBUTES:
   - Expert Bias: Have an authentic point of view. Push back on common industry myths.
   - Always use contractions (don't, can't, won't, isn't, they're, we're, it's).
   - Drop specific numbers, real-world texture, and messy human observations.
   - Parting Shot: NEVER summarize or recap at the end. End with a sharp thought, sticky question, or a non-salesy challenge.
"""

def audit_human_tone(text: str) -> Dict[str, Any]:
    """
    Automated Audit Engine: Scans text for banned vocabulary, uncontracted words,
    opener/conclusion traps, and computes a Human-Tone Score.
    """
    if not text:
        return {
            "score": 100,
            "passes_human_test": True,
            "total_violations": 0,
            "banned_words_found": [],
            "banned_phrases_found": [],
            "uncontracted_forms_found": [],
            "cliche_opener_detected": False,
            "summary_conclusion_detected": False,
            "suggested_replacements": {}
        }

    lower_text = text.lower()
    words = re.findall(r"\b[a-z0-9\-]+\b", lower_text)
    
    banned_words_found = []
    suggested_replacements = {}
    
    # Check words
    for w in words:
        if w in BANNED_VERBS or w in BANNED_ADJECTIVES or w in BANNED_TRANSITIONS:
            if w not in banned_words_found:
                banned_words_found.append(w)
                if w in HUMAN_REPLACEMENTS:
                    suggested_replacements[w] = HUMAN_REPLACEMENTS[w]
                else:
                    suggested_replacements[w] = "Use plain, simpler conversational phrasing"

    # Check banned phrases
    banned_phrases_found = []
    for phrase in BANNED_PHRASES:
        if phrase in lower_text:
            banned_phrases_found.append(phrase)

    # Check uncontracted forms
    uncontracted_found = []
    for full_form, contraction in UNCONTRACTED_FORMS.items():
        pattern = r"\b" + re.escape(full_form) + r"\b"
        if re.search(pattern, lower_text):
            uncontracted_found.append(f"'{full_form}' -> use '{contraction}'")

    # Check Opener Trap (first 120 characters)
    first_snippet = lower_text[:150]
    cliche_opener = any(op in first_snippet for op in [
        "in today's", "in the digital age", "in this article", "whether you're", "let's dive in"
    ])

    # Check Conclusion Trap (last 250 characters)
    last_snippet = lower_text[-250:]
    summary_conclusion = any(con in last_snippet for con in [
        "in conclusion", "to sum up", "in summary", "to wrap up", "by implementing these strategies"
    ])

    total_violations = (
        len(banned_words_found) * 2 +
        len(banned_phrases_found) * 4 +
        len(uncontracted_found) +
        (10 if cliche_opener else 0) +
        (10 if summary_conclusion else 0)
    )

    score = max(0, 100 - total_violations)
    passes_test = len(banned_words_found) == 0 and len(banned_phrases_found) == 0 and not cliche_opener and not summary_conclusion

    return {
        "score": score,
        "passes_human_test": passes_test,
        "total_violations": len(banned_words_found) + len(banned_phrases_found) + len(uncontracted_found),
        "banned_words_found": banned_words_found[:20],
        "banned_phrases_found": banned_phrases_found,
        "uncontracted_forms_found": uncontracted_found[:10],
        "cliche_opener_detected": cliche_opener,
        "summary_conclusion_detected": summary_conclusion,
        "suggested_replacements": suggested_replacements
    }
