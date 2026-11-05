"""
Curated PAWS Paraphrase Exemplars and Syntactic Transformation Rules.
Derived from the Google PAWS (Paraphrase Adversaries from Word Scrambling) Dataset.
Used for In-Context Few-Shot Learning to elevate human content detection score to 80-95%+.
"""

from typing import List, Dict, Any

# Top categorized transformation exemplars from PAWS dataset (label=1)
PAWS_FEW_SHOT_EXEMPLARS: List[Dict[str, str]] = [
    {
        "category": "Clause Inversion",
        "description": "Flips dependent condition to the end and leads with the primary outcome.",
        "original": "When comparable rates of flow can be maintained, the results are high.",
        "human_paraphrase": "The results are high when comparable flow rates can be maintained."
    },
    {
        "category": "Sentence Splitting (Burstiness Boost)",
        "description": "Breaks a bloated relative clause into two distinct, high-cadence statements.",
        "original": "William Henry Harman was born on 17 February 1828 in Waynesboro, Virginia, where his parents were Lewis and Sally Harman.",
        "human_paraphrase": "William Henry Harman was born in Waynesboro, Virginia on February 17, 1828. His parents were Lewis and Sally Harman."
    },
    {
        "category": "Prepositional Phrase Relocation",
        "description": "Eliminates stiff introductory timeline phrases and embeds them naturally.",
        "original": "The first five weapons were delivered in the first half of 1916, with a total of 57 barrels and 56 cars completed by the end of the war.",
        "human_paraphrase": "The first five weapons were delivered in the first half of 1916. A total of 57 barrels and 56 carriages were completed by the end of the war."
    },
    {
        "category": "Predicate Reorganization",
        "description": "Shifts sentence predicate to avoid robotic monotone rhythm.",
        "original": "The friendship between him and Duncan ended at a club meeting in 1951 when the two disagreed at an annual meeting.",
        "human_paraphrase": "The friendship between him and Duncan ended in 1951 at a club meeting, when the two did not agree at an annual meeting."
    },
    {
        "category": "Noun Phrase Restructuring",
        "description": "Reorders genitive noun modifiers into natural colloquial phrasing.",
        "original": "The NBA season of 1975-76 was the 30th season of the National Basketball Association.",
        "human_paraphrase": "The 1975-76 season of the National Basketball Association was the 30th season of the NBA."
    },
    {
        "category": "Contextual Relocation",
        "description": "Re-anchors geographic and contextual markers to sound human-crafted.",
        "original": "The city sits at the confluence of the Snake River with the great Weiser River, which marks the border with Oregon.",
        "human_paraphrase": "The city lies at the confluence of the Snake River and the Great Weiser River, which marks the border with Oregon."
    },
    {
        "category": "Direct Action Inversion",
        "description": "Converts trailing gerund clauses into direct active reflections.",
        "original": "After losing his second election, he resigned as opposition leader and was replaced by Geoff Pearsall.",
        "human_paraphrase": "He resigned as opposition leader after losing his second election, and Geoff Pearsall took his place."
    },
    {
        "category": "Colloquial Simplification",
        "description": "Simplifies formal textbook syntax into clean conversational flow.",
        "original": "It is the seat of Zerendi District in Akmola Region.",
        "human_paraphrase": "It is the seat of the district of Zerendi in Akmola region."
    }
]

def format_paws_exemplars_prompt(limit: int = 5) -> str:
    """Formats PAWS exemplars into few-shot prompt instructions."""
    examples = PAWS_FEW_SHOT_EXEMPLARS[:limit]
    lines = [
        "EXEMPLAR HUMAN PARAPHRASE PATTERNS (DERIVED FROM THE PAWS DATASET):",
        "Study these exact syntactic transformations where 100% of factual data is preserved, but sentence architecture, clause order, and cadence are radically inverted to read like natural human prose:\n"
    ]
    for idx, ex in enumerate(examples, start=1):
        lines.append(f"Pattern {idx} ({ex['category']}):")
        lines.append(f"  Source:     \"{ex['original']}\"")
        lines.append(f"  Human Form: \"{ex['human_paraphrase']}\"")
        lines.append(f"  Technique:  {ex['description']}\n")

    return "\n".join(lines)


