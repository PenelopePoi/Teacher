---
name: teacher-status
description: Health-check the local Teacher ASI stack (Ollama, knowledge base, agents, recent scores, last improvement). Fast. Call at session start and after any teacher_* tool error.
---

# teacher-status — Is Teacher actually working?

Calls the `teacher_status` MCP tool. Returns:

```json
{
  "server":   { status, port, started, uptime },
  "model":    { name, fallback, ollama_running, agents, rounds },
  "knowledge":{ total_entries, total_queries, avg_score },
  "skills":   { total, directory },
  "last_improvement": "<ISO timestamp or null>",
  "recent_scores":    [{ query, score, elapsed }, ...]
}
```

## When to use

- **First call of a session** if you're going to use any `teacher_*` tool — takes 50ms, confirms the stack is up
- **After any `teacher_*` tool returns `_transport_error`** — diagnose what's down
- When the user says "is Teacher running", "check the stack", "is the swarm alive"
- Before calling `teacher_improve` (don't fire an expensive op against a broken Ollama)

## What each field tells you

| Field | Red flag | Action |
|---|---|---|
| `model.ollama_running: false` | Ollama daemon is down | Tell user: `ollama serve` |
| `server.uptime < 10s` | Just restarted, may still be loading | Retry in 5s |
| `knowledge.total_entries: 0` | KB is empty (fresh install) | Note, don't treat as error |
| `knowledge.avg_score < 5` | KB quality is low | Suggest `teacher_improve` |
| `recent_scores` all <6 | Recent runs underperforming | Flag to user |

## When NOT to use

- As a keepalive ping — don't spam it
- In a tight loop — it's cheap but not free

## Workflow

```
teacher_status  →  parse the response  →  decide next move
                   ↓
                   If `ollama_running: false`:
                     Stop. Tell user to start Ollama. Do NOT call teacher_ask / teacher_teach_session / teacher_improve.
                   If server unreachable (transport error):
                     Tell user to run `python3 ~/local-asi/mcp-server.py`
                   If all green:
                     Proceed with the intended tool.
```

## Example

User: "Ask Teacher about X."

- `teacher_status` (unless already checked this session)
- If Ollama down: "Teacher can't answer — Ollama isn't running. Run `ollama serve` and tell me when it's up."
- If green: `teacher_search_knowledge` then (if needed) `teacher_ask`

## If status itself fails

Transport error on `teacher_status` means the HTTP server at :8808 is down. Tell the user exactly:

```
python3 ~/local-asi/mcp-server.py
```

and wait for them to confirm.
