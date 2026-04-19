---
name: teacher-contribute-skill
description: Write a new SKILL.md into the Teacher skill library. v1 is GATED — Claude drafts the skill in conversation, user reviews and approves before anything is written. Prefers the teacher_add_skill MCP tool; falls back to filesystem write only where MCP isn't available.
---

# teacher-contribute-skill — Propose a new Teacher skill

The user wants to push a new skill into Teacher's library so future sessions can use it.

## Two write paths

**Preferred — MCP (works from any Claude client):**
Call the `teacher_add_skill` MCP tool. It takes `{name, description, content, overwrite?}`, validates the name (kebab-case), injects frontmatter if missing, writes `.skills-library/<name>/SKILL.md`, and returns the canonical path. Hot-reloaded by the ASI.

**Fallback — direct filesystem:**
Only if `teacher_add_skill` is not available (older Teacher ASI, bridge misconfigured, or you're working purely on the filesystem). Requires filesystem access — Claude Code has it, Claude Desktop typically does not.

The skill library lives at `~/.claude/skills/` (symlinked into the Teacher repo as `.skills-library/`).

## Governance (v1: gated)

**Skill quality is load-bearing.** The Teacher library is a curated asset that affects every future session on any machine running Teacher. Sloppy skills pollute the mesh.

**The rule:**

1. Claude drafts the skill **in conversation** — full SKILL.md as a code block. **No tool call yet.**
2. User reads the draft, requests changes, or approves.
3. Only on explicit approval ("yes, write it", "ship it", "save") does Claude call `teacher_add_skill` or write the file.
4. After writing, Claude verifies — call `teacher_list_skills` to confirm it appears, or `teacher_get_skill` to read it back.

**Never call `teacher_add_skill` before the user approves the draft.**

## When to use

- User says "Teacher should know how to X", "add this as a Teacher skill", "save this playbook"
- After a successful non-trivial workflow that the user wants codified
- When capturing a hard-won insight worth persisting

## When NOT to use

- Throwaway one-shot tasks
- Content that duplicates an existing skill (check `teacher_list_skills` first)
- Anything the user hasn't explicitly asked to persist
- Bulk skill generation (one at a time — each deserves a real review)

## Draft checklist

Every new skill must have:

- **Frontmatter** — `name` (kebab-case, matches directory), `description` (one-liner that makes the trigger scenario clear)
- **When to use** — concrete scenarios, not vague vibes
- **When NOT to use** — just as important; shows the skill's boundary
- **Workflow** — numbered steps a future Claude can follow
- **One concrete example** — the skill in motion
- **Guardrails / error handling** — what can go wrong, what to do about it

Style must match the existing library: direct, compressed, no hedging, no filler.

## Workflow

1. **Check for duplicates.** `teacher_list_skills` with a relevant category filter. If something similar exists, offer to *update* it (via `teacher_add_skill` with `overwrite: true`) rather than creating a near-duplicate.
2. **Draft in conversation.** Full SKILL.md as a code block.
3. **Iterate.** User edits, pushes back, or approves.
4. **On approval — write:**

   ```
   teacher_add_skill({
     name: "cold-email-founders",
     description: "Draft high-conversion cold emails to technical founders...",
     content: "<full SKILL.md body or body-without-frontmatter>",
     overwrite: false,
     // Provenance — optional but strongly recommended:
     author:     "Alex + Claude (Opus 4.7), 2026-04-19",
     source_url: "file:///Users/Alex/notes/cold-email-pattern.md",
     reason:     "Captured after three successful cold emails; pattern generalises."
   })
   ```

   Provenance fields show up in the audit log and in anomaly scans. Future-you wants to know where a skill came from and why — leaving these blank is borrowing trouble.

5. **Verify.** `teacher_list_skills` should include the new name. `teacher_get_skill` with the name should return the content.
6. **Report.** Tell the user the path written and that future sessions can now `teacher_get_skill` it.

## Error handling

| Error from `teacher_add_skill` | Cause | Action |
|---|---|---|
| `Invalid skill name` | Name isn't kebab-case | Rename, try again |
| `Skill already exists` | Name collision | Ask user: new name, or `overwrite: true`? |
| Transport error | Bridge down / server down | `teacher_status` to diagnose |

## Filesystem fallback (Claude Code, no MCP)

If `teacher_add_skill` is unavailable and you have filesystem access:

```
mkdir -p ~/.claude/skills/<skill-name>
# Write SKILL.md with frontmatter (name + description) at the top
```

Verify with `ls ~/.claude/skills/<skill-name>/SKILL.md`. Then `teacher_list_skills` (if the bridge is up) will surface it on the next call.

## Example

User: "The cold-email pattern we just nailed — save it as a skill called `cold-email-founders`."

- `teacher_list_skills` with `{category: "email"}` → no match
- Draft the full SKILL.md in chat
- User: "Good, add a note about no subject lines longer than 6 words."
- Update the draft
- User: "Ship it."
- `teacher_add_skill({name: "cold-email-founders", description: "Draft high-conversion cold emails to technical founders — short subject lines (≤6 words), specific hook, no template language", content: "<drafted body>"})`
- Verify: `teacher_list_skills` shows it, `teacher_get_skill` with that name returns the content
- Confirm: "Written to ~/.claude/skills/cold-email-founders/SKILL.md. Live immediately."
