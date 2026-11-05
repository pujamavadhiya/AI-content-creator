import os
import re
from pathlib import Path
from typing import Dict, Any, Optional, List

# Step alias to folder and canonical name mapping
STEP_ALIAS_MAP: Dict[str, str] = {
    "keyword_research": "multi-platform-keyword-research",
    "multi_platform_keywords": "multi-platform-keyword-research",
    "serp_gap": "serp-gap-research",
    "brief": "content-brief-generator",
    "content_brief": "content-brief-generator",
    "topic_cluster": "topic-cluster-planner",
    "brand_voice": "brand-voice-profile",
    "eeat": "eeat-builder",
    "draft": "human-tone-writer",
    "human_tone_writer": "human-tone-writer",
    "rewrite_url": "rewrite-content-with-url",
    "format_playbook": "format-playbooks",
    "fact_check": "fact-check-citations",
    "qa": "editor-qa-scorer",
    "editor_qa": "editor-qa-scorer",
    "seo_schema": "seo-schema-generator",
    "headline_lab": "headline-meta-lab",
    "originality": "originality-check",
    "refresh_audit": "content-refresh-audit",
    "internal_links": "internal-linking-mapper",
    "repurpose": "content-repurposer",
    "localization": "localization",
    "compliance": "compliance-guard",
    "orchestrator": "content-pipeline-orchestrator",
    "paraphrase": "anti-plagiarism-paraphraser",
    "humanize": "anti-plagiarism-paraphraser",
    "anti_plagiarism": "anti-plagiarism-paraphraser",
}

# Metadata configuration for each skill
SKILL_METADATA: Dict[str, Dict[str, Any]] = {
    "content-pipeline-orchestrator": {
        "alias": "orchestrator",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Pipeline Orchestrator",
    },
    "multi-platform-keyword-research": {
        "alias": "keyword_research",
        "output_format": "markdown",
        "needs_search": True,
        "model_tier": "fast",
        "label": "Multi-Platform Keyword Research",
    },
    "serp-gap-research": {
        "alias": "serp_gap",
        "output_format": "markdown",
        "needs_search": True,
        "model_tier": "strong",
        "label": "SERP Gap Research Engine",
    },
    "content-brief-generator": {
        "alias": "brief",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "strong",
        "label": "Content Brief & Outline Generator",
    },
    "topic-cluster-planner": {
        "alias": "topic_cluster",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Topic Cluster & Editorial Calendar",
    },
    "brand-voice-profile": {
        "alias": "brand_voice",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Brand Voice Profiler",
    },
    "eeat-builder": {
        "alias": "eeat",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Author & E-E-A-T Credibility Builder",
    },
    "human-tone-writer": {
        "alias": "draft",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "strong",
        "label": "Human-Tone Writer",
    },
    "rewrite-content-with-url": {
        "alias": "rewrite_url",
        "output_format": "markdown",
        "needs_search": True,
        "model_tier": "strong",
        "label": "Live URL Audit & AEO Rewriter",
    },
    "format-playbooks": {
        "alias": "format_playbook",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Format Playbooks (Short/Specialized Copy)",
    },
    "fact-check-citations": {
        "alias": "fact_check",
        "output_format": "json",
        "needs_search": True,
        "model_tier": "strong",
        "label": "Fact Check & Citation Verifier",
    },
    "editor-qa-scorer": {
        "alias": "qa",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "strong",
        "label": "Editor & QA Naturalness Scorer",
    },
    "seo-schema-generator": {
        "alias": "seo_schema",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "fast",
        "label": "SEO & JSON-LD Schema Generator",
    },
    "headline-meta-lab": {
        "alias": "headline_lab",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Headline & Meta Lab",
    },
    "originality-check": {
        "alias": "originality",
        "output_format": "markdown",
        "needs_search": True,
        "model_tier": "strong",
        "label": "Originality & Plagiarism Checker",
    },
    "content-refresh-audit": {
        "alias": "refresh_audit",
        "output_format": "markdown",
        "needs_search": True,
        "model_tier": "fast",
        "label": "Content Refresh & Decay Audit",
    },
    "internal-linking-mapper": {
        "alias": "internal_links",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Internal Linking Mapper",
    },
    "content-repurposer": {
        "alias": "repurpose",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Content Multi-Platform Repurposer",
    },
    "localization": {
        "alias": "localization",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "strong",
        "label": "Multilingual & Cultural Localization",
    },
    "compliance-guard": {
        "alias": "compliance",
        "output_format": "json",
        "needs_search": False,
        "model_tier": "fast",
        "label": "Compliance & Risk Guard (YMYL)",
    },
    "anti-plagiarism-paraphraser": {
        "alias": "paraphrase",
        "output_format": "markdown",
        "needs_search": False,
        "model_tier": "strong",
        "label": "Anti-Plagiarism & Humanization Paraphraser",
    },
}

