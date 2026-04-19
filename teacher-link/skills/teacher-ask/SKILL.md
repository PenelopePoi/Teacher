---
name: teacher-ask
description: Route a hard or high-stakes question to the Teacher ASI swarm (5 researchers → critic → synth → 3-round improver → scorer). Use when the user wants a second opinion, multi-agent reasoning, or a quality-scored answer — not quick lookups.
---

# teacher-ask — Route to the ASI swarm

Calls the `teacher_ask` MCP tool, which runs the full Teacher pipeline:

```
5 parallel researchers → critic (finds flaws) → synthesizer (merges best)
  → improver (3 rounds of refinement) → scorer (1–10, 5 dimensions)
```

Takes **60–180s on local Ollama.** The tool returns a synthesized answer, a numeric score, and metadata (agents used, hallucination risk, skills invoked).

## When to use

- Hard questions where the user wants multi-perspective reasoning
- Decisions the user wants a "second opinion" on
- Research prompts where quality matters more than speed
- Any time the user literally says "ask Teacher"

## When NOT to use

- Simple factual lookups (faster with direct tools or `teacher_search_knowledge`)
- Questions already answered in the KB (check `teacher_search_knowledge` first)
- Anything where 60–180s latency is unacceptable
- Ollama is down (check `teacher_status` first)

## Workflow

1. **Check the KB first.** Call `teacher_search_knowledge` with the same query. If top result scored ≥6, offer that to the user first — saves a full ASI run.
2. **Warn about latency.** "This runs the full swarm — give it 1–3 minutes."
3. **Call `teacher_ask`** with `{query: "<user's question>"}`.
4. **Report the score alongside the answer.** Teacher's own self-scoring (1–10) is load-bearing — a score of 4 is worth less than a score of 9.
5. **If score <6,** offer to try a rewritten query or fall through to your own reasoning.

## Example

User: "Ask Teacher whether I should use SSE or Streamable HTTP for this MCP server."

- First: `teacher_search_knowledge` for "MCP SSE Streamable HTTP transport"
- If no strong hit, `teacher_ask` with the full phrasing
- Relay: "Teacher (score 8/10): <answer>. Ollama-backed, so this is one instance's opinion, not consensus."

## Error handling

If the tool returns `_transport_error`: call `teacher_status` once to diagnose, report back to the user. Don't retry blindly.
