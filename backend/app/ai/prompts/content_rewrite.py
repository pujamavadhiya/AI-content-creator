from typing import Optional

def get_content_rewrite_prompt(
    selected_text: str,
    action: str,
    custom_instruction: Optional[str] = None,
    tone: Optional[str] = None,
    language: Optional[str] = None
) -> str:
    action_instructions = {
        "rewrite": "Rewrite the selected text for improved clarity, impact, and style.",
        "grammar": "Correct all grammar, syntax, spelling, and punctuation errors while preserving the author's voice.",
        "professional": "Make the phrasing more authoritative, polished, and executive-ready.",
        "conversational": "Make the tone warmer, relatable, and conversational without losing depth.",
        "simplify": "Explain complex ideas simply, using plain English and shorter sentences.",
        "expand": "Deepen the argument with more context, reasoning, and practical explanation.",
        "shorten": "Condense the passage to its punchiest, most concise core without losing essential meaning.",
        "add_examples": "Incorporate concrete, real-world examples or industry scenarios into this passage.",
        "improve_intro": "Transform this introduction into an irresistible, high-stakes hook.",
        "improve_conclusion": "Strengthen this conclusion into a decisive, memorable strategic takeaway.",
        "alt_headings": "Generate 4 alternative, high-CTR heading options for this title/heading.",
        "improve_seo": "Optimize keyword placement and semantic relevance for search visibility.",
        "change_tone": f"Rewrite with a {tone or 'confident'} tone.",
        "translate": f"Translate fluently and idiomatically into {language or 'English'}.",
        "generate_cta": "Craft an irresistible, high-converting call to action based on this text."
    }

    base_instr = action_instructions.get(action, f"Modify the text according to: {action}")
    custom = f"\nAdditional Instruction: {custom_instruction}" if custom_instruction else ""

    return f"""You are an expert AI Editorial Assistant.
Task: {base_instr}{custom}

Text to modify:
\"\"\"{selected_text}\"\"\"

Output ONLY the revised text. Do not add markdown chatter, explanations, or quotes around the result.
"""