# WordNet Lexical Substitution Exemplars (High Perplexity & Anti-Cliché)
WORDNET_LEXICAL_EXEMPLARS: List[Dict[str, str]] = [
    {
        "target_cliche": "utilize / leverage",
        "wordnet_alternatives": "use, lean on, apply, draw upon, deploy",
        "description": "Replaces robotic corporate verbs with direct, grounded human action verbs.",
        "original": "Organizations must leverage advanced AI pipelines to utilize their data effectively.",
        "human_paraphrase": "Teams need to draw upon real production data and put practical models to work."
    },
    {
        "target_cliche": "delve into / intricate tapestry",
        "wordnet_alternatives": "look closely at, unwrap, explore / complex reality, web of, mix of",
        "description": "Replaces universal AI clichés with conversational practitioner diction.",
        "original": "Let us delve into the intricate tapestry of modern neural network engineering.",
        "human_paraphrase": "Let's look straight at how modern neural networks actually hold together under load."
    },
    {
        "target_cliche": "pivotal role / vital cornerstone",
        "wordnet_alternatives": "key role, decisive factor, backbone, linchpin",
        "description": "Substitutes grandiose adjectives with grounded, punchy vocabulary.",
        "original": "Latency serves as a pivotal role and a vital cornerstone in distributed swarm design.",
        "human_paraphrase": "Real latency is the decisive factor that makes or breaks distributed agent swarms."
    },
    {
        "target_cliche": "seamlessly optimize / streamline",
        "wordnet_alternatives": "smoothly tune, tighten, speed up, cut friction",
        "description": "Disrupts the synthetic 'seamlessly optimize' n-gram combination.",
        "original": "The software is designed to seamlessly optimize and streamline team workflows.",
        "human_paraphrase": "The tool cuts unnecessary friction and speeds up how teams hand off tasks."
    },
    {
        "target_cliche": "furthermore / in conclusion",
        "wordnet_alternatives": "what's more, on top of that, plus / the takeaway, here's the bottom line",
        "description": "Swaps robotic transitional markers with natural human conversational shifts.",
        "original": "Furthermore, compliance is essential. In conclusion, testing proves efficacy.",
        "human_paraphrase": "What's more, staying compliant isn't optional. The takeaway: run real load tests early."
    }
]

def format_wordnet_exemplars_prompt(limit: int = 4) -> str:
    """Formats WordNet lexical substitution exemplars into few-shot prompt instructions."""
    examples = WORDNET_LEXICAL_EXEMPLARS[:limit]
    lines = [
        "WORDNET LEXICAL SUBSTITUTION DIRECTIVES (WORDNET THESAURUS GROUNDED):",
        "Study these exact synonym substitutions where predictable AI tokens are replaced with diverse WordNet alternatives to spike vocabulary perplexity and eliminate AI tells:\n"
    ]
    for idx, ex in enumerate(examples, start=1):
        lines.append(f"Lexical Pattern {idx} (Target: {ex['target_cliche']}):")
        lines.append(f"  WordNet Alternatives: {ex['wordnet_alternatives']}")
        lines.append(f"  Predictable Form:     \"{ex['original']}\"")
        lines.append(f"  Humanized Diction:    \"{ex['human_paraphrase']}\"")
        lines.append(f"  Rule:                 {ex['description']}\n")

    return "\n".join(lines)

def format_combined_training_exemplars_prompt(paws_limit: int = 4, wordnet_limit: int = 3) -> str:
    """Combines PAWS (syntactic inversion) and WordNet (lexical diversity) exemplars into a single instruction block."""
    paws_block = format_paws_exemplars_prompt(limit=paws_limit)
    wordnet_block = format_wordnet_exemplars_prompt(limit=wordnet_limit)
    return f"{paws_block}\n\n{wordnet_block}"

