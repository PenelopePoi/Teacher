---
name: teacher-link
description: Umbrella router for the Teacher ASI bridge. When the user wants to reach into Teacher — its ASI swarm, knowledge base, skill library, or health — pick the right sub-tool before calling anything. Requires teacher-link MCP server connected; if no teacher_* MCP tools are visible, the bridge isn't loaded.
---

# Teacher-Link Router

Teacher-Link exposes a local Teacher ASI installation (running at `http://localhost:8808` by default) as MCP tools in any Claude client. The 7 MCP tools are:

| Tool | Purpose | Speed |
|---|---|---|
| `teacher_status` | Health check (KB, Ollama, agents) | fast |
| `teacher_search_knowledge` | Query the cached knowledge graph | fast |
| `teacher_list_skills` | Enumerate the local skill library | fast |
| `teacher_get_skill` | Pull a SKILL.md into conversation | fast |
| `teacher_ask` | Full ASI swarm (research → critic → synth → improve → score) | **slow (60–180s)** |
| `teacher_teach_session` | Pedagogical Q&A generator | **slow (scales with Q count)** |
| `teacher_improve` | Re-run lowest-scored KB entries | **expensive** |

## When to use which

**User says "ask Teacher about X" or "get a second opinion":**
1. `teacher_search_knowledge` first — if X was answered before with score ≥6, you get the cached synthesis instantly.
2. Only if the KB has nothing useful, `teacher_ask`. Warn the user it's slow.

**User says "how does Teacher do X" / "what skills does it have":**
1. `teacher_list_skills` (optionally filtered) to find candidates.
2. `teacher_get_skill` on the best match. Then summarize or apply the skill's guidance in the current context.

**User says "is Teacher running" / symptoms look like connectivity:**
- `teacher_status`. If Ollama is down, tell the user to run `ollama serve`. If server status is unreachable, `python3 ~/local-asi/mcp-server.py`.

**User says "teach me X" / "give me a study session on X":**
- `teacher_teach_session` with `topic: X`, default 5 questions unless they ask for more/fewer. Warn that each question takes a full ASI pass.

**User says "improve the knowledge base" / "clean up Teacher's lowest scores":**
- `teacher_improve` with `num_entries` default 3. This is expensive — don't call without explicit intent.

**User says "write a new Teacher skill for X" or "teach Teacher how to do X":**
- This is NOT `teacher_teach_session`. Hand off to the `teacher-contribute-skill` skill, which writes a new `SKILL.md` to `.skills-library/`. Gated: Claude drafts, user approves before commit.

## Guardrails

- Never call `teacher_improve` without explicit user permission — one ASI pass per entry can tie up the backend for minutes.
- If `teacher_status` returns `ollama_running: false`, stop and tell the user before any other `teacher_*` call (the server will error anyway).
- Treat the KB results as cached opinions, not ground truth — cite scores when you relay them.
- If multiple `teacher_*` calls are needed, chain them in one turn rather than pinging the user between each.

## If MCP tools aren't visible

The user hasn't connected the bridge. Instruct them:
1. `cd <Teacher repo>/teacher-link && ./install.sh`
2. Paste the printed MCP config into Claude Desktop or Claude Code `.mcp.json`
3. Restart the client
4. Re-check with `teacher_status`