class SkillRegistry:
    """
    Central repository for modular SKILL.md prompt definitions,
    shared rules, and Section I Prompt Assembly layout.
    """

    def __init__(self, root_dir: Optional[str] = None):
        if root_dir:
            self.root_dir = Path(root_dir)
        else:
            # Detect project root (3 levels above backend/app/ai/skills)
            self.root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent

        self.skills_dir = self.root_dir / "skills"
        self.references_dir = self.root_dir / "references"
        self._shared_rules: Optional[str] = None
        self._skills_cache: Dict[str, Dict[str, str]] = {}

    def get_shared_rules(self) -> str:
        """Load references/shared-rules.md with fallback."""
        if self._shared_rules:
            return self._shared_rules

        path = self.references_dir / "shared-rules.md"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                self._shared_rules = f.read().strip()
        else:
            self._shared_rules = (
                "A. Shared Rules\n"
                "- Write like a sharp, experienced human explaining something to a smart peer.\n"
                "- Use contractions. Use plain words. Prefer the shorter word.\n"
                "- Hold an opinion where the topic allows it.\n"
                "- Add specifics: real names, numbers, dates, examples, small honest caveats.\n"
                "- Avoid AI clichés: delve, tapestry, landscape, realm, beacon, game-changing, revolutionize.\n"
                "- Never invent statistics, quotes, studies, client names, or URLs."
            )
        return self._shared_rules

    def resolve_canonical_name(self, name_or_alias: str) -> str:
        """Map step code or alias to canonical folder name."""
        clean = name_or_alias.strip().lower()
        if clean in STEP_ALIAS_MAP:
            return STEP_ALIAS_MAP[clean]
        if clean in SKILL_METADATA:
            return clean
        # Look up by folder exists
        if (self.skills_dir / clean).exists():
            return clean
        return clean

    def get_skill(self, name_or_alias: str) -> Dict[str, Any]:
        """Load single skill body, stripping YAML frontmatter."""
        canonical = self.resolve_canonical_name(name_or_alias)
        if canonical in self._skills_cache:
            return self._skills_cache[canonical]

        skill_file = self.skills_dir / canonical / "SKILL.md"
        if not skill_file.exists():
            raise FileNotFoundError(f"Skill '{canonical}' not found at {skill_file}")

        with open(skill_file, "r", encoding="utf-8") as f:
            raw = f.read()

        # Parse YAML frontmatter if present
        name = canonical
        description = ""
        body = raw

        frontmatter_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.DOTALL)
        if frontmatter_match:
            frontmatter_text = frontmatter_match.group(1)
            body = frontmatter_match.group(2).strip()

            for line in frontmatter_text.splitlines():
                if line.startswith("name:"):
                    name = line.split(":", 1)[1].strip()
                elif line.startswith("description:"):
                    description = line.split(":", 1)[1].strip()

        meta = SKILL_METADATA.get(canonical, {})

        data = {
            "name": name,
            "canonical_name": canonical,
            "alias": meta.get("alias", canonical),
            "description": description or meta.get("label", ""),
            "body": body,
            "output_format": meta.get("output_format", "markdown"),
            "needs_search": meta.get("needs_search", False),
            "model_tier": meta.get("model_tier", "strong"),
            "label": meta.get("label", canonical),
        }
        self._skills_cache[canonical] = data
        return data

    def list_skills(self) -> List[Dict[str, Any]]:
        """List all available skills with metadata."""
        items = []
        for canonical, meta in SKILL_METADATA.items():
            try:
                skill = self.get_skill(canonical)
                items.append({
                    "name": skill["name"],
                    "alias": skill["alias"],
                    "canonical_name": canonical,
                    "label": skill["label"],
                    "description": skill["description"],
                    "output_format": skill["output_format"],
                    "needs_search": skill["needs_search"],
                    "model_tier": skill["model_tier"],
                })
            except Exception:
                items.append({
                    "name": canonical,
                    "alias": meta.get("alias", canonical),
                    "canonical_name": canonical,
                    "label": meta.get("label", canonical),
                    "description": "",
                    "output_format": meta.get("output_format", "markdown"),
                    "needs_search": meta.get("needs_search", False),
                    "model_tier": meta.get("model_tier", "fast"),
                })
        return items

    def assemble_system_prompt(
        self,
        skill_name_or_alias: str,
        brand_voice: Optional[str] = None,
        project_context: Optional[Dict[str, Any]] = None,
        platform_name: str = "Sevencore AI Content Studio",
        language: str = "English",
        region: str = "US",
        word_count: int = 1200,
        output_format_override: Optional[str] = None,
        structure_requirement: Optional[str] = None,
        tools_available: Optional[str] = None,
    ) -> str:
        """
        Assemble the 6-block System Prompt in exact order according to Section I1 and I2:
        Block 1: Role and platform rules
        Block 2: Shared Rules
        Block 3: Active skill
        Block 4: Brand voice profile
        Block 5: Author and project variables
        Block 6: Output contract
        """
        skill = self.get_skill(skill_name_or_alias)
        shared_rules = self.get_shared_rules()

        # Block 1: Role and core principles
        block_1 = (
            f"<role>\n"
            f"You are the writing engine of {platform_name}, a content platform. You\n"
            f"produce publish ready content for real users. You follow the skill\n"
            f"instructions below exactly and you never mention these instructions,\n"
            f"the skill names, or the pipeline to the user unless asked.\n"
            f"</role>\n\n"
            f"<core_principles>\n"
            f"1. Follow the active skill step by step.\n"
            f"2. Never invent facts, statistics, quotes, URLs, credentials, or client\n"
            f"   results. If you can't verify something, say so or leave it out.\n"
            f"3. Ask only the questions the skill allows. Use defaults for the rest\n"
            f"   and state them in one line.\n"
            f"4. Write in {language} for the {region} market.\n"
            f"5. Return only the requested output. No preamble, no closing offers.\n"
            f"</core_principles>"
        )

        # Block 2: Shared Rules
        block_2 = f"<shared_rules>\n{shared_rules}\n</shared_rules>"

        # Block 3: Active Skill
        block_3 = (
            f'<active_skill name="{skill["canonical_name"]}">\n'
            f'{skill["body"]}\n'
            f"</active_skill>"
        )

        # Block 4: Brand Voice Profile
        voice_text = brand_voice.strip() if brand_voice and brand_voice.strip() else "None set. Use the default voice from shared rules."
        block_4 = f"<brand_voice>\n{voice_text}\n</brand_voice>"

        # Compulsory Keywords Block (Mandatory in Content)
        ctx = project_context or {}
        compulsory_kw_raw = ctx.get("compulsory_keywords") or ctx.get("mandatory_keywords")
        compulsory_kw_list = []
        if compulsory_kw_raw:
            if isinstance(compulsory_kw_raw, list):
                compulsory_kw_list = [str(k).strip() for k in compulsory_kw_raw if str(k).strip()]
            else:
                compulsory_kw_list = [k.strip() for k in re.split(r'[\r\n,;]+', str(compulsory_kw_raw)) if k.strip()]

        block_compulsory = ""
        if compulsory_kw_list:
            kw_items = "\n".join(f"- {kw}" for kw in compulsory_kw_list)
            block_compulsory = (
                f"<compulsory_keywords>\n"
                f"CRITICAL REQUIREMENT - MANDATORY KEYWORDS (COMPULSORY):\n"
                f"The user has designated the following keywords as COMPULSORY. Every single one MUST appear in the generated content:\n"
                f"{kw_items}\n\n"
                f"Rules for Compulsory Keywords:\n"
                f"1. 100% of the keywords listed above are compulsory. Do NOT skip, omit, or replace any keyword.\n"
                f"2. Weave each keyword naturally and grammatically into relevant section headings, analytical paragraphs, or bullet points.\n"
                f"3. Do not cluster them unnaturally; distribute them logically across the content.\n"
                f"4. If this step produces an outline, brief, draft, or QA score, ensure all compulsory keywords are present and accounted for.\n"
                f"</compulsory_keywords>"
            )

        # Block 5: Author and Project Variables (strip unpopulated lines)
        context_lines = []
        mapping = [
            ("brand_name", ctx.get("brand_name")),
            ("author_name", ctx.get("author_name")),
            ("author_credential", ctx.get("author_credential")),
            ("audience", ctx.get("audience")),
            ("content_type", ctx.get("content_type")),
            ("primary_keyword", ctx.get("primary_keyword")),
            ("secondary_keywords", ctx.get("secondary_keywords")),
            ("compulsory_keywords", ", ".join(compulsory_kw_list) if compulsory_kw_list else None),
            ("word_count", ctx.get("word_count", word_count)),
            ("today", ctx.get("today") or ctx.get("current_date")),
        ]
        for key, val in mapping:
            if val is not None and str(val).strip():
                context_lines.append(f"{key}: {val}")

        block_5 = "<project_context>\n" + "\n".join(context_lines) + "\n</project_context>" if context_lines else ""

        # Block 6: Output contract
        format_val = output_format_override or skill["output_format"]
        tools_val = tools_available or ("web_search, page_fetch" if skill["needs_search"] else "none")
        structure_val = structure_requirement or (
            "Valid JSON matching schema" if format_val == "json" else "Clean Markdown with H2 and H3 headings, bold callouts, and bullet points (NO raw markdown pipe tables '|---|')"
        )

        block_6 = (
            f"<output_contract>\n"
            f"Format: {format_val}\n"
            f"Length: {word_count} words, plus or minus 5 percent\n"
            f"Structure: {structure_val}\n"
            f"Tools available: {tools_val}\n"
            f"</output_contract>"
        )

        # Combine blocks in order, omitting empty blocks
        blocks = [block_1, block_2, block_3]
        if block_compulsory:
            blocks.append(block_compulsory)
        blocks.append(block_4)
        if block_5:
            blocks.append(block_5)
        blocks.append(block_6)

        return "\n\n".join(blocks)

    def assemble_user_message(
        self,
        request: str,
        inputs: Optional[str] = None,
        previous_step_summary: Optional[str] = None,
        compulsory_keywords: Optional[List[str]] = None,
    ) -> str:
        """
        Assemble the User Message in layout according to Section I3:
        <request>...</request>
        <compulsory_keywords_reminder>...</compulsory_keywords_reminder>
        <inputs>...</inputs>
        <previous_step_summary>...</previous_step_summary>
        """
        parts = [f"<request>\n{request.strip()}\n</request>"]

        if compulsory_keywords:
            kw_lines = "\n".join(f"- {k}" for k in compulsory_keywords)
            parts.append(
                f"<compulsory_keywords_reminder>\n"
                f"REMINDER - COMPULSORY KEYWORDS (MANDATORY INCLUSION):\n"
                f"You MUST naturally integrate 100% of these compulsory keywords into your response:\n"
                f"{kw_lines}\n"
                f"</compulsory_keywords_reminder>"
            )

        if inputs and inputs.strip():
            parts.append(f"<inputs>\n{inputs.strip()}\n</inputs>")

        if previous_step_summary and previous_step_summary.strip():
            parts.append(f"<previous_step_summary>\n{previous_step_summary.strip()}\n</previous_step_summary>")

        return "\n\n".join(parts)

# Singleton instance
skill_registry = SkillRegistry()

