"""
Skill 1: Human-Tone Content Writer, Anti-Plagiarism Paraphraser & Auditor
Produces and verifies text indistinguishable from an opinionated, sharp human expert.
Eliminates banned vocabulary, robotic cadence, AI symmetry, and synthetic table grids (|---|).
"""

import re
import math
from typing import Dict, Any, List, Tuple
from app.ai.skills.banned_vocabulary import (
    BANNED_VERBS, BANNED_ADJECTIVES, BANNED_TRANSITIONS,
    BANNED_PHRASES, UNCONTRACTED_FORMS, HUMAN_REPLACEMENTS
)

def sanitize_ai_symbols(text: str) -> Tuple[str, int]:
    """
    Strips raw ASCII / Markdown table grids (e.g., '|:---|:---|' or '| col | col |')
    which AI detectors use as an instant synthetic fingerprint.
    Converts detected markdown tables into clean, natural human-readable bullet points
    or narrative contrasts, and strips any stray delimiter lines.
    Returns: (cleaned_text, number_of_symbols_cleaned)
    """
    if not text:
        return text, 0

    cleaned_count = 0
    lines = text.split("\n")
    new_lines = []
    i = 0
    n = len(lines)

    def is_separator(line_str: str) -> bool:
        s = line_str.strip()
        if not s:
            return False
        # Matches lines like '| :--- | :--- |' or '|---|---|' or ':--- | :---' or '| | :--- |'
        return bool(re.match(r"^\s*\|?[\s:\-]+\|[\s:\-|]+\|?\s*$", s) and "-" in s)

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # 1. Check if line looks like an orphan separator or pure pipe line (e.g. '| | :--- | :--- | :--- | :--- | |')
        if re.match(r"^\s*\|?[\s|:\-_]+\|?\s*$", stripped) and (":---" in stripped or "---" in stripped or stripped.count("|") >= 2):
            cleaned_count += 1
            i += 1
            continue

        # 2. Check if this line is a table header followed by a separator line
        if "|" in stripped and i + 1 < n and is_separator(lines[i + 1]):
            cleaned_count += 1
            raw_headers = [c.strip() for c in stripped.split("|") if c.strip()]
            i += 2  # Skip header and separator

            rows = []
            while i < n and "|" in lines[i] and not is_separator(lines[i]):
                row_cells = [c.strip() for c in lines[i].split("|") if c.strip()]
                if row_cells:
                    rows.append(row_cells)
                i += 1

            # Format rows as humanized bullet comparisons
            converted = ["**Key Comparisons:**"]
            for row in rows:
                if len(row) == 1:
                    converted.append(f"• {row[0]}")
                elif len(row) == 2 and len(raw_headers) >= 2:
                    converted.append(f"• **{row[0]}**: {row[1]}")
                elif len(row) >= 2:
                    item_name = row[0]
                    details = []
                    for h_idx, val in enumerate(row[1:], start=1):
                        hdr = raw_headers[h_idx] if h_idx < len(raw_headers) else f"Detail {h_idx}"
                        details.append(f"{hdr}: {val}")
                    converted.append(f"• **{item_name}**: {' — '.join(details)}")
            new_lines.extend(converted)
            continue

        # 3. Regular line: clean any inline stray pipe artifacts like '| | :--- |' or empty cell pipes
        if re.search(r"\|\s*:?-+:?\s*\|", line) or "| | :---" in line or "|---|" in line:
            cleaned_count += 1
            line = re.sub(r"\|\s*:?-+:?\s*\|?", "", line)
            line = re.sub(r"\|\s*\|", "", line)

        # 4. Strip stray orphan pipes at beginning or end of standard sentences
        if line.startswith("| ") or line.startswith(" |"):
            cleaned_count += 1
            line = line.lstrip(" |")
        if line.endswith(" |") or line.endswith(" | "):
            cleaned_count += 1
            line = line.rstrip(" |")

        new_lines.append(line)
        i += 1

    result = "\n".join(new_lines)
    return result, cleaned_count

