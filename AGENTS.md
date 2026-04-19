# AGENTS.md

Agent conventions for the Teacher IDE codebase.

## Agent Architecture

Teacher IDE uses a multi-agent system where specialized AI agents handle different aspects of the learning experience. All agents live in `packages/teacher-core/src/browser/agents/`.

### Active Agents

| Agent | ID | Purpose |
|---|---|---|
| Tutor Agent | `teacher-tutor` | Primary coding mentor. Socratic questioning, guided discovery. |
| Explain Agent | `teacher-explain` | Structured code explanations (What/Why/How/Try It). |
| Review Agent | `teacher-review` | Teaching-oriented code review with severity classification. |
| Debugger Agent | `teacher-debugger` | Guided debugging with progressive hints. |
| Growth Agent | `teacher-growth` | Tracks learning trajectory and suggests next steps. |
| Motivator Agent | `teacher-motivator` | Celebrates milestones, maintains engagement. |
| Project Agent | `teacher-project` | Project-based learning scaffolding. |

### Agent Communication

Agents communicate via the `AgentHandoffService` (`agent-handoff-service.ts`). Handoffs occur when one agent determines another is better suited — e.g., the debugger hands off to the tutor when a concept gap is detected.

Inter-agent messages use the `AgentMessage` interface from `agent-protocol.ts`:
- `from`: source agent ID
- `to`: target agent ID
- `type`: message type (handoff, query, update)
- `payload`: arbitrary data

### Agent Conventions

1. **System prompts** are defined as constants above the class, not inline.
2. **Prompt variants** support beginner/intermediate/advanced via the `variants` array.
3. All agents extend `AbstractStreamParsingChatAgent` from `@theia/ai-chat`.
4. Agents are `@injectable()` and registered in `teacher-frontend-module.ts`.
5. Agent IDs follow the pattern `teacher-{role}`.
6. Tags always include `['teacher', '{role}', 'education']`.
7. Icons use `codicon` classes.

### Complexity Dial

All teaching agents apply the Complexity Dial based on `teacher.tutor.skillLevel`:
- **Beginner**: 60% What — focus on understanding what things do.
- **Intermediate**: Balanced — equal What/How/Why.
- **Advanced**: 60% How — focus on internals, trade-offs, edge cases.

### Progress Awareness

Agents should reference the student's learning profile (`LearningProfile`) when available:
- Acknowledge previously mastered concepts.
- Flag new concepts explicitly.
- Adapt depth based on `completedConcepts[]` and `weakAreas[]`.

### Ethical Framework

All agents follow these principles (embedded in every system prompt):
1. Truth over engagement — never fabricate capabilities or fake encouragement.
2. Human agency first — the student controls the pace.
3. Access for all — explain at the level requested, never condescend.

### Adding a New Agent

1. Create `packages/teacher-core/src/browser/agents/{name}-agent.ts`
2. Define system prompt constant(s) with beginner/advanced variants
3. Export agent class extending `AbstractStreamParsingChatAgent`
4. Register in `teacher-frontend-module.ts` via `bind(ChatAgent).to(YourAgent).inSingletonScope()`
5. Add to this table
