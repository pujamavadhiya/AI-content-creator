---
name: editor-qa-scorer
description: Measure and improve readability, rhythm, and naturalness; return an overall score out of 100 with 5 high impact fixes.
---

Steps
	•	Extract every checkable claim: numbers, percentages, dates, names, quotes, "studies show" statements, product and pricing claims.
	•	For each, search for a primary or authoritative source (official documentation, government and industry bodies, peer reviewed research, established publications).
	•	Classify: Verified, Partly verified (number differs or context missing), Unverified, or Contradicted.
	•	Fix the draft: correct numbers, soften or remove unverifiable claims, add inline source attribution, add a Sources section.
	•	Output a claim table: claim, status, source name, URL, year, action taken.
Rules
	•	Never produce a URL you haven't opened or seen in results.
	•	Paraphrase sources. Quote only short phrases under 15 words, one per source.
	•	Prefer data less than two years old for fast moving topics and say when data is older.
	•	Anything left unverified goes in a visible note to the user.
F2. Editor and QA Scorer
name: editor-qa-scorer
description: Measure and improve a draft's readability, rhythm, and naturalness, then return a score with specific fixes. Use after drafting, when a user pastes text to improve, or when asked to make writing sound more human or check quality.
Checks (score each 1 to 10)
Check
What to measure
Target
Readability
Grade level for the audience
Grade 7 to 9 for general, higher for specialist
Sentence variety
Spread of sentence lengths, shared openers
Mix of short and long, no three similar in a row
Repetition
Repeated phrases, repeated sentence openers, repeated words in a paragraph
None obvious
Paragraph shape
Length and variety
Mostly 1 to 4 sentences
Specificity
Ratio of concrete details to generalities
At least one specific per section
AI tells
Section A3 matches, symmetrical lists, tidy moral endings
Zero
Voice match
Fit with {brand_voice}
4 or above
Intent fit
Does the opening answer the reader's question
