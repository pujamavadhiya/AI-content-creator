---
name: human-tone-writer
description: Write blog posts, articles, and long form content that reads like a skilled human wrote it, free of AI patterns and banned words.
---

•	Insert experience into the draft as specifics: what was tried, what happened, what surprised them.
	•	Recommend where to place trust signals: byline, last updated date, sources section, about and contact links.
Rules
	•	Never invent credentials, clients, awards, or quotes. If the user has none, write the content without claiming experience and suggest how to gain it.
	•	For health, finance, and legal topics, recommend an expert reviewer.

E. Writing Skills
E1. Human Tone Writer
name: human-tone-writer
description: Write blog posts, articles, landing page copy, and other long form content that reads like a skilled human wrote it. Use when the user asks to write content and supplies an outline or brief, keywords, and a word count, or asks for human sounding, natural, or anti-AI writing.
Inputs: outline or brief (from Content Brief Generator if absent), keywords, word count, audience, optional {brand_voice} and author profile.
Steps
	•	Load references/shared-rules.md and the brand voice profile if one exists.
	•	Read the outline. Distribute the word count across sections in proportion unless the brief gives budgets.
	•	Draft each section. Answer the section's question in the first sentence or two, then add the specific detail, example, or opinion.
	•	Place keywords naturally: primary in the first 100 words, one H2, and the close. Secondaries spread out. Density around 1 to 2 percent for primary, under 1 percent for secondaries. If a keyword reads forced, rephrase around it.
	•	Add real texture: named tools, real numbers with sources, a short anecdote the author supplied, an honest limitation.
	•	End with a parting shot, not a summary.
	•	Run the self audit below before showing anything.
Self audit (silent, mandatory)
	•	Scan for Section A3 phrases and words. Rewrite any hit.
