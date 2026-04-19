# Teacher IDE Agents

All agents live in `packages/teacher-core/src/browser/agents/`.

## Agent Reference

| ID | Name | File | Purpose |
|----|------|------|---------|
| `teacher-tutor` | Teacher Tutor | `tutor-agent.ts` | Primary coding mentor. Uses Socratic questioning to guide discovery rather than giving answers directly. Adapts depth based on `teacher.tutor.skillLevel`. |
| `teacher-explain` | Explain This | `explain-agent.ts` | Structured code explanations using the What/Why/How/Try It framework. Triggered by selecting code and asking for an explanation. |
| `teacher-review` | Teaching Review | `review-agent.ts` | Code review that teaches the concepts behind each suggestion. Classifies issues by severity and explains the reasoning. |
| `teacher-debugger` | Teacher Debugger | `debugger-agent.ts` | Guided debugging with progressive hints. Helps students develop debugging intuition rather than just fixing bugs. |
| `teacher-growth-tracker` | Growth Tracker | `growth-agent.ts` | Tracks learning trajectory across sessions. Identifies skill gaps and suggests next steps based on mastery data. |
| `teacher-motivator` | Teacher Coach | `motivator-agent.ts` | Celebrates milestones and maintains engagement. Provides encouragement grounded in actual progress (never fabricated). |
| `teacher-project-builder` | Project Builder | `project-agent.ts` | Project-based learning scaffolding. Helps students plan, structure, and incrementally build real projects. |
| `teacher-strategic-planner` | Life Planner | `strategic-planner-agent.ts` | Long-term learning strategy. Helps students set goals, plan timelines, and prioritize what to learn next. |
| `teacher-thinking-debugger` | Thinking Coach | `thinking-debug-agent.ts` | Metacognition coach. Helps students debug their thinking process, not just their code. |

## When to Use Each Agent

| Scenario | Agent |
|----------|-------|
| "I don't understand closures" | Tutor |
| "What does this code do?" (with selection) | Explain |
| "Review my pull request" | Review |
| "My code throws an error" | Debugger |
| "What should I learn next?" | Growth Tracker |
| "I feel stuck" | Motivator |
| "Help me build a todo app" | Project Builder |
| "Plan my learning for the next month" | Strategic Planner |
| "I keep making the same mistake" | Thinking Coach |

## Agent Handoffs

Agents can hand off to each other via `AgentHandoffService`. Common handoff patterns:

- **Debugger -> Tutor**: When a bug reveals a concept gap
- **Review -> Explain**: When a review comment needs deeper explanation
- **Growth Tracker -> Motivator**: When the student hits a milestone
- **Tutor -> Project Builder**: When a concept is best learned by building

## System Prompt Conventions

1. Prompts are defined as `const` strings above the class, not inline
2. Each agent supports beginner/intermediate/advanced `variants`
3. All prompts embed the ethical framework (truth over engagement, human agency first)
4. Prompts reference the student's `LearningProfile` when available