def get_human_tone_system_rules() -> str:
    """Returns the strict system instructions governing human-tone and anti-plagiarism writing."""
    sample_banned_v = list(BANNED_VERBS)[:18]
    sample_banned_adj = list(BANNED_ADJECTIVES)[:18]
    sample_banned_trans = list(BANNED_TRANSITIONS)[:18]

    return f"""
HUMAN-TONE WRITER CONSTRAINTS (MANDATORY ANTI-AI & ANTI-PLAGIARISM RULES):
You must write text completely indistinguishable from a confident, sharp human writer. Zero AI tells or synthetic footprints permitted.

1. BANNED VOCABULARY & FILLER (AI TELLS):
   - NEVER use corporate AI verbs (e.g. {', '.join(sample_banned_v)}, leverage, implement, streamline, optimize, harness).
   - NEVER use buzzword adjectives (e.g. {', '.join(sample_banned_adj)}, robust, seamless, cutting-edge, comprehensive, groundbreaking, holistic).
   - NEVER use robotic transitions (e.g. {', '.join(sample_banned_trans)}, moreover, furthermore, in conclusion, to sum up).
   - NEVER use cliche openers ("In today's fast-paced world", "In the digital age", "Let's dive in", "In this article").
   - NEVER use filler constructions ("It is important to note", "It goes without saying", "Not only / but also").

2. BURSTINESS & RHYTHMIC CADENCE (ANTI-AI SYMMETRY):
   - Extreme sentence length variation is REQUIRED: Mix punchy 3 to 6 word sentences with 25 to 35 word descriptive compound sentences.
   - NEVER write three consecutive sentences of similar length or shape.
   - Do NOT write triple-adjective lists (e.g., "fast, reliable, and easy").
   - Paragraphs must be irregular: 1 to 3 sentences each. Never uniform 4-sentence blocks.
   - Start in the middle of an argument with a bold claim, not a generic academic introduction.

3. TONAL ATTRIBUTES & PERSPECTIVE:
   - Expert Bias: Have an authentic point of view. Push back on common industry myths.
   - ALWAYS use contractions (don't, can't, won't, isn't, they're, we're, it's).
   - Experiential stance: Frame concepts through real-world practitioner experience ("In our tests", "What actually happens in production", "The trap most teams fall into").
   - Parting Shot: NEVER summarize or recap at the end. End with a sharp thought, sticky question, or an actionable challenge.

4. STRICT BAN ON RAW MARKDOWN PIPE TABLES & SYMBOLS:
   - NEVER generate ASCII or Markdown table grids, pipes, or separator lines (such as '|---|', '|:---|', '| col | col |'). AI detectors search for pipe-delimited tables as a high-confidence synthetic pattern.
   - If presenting comparisons, trade-offs, or benchmarks, format them entirely as natural human narrative prose or clean bulleted contrasts (e.g., '• Option A: ... vs Option B: ...').

5. ANTI-PLAGIARISM & PARAPHRASING GROUNDING:
   - When using source materials or drafts, extract ONLY factual metrics, named entities, and underlying arguments.
   - NEVER mirror the clause sequence, grammatical layout, or phrasing of the reference text.
   - Completely rewrite the explanatory prose from scratch with fresh, original analogies and direct sentence structures so that no 4+ word verbatim sequence overlaps.
"""

