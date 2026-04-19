---
name: teacher-teach-session
description: Run Teacher's pedagogical session generator — produces N progressively harder Q&A pairs on a topic, each answered through the ASI swarm. Use when the user wants a study guide, curriculum seed, or learning path. NOT for writing new skills — see teacher-contribute-skill.
---

# teacher-teach-session — Study-guide generator

Calls the `teacher_teach_session` MCP tool (server endpoint: `/tool/teach`). It:

1. Generates N progressively harder questions about the topic
2. Answers each question through the full ASI pipeline
3. Returns a scored Q&A set

Slow: scales with `num_questions × ASI latency` (often 5 × 90s = ~8 minutes for default).

## When to use

- User says "teach me X", "give me a study session on X", "quiz me on X"
- Curriculum building — seeding a learning track with scored Q&A pairs
- Onboarding docs for a new domain
- Revising a topic before a conversation with a subject-matter expert

## When NOT to use

- User wants a *single* question answered (that's `teacher_ask`)
- User wants to *add* a new skill to the library (that's `teacher-contribute-skill`)
- Time-pressured situations — default 5 questions takes ~8 minutes on local Ollama

## Workflow

1. **Confirm the topic is specific enough.** "Teach me programming" is too broad. Push back for focus: "Teach me Rust ownership" works.
2. **Ask about depth.** Default is 5 questions, beginner→advanced. Offer 3 for a quick skim, 10 for a serious session.
3. **Warn about latency.** "This runs a full ASI pass per question — 5 questions is about 8 minutes."
4. **Call** `teacher_teach_session` with `{topic: "<specific topic>", num_questions: N}`.
5. **Present the Q&A set** with the per-question scores. The average score tells you whether to trust the session or rerun with better framing.

## Score reading

- **Average ≥ 8** — solid session, use as-is
- **Average 6–7** — useful, but flag individual low-scored Qs and rerun them with `teacher_ask`
- **Average < 6** — topic is likely too vague or the model struggled. Try more specific framing.

## Example

User: "Teach me how JWT authentication actually works."

- Warn: "Running a 5-question session — roughly 8 minutes on local Ollama. OK?"
- On yes: `teacher_teach_session` with `{topic: "JWT authentication mechanics and security considerations", num_questions: 5}`
- Relay: "Session done, avg score 8.4. Q1 (beginner): … Q5 (advanced): …"

## Relationship to teacher-ask

- `teacher_ask` — one question, one answer
- `teacher_teach_session` — N questions generated *for* you, then answered

Use `teach_session` when you don't know what questions to ask yet. Use `ask` when you do.
