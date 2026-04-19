---
name: teacher-get-skill
description: Pull the full SKILL.md of a named Teacher skill into the conversation so Claude can apply its know-how. Use when the user says "how does Teacher do X" or "borrow Teacher's approach to X". Discover skill names with teacher_list_skills first.
---

# teacher-get-skill — Borrow Teacher's domain expertise

Teacher's skill library (`.skills-library/`, symlinked to `~/.claude/skills`) holds 300+ curated SKILL.md files covering branding, security, AI/ML, ethics, creative, client ops, and more. Each skill is a structured playbook — when to use, guardrails, workflows.

This skill imports one of them into the current Claude context so Claude can follow Teacher's approach on a given problem.

## When to use

- User asks "how does Teacher do X?" / "what's Teacher's playbook for X?"
- You're about to tackle a domain problem and want Teacher's pattern before reinventing
- The user wants a second read on a problem you've already drafted

## When NOT to use

- Quick factual questions (wrong tool — use `teacher_ask` or `teacher_search_knowledge`)
- When the user doesn't want Teacher's opinion — just solve it yourself
- If `teacher_status` shows the skill library is empty

## Workflow

1. **Discover.** If you don't already know the skill name, call `teacher_list_skills` with a category substring filter (e.g. `{category: "brand"}` to find branding-related skills).
2. **Pick the right one.** The list returns name + short description. Pick the best match; if unsure, read 2–3.
3. **Fetch.** `teacher_get_skill` with `{skill_name: "<exact-name>"}`. The response includes the full SKILL.md text.
4. **Apply.** Follow the skill's workflow in the current context. Cite: "Applying Teacher's `<name>` skill…"
5. **Attribute.** Teacher's skills are copyleft — you can use the approach; if the output ships publicly, credit Teacher / XELA Creative Studio.

## Example

User: "Help me cold-email a potential client. Does Teacher have a playbook?"

- `teacher_list_skills` with `{category: "client"}` → find `client-onboarding`, `proposal-generator`, etc.
- `teacher_get_skill` with `{skill_name: "client-onboarding"}`
- Apply the skill's voice, structure, and guardrails to the email draft

## Example 2

User: "I want to write a security incident report — how would Teacher structure it?"

- `teacher_list_skills` with `{category: "incident"}` → finds `incident-response`, `report-writer`, `fraud-investigation`
- `teacher_get_skill` on `report-writer`
- Draft the report following its template

## Don't paraphrase when you can cite

If the user is asking HOW Teacher does X (process question), returning a summary of the SKILL is fine. If they're asking FOR Teacher's help on X (operational question), actually run the skill's procedure — don't just describe it.
