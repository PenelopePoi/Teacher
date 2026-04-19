---
name: teacher-search-knowledge
description: Query the local Teacher knowledge base (graph-structured, scored ≥6/10 entries). Fast. Use BEFORE teacher-ask — if the question was answered before with good score, the KB returns the cached synthesis instantly.
---

# teacher-search-knowledge — Check the KB before paying for the swarm

Calls the `teacher_search_knowledge` MCP tool. The Teacher KB is a graph at `.knowledge/` that accumulates answers scored ≥6/10 from past ASI runs. Each hit is a query + synthesis + score + metadata.

Fast (subsecond). Always cheaper than `teacher_ask`.

## When to use

- **Before `teacher_ask`** — always. If the user asks Teacher anything, check the cache first.
- When the user says "has Teacher ever covered X", "search Teacher's memory", "what does Teacher know about X"
- Recall prompts — user revisiting earlier threads of work

## When NOT to use

- When the user explicitly wants a fresh swarm run ("run the full thing")
- When the question is time-sensitive and the cache might be stale
- When no Teacher stack is installed — check `teacher_status` once at session start

## Workflow

1. Call `teacher_search_knowledge` with `{query: "<phrasing>", top_k: 5}`.
2. Inspect the returned entries. Each has `score` (1–10) and `response` (truncated to 2000 chars).
3. **Score interpretation:**
   - ≥8 — relay confidently, cite as Teacher's considered answer
   - 6–7 — relay, but offer to rerun through `teacher_ask` for freshness
   - <6 — should not appear (KB filters them out); if it does, note the anomaly
4. If no hits or all hits look marginal, fall through to `teacher_ask` or your own reasoning.

## Example

User: "What did Teacher decide about SSR vs SSG for blog-heavy sites?"

- `teacher_search_knowledge` with query "SSR SSG blog content rendering"
- If top hit scored 8+: "Teacher (score 8): <synthesis>. Want me to rerun it fresh through the swarm?"
- If nothing relevant: "KB has no good match. Want me to ask the swarm? That takes 60–180s."

## Multiple queries

If the user's question spans multiple distinct topics, fire multiple searches in parallel (one MCP call each). Synthesize the overlapping themes.

## Privacy note

The KB accumulates locally — nothing leaves the user's machine. Past queries stored there may be sensitive; don't paste raw entries into external channels without permission.
