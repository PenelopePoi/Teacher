---
name: teacher-contribute-skill
description: Write a new SKILL.md into the Teacher skill library. v1 is GATED — Claude drafts the skill in conversation, user reviews and approves before any write. Only applicable where Claude has filesystem access (Claude Code, Managed Agents). This is NOT the MCP "teach" tool.
---

# teacher-contribute-skill — Propose a new Teacher skill

The user wants to push a new skill into Teacher's library so future sessions (their own, and any Claude instance talking to their Teacher) can use it.

## Critical distinction

- **Server-side `teach` tool** = pedagogical session generator (see `teacher-teach-session`)
- **This skill** = filesystem write of a new `SKILL.md` to `.skills-library/<skill-name>/SKILL.md`

There is currently **no MCP tool for skill writes**. This skill works via direct filesystem access.

## Governance (v1: gated)

**Skill quality is load-bearing.** The Teacher library is a curated asset that affects every future session. Sloppy skills pollute the mesh. The v1 rule:

1. Claude drafts the skill **in conversation** (no file writes yet).
2. User reads the draft, asks for changes, or approves.
3. Only on explicit approval ("yes, write it", "ship it", "save") does Claude write the file.
4. After writing, Claude runs a lint pass — at minimum verifies the frontmatter, name uniqueness, and that `teacher_list_skills` returns the new skill.

**Never write a skill file before the user approves.** If in doubt, ask.

## When to use

- User says "Teacher should know how to X", "add this as a Teacher skill", "save this playbook"
- After you (Claude) have executed a non-trivial workflow successfully and the user wants it codified
- When the user is capturing a hard-won insight they want to persist

## When NOT to use

- Throwaway one-shot tasks
- Content that duplicates an existing skill (check `teacher_list_skills` first)
- Anything the user hasn't explicitly said they want persisted

## Draft checklist

Every new skill must have:

- **Frontmatter** — `name` (kebab-case, matches directory), `description` (one-liner, starts with a verb or scenario, makes the invocation trigger clear)
- **When to use** — concrete scenarios, not vague vibes
- **When NOT to use** — just as important; shows the skill's boundary
- **Workflow** — numbered steps a future Claude can follow
- **One concrete example** — shows the skill in motion
- **Guardrails / error handling** — what could go wrong and what to do

Style must match the existing library: direct, compressed, no hedging, no filler.

## Workflow

1. **Check for duplicates.** `teacher_list_skills` with a relevant category filter. If a similar skill exists, offer to *update* it instead of creating a new one.
2. **Draft in conversation.** Write the full SKILL.md text as a code block. Don't touch the filesystem yet.
3. **Iterate.** The user edits, pushes back, or approves.
4. **On approval, write:**
   - Create directory: `.skills-library/<skill-name>/`  (or `~/.claude/skills/<skill-name>/` directly if the symlink target is different)
   - Write `SKILL.md`
   - Verify: `teacher_list_skills` should return it
5. **Report.** Tell the user the path written and that `teacher_get_skill` now resolves it.

## Filesystem paths

- `.skills-library/` is a symlink in the Teacher repo pointing at `~/.claude/skills`
- Writing to either path has the same effect
- The skill is live immediately — `SkillService` in the Teacher IDE and the ASI's `SkillRouter` both hot-reload

## Example

User: "This cold-email pattern we just nailed — save it as a skill called `cold-email-founders`."

- `teacher_list_skills` with `{category: "email"}` → no match
- Draft the SKILL.md in chat, showing frontmatter + sections
- User: "Good, add a note about no subject lines longer than 6 words."
- Update the draft in chat
- User: "Ship it."
- Write `~/.claude/skills/cold-email-founders/SKILL.md`
- Verify: `teacher_list_skills` → `cold-email-founders` appears
- Confirm to user: "Written. `teacher_get_skill` with name `cold-email-founders` now returns it."

## Future — server-side skill writes

A proper `add_skill` MCP tool on the Teacher server (`~/local-asi/mcp-server.py`) would replace this filesystem dance and work from Claude Desktop too (which normally has no filesystem). Tracked as a future improvement.