def audit_human_tone(text: str) -> Dict[str, Any]:
    """
    Automated Audit Engine: Scans text for banned vocabulary, uncontracted words,
    opener/conclusion traps, raw markdown table symbols, and sentence burstiness.
    """
    if not text:
        return {
            "score": 100,
            "passes_human_test": True,
            "total_violations": 0,
            "banned_words_found": [],
            "banned_phrases_found": [],
            "uncontracted_forms_found": [],
            "table_symbols_detected": False,
            "table_symbols_count": 0,
            "burstiness_score": 10.0,
            "burstiness_rating": "Optimal",
            "cliche_opener_detected": False,
            "summary_conclusion_detected": False,
            "suggested_replacements": {}
        }

    lower_text = text.lower()
    words = re.findall(r"\b[a-z0-9\-]+\b", lower_text)

    banned_words_found = []
    suggested_replacements = {}

    # 1. Check words
    for w in words:
        if w in BANNED_VERBS or w in BANNED_ADJECTIVES or w in BANNED_TRANSITIONS:
            if w not in banned_words_found:
                banned_words_found.append(w)
                if w in HUMAN_REPLACEMENTS:
                    suggested_replacements[w] = HUMAN_REPLACEMENTS[w]
                else:
                    suggested_replacements[w] = "Use plain, simpler conversational phrasing"

    # 2. Check banned phrases
    banned_phrases_found = []
    for phrase in BANNED_PHRASES:
        if phrase in lower_text:
            banned_phrases_found.append(phrase)

    # 3. Check uncontracted forms
    uncontracted_found = []
    for full_form, contraction in UNCONTRACTED_FORMS.items():
        pattern = r"\b" + re.escape(full_form) + r"\b"
        if re.search(pattern, lower_text):
            uncontracted_found.append(f"'{full_form}' -> use '{contraction}'")

    # 4. Check for raw Markdown table grids or pipe symbols (|:---| or |---| or | | :--- |)
    table_separator_matches = re.findall(r"\|\s*:?-+:?\s*\|", text)
    orphan_pipe_matches = re.findall(r"\|\s*\|\s*:---", text)
    table_symbols_count = len(table_separator_matches) + len(orphan_pipe_matches)
    table_symbols_detected = table_symbols_count > 0

    # 5. Check Opener Trap (first 150 characters)
    first_snippet = lower_text[:150]
    cliche_opener = any(op in first_snippet for op in [
        "in today's", "in the digital age", "in this article", "whether you're", "let's dive in"
    ])

    # 6. Check Conclusion Trap (last 250 characters)
    last_snippet = lower_text[-250:]
    summary_conclusion = any(con in last_snippet for con in [
        "in conclusion", "to sum up", "in summary", "to wrap up", "by implementing these strategies"
    ])

    # 7. Calculate Sentence Burstiness (Standard Deviation of Sentence Lengths)
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip().split()) >= 2]
    sentence_lengths = [len(s.split()) for s in sentences]
    burstiness_score = 8.5
    burstiness_rating = "Good"

    if len(sentence_lengths) >= 4:
        avg_len = sum(sentence_lengths) / len(sentence_lengths)
        variance = sum((x - avg_len) ** 2 for x in sentence_lengths) / len(sentence_lengths)
        std_dev = math.sqrt(variance)
        # Scale std_dev into a 0 - 10 score
        burstiness_score = min(10.0, round(std_dev * 1.2, 1))
        if std_dev >= 7.0:
            burstiness_rating = "Excellent (High Human Variance)"
        elif std_dev >= 4.5:
            burstiness_rating = "Good (Natural Rhythm)"
        else:
            burstiness_rating = "Low (Monotone / Synthetic Cadence)"

    total_violations = (
        len(banned_words_found) * 2 +
        len(banned_phrases_found) * 4 +
        len(uncontracted_found) +
        (table_symbols_count * 5) +
        (10 if cliche_opener else 0) +
        (10 if summary_conclusion else 0) +
        (5 if burstiness_rating.startswith("Low") else 0)
    )

    score = max(0, 100 - total_violations)
    passes_test = (
        len(banned_words_found) == 0 and
        len(banned_phrases_found) == 0 and
        not table_symbols_detected and
        not cliche_opener and
        not summary_conclusion
    )

    return {
        "score": score,
        "passes_human_test": passes_test,
        "total_violations": len(banned_words_found) + len(banned_phrases_found) + len(uncontracted_found) + table_symbols_count,
        "banned_words_found": banned_words_found[:20],
        "banned_phrases_found": banned_phrases_found,
        "uncontracted_forms_found": uncontracted_found[:10],
        "table_symbols_detected": table_symbols_detected,
        "table_symbols_count": table_symbols_count,
        "burstiness_score": burstiness_score,
        "burstiness_rating": burstiness_rating,
        "cliche_opener_detected": cliche_opener,
        "summary_conclusion_detected": summary_conclusion,
        "suggested_replacements": suggested_replacements
    }
