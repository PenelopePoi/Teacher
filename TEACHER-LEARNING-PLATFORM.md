# Teacher Learning Platform — Feature Implementation Map

## What's Buildable Now (April 2026) vs Vision

### Tier 1: Buildable This Week (Theia widgets + existing AI agents)

| # | Feature | Implementation | Status |
|---|---|---|---|
| 1 | **Multi-Agent Workspace** | 3 agents exist (Tutor, Explain, Review). Add: Debugger, Motivator, Project Builder, Growth Tracker as chat agents with specialized system prompts | **Build now** |
| 2 | **Design Mode Canvas** | Canvas Review widget exists. Extend: click any code/UI element → "Explain/Improve/Animate/Simulate/Rebuild" context menu | **Build now** |
| 6 | **Skills Memory Engine** | Teachable Moments widget exists + skill library (343 skills). Wire: every lesson → skill entry in personal library | **Wired** |
| 7 | **Debug Mode for Thinking** | Review agent catches code errors. Add: cognitive-bias detection prompts, misconception flagging, "thinking audit" mode | **Build now** |
| 8 | **Strategic Plan Mode** | Plan Mode widget exists. Extend: accept any goal → milestone roadmap with timeline, habits, adaptive missions | **Build now** |
| 10 | **AI Review Engine** | Review agent + quality-loop skill exist. Wire: auto-review on save, score + explain + show next level | **Wired** |
| 14 | **Lifelong Memory Graph** | Progress tracking service + Teachable Moments + ASI knowledge graph exist. Wire: persistent cross-session memory | **Wired** |

### Tier 2: Buildable This Month (requires new services)

| # | Feature | Implementation | Blocker |
|---|---|---|---|
| 4 | **Autonomous Learning Automations** | Workflow engine exists (6 built-in pipelines). Add: overnight curriculum builder, weak-area scanner, review scheduler as scheduled workflows | Needs cron/scheduled execution |
| 5 | **Subagent Specialist Teams** | Skill engine + agent orchestration exist. Add: spawn-team command that creates N agents with domain-specific system prompts from skills | Needs multi-agent chat UI |
| 9 | **Reality Browser** | iframe sandbox exists in Canvas Review. Extend: WebContainer for simulations, historical event explorer, market simulator widgets | Needs WebContainer/E2B integration |
| 11 | **Plugin Marketplace** | Theia has VSX registry. Extend: custom Teacher plugin format for courses, simulators, certification tracks | Needs plugin packaging format |

### Tier 3: Buildable This Quarter (requires external integrations)

| # | Feature | Implementation | Blocker |
|---|---|---|---|
| 3 | **Composer Infinity** | AI chat exists. Extend: multi-modal generation (code, essays, music via Suno MCP, visual via Veo, scientific models via Gemini) | Needs MCP bridges for each modality |
| 12 | **Universal Tool Integration** | MCP bridges exist (6 bridges). Extend: more bridges for labs, creative studios, fabrication | Needs hardware integration per tool |
| 13 | **Infinite Media Generator** | Suno MCP, Veo, Gemini exist. Wire: unified "Create Media" command routing to appropriate generator | Needs reliable media generation APIs |

### Tier 4: 2126 Vision (requires hardware evolution)

| # | Feature | Implementation | Timeline |
|---|---|---|---|
| 15 | **Universal Environment** | Companion spec written. Glasses/AR requires hardware maturity | 2030s+ |
| 16 | **Zero-Latency Performance** | On-device inference improving. Full infinite context requires architecture breakthroughs | Ongoing |
| - | **Neural interfaces** | EMG wristband exists (Meta Neural Band). Brain-computer requires medical-grade breakthroughs | 2040s+ |

---

## Tier 1 Implementation Plan (This Week)

### New Agents to Build

Six new chat agents in `packages/teacher-core/src/browser/agents/`:

1. **Debugger Agent** (`debugger-agent.ts`)
   - Watches for errors in editor + terminal
   - Explains the error in plain language
   - Shows the fix with explanation
   - Teaches the underlying concept

2. **Motivator Agent** (`motivator-agent.ts`)
   - Tracks session length, frustration signals (rapid undos, deletions)
   - Offers encouragement calibrated to student level
   - Celebrates milestones (first function, first passing test, etc.)
   - Suggests breaks when cognitive load is high

3. **Project Builder Agent** (`project-agent.ts`)
   - Takes a project idea → generates scaffold
   - Breaks project into teachable milestones
   - Each milestone is a lesson
   - Adapts difficulty based on student performance

4. **Growth Tracker Agent** (`growth-agent.ts`)
   - Analyzes progress data from ProgressTrackingService
   - Identifies skill trends (improving, plateauing, declining)
   - Recommends next learning focus
   - Generates weekly progress reports

5. **Thinking Debugger Agent** (`thinking-debug-agent.ts`)
   - Detects cognitive biases in student's approach
   - Identifies misconceptions from their questions
   - Flags knowledge gaps based on what they avoid asking
   - Guides correction without shame

6. **Strategic Planner Agent** (`strategic-planner-agent.ts`)
   - Takes any goal → structured roadmap
   - Milestones with estimated timelines
   - Breaks into daily/weekly habits
   - Adapts based on actual progress vs plan

### Design Mode Context Menu

Add to the editor's right-click menu:
- "Ask Teacher: Explain This" → sends selection to Explain agent
- "Ask Teacher: Improve This" → sends to Review agent
- "Ask Teacher: Debug This" → sends to Debugger agent
- "Ask Teacher: Build From This" → sends to Project Builder agent

### Auto-Review on Save

Wire the quality-loop workflow to trigger on file save (configurable):
- Run review agent on saved file
- Show results as inline decorations (gold underlines for suggestions)
- Score displayed in status bar

### Persistent Memory

Wire Teachable Moments + Progress Tracking to persist across sessions:
- Store in ~/.teacher/learning-profile.json
- Load on session start
- Concepts the student has mastered don't get re-explained
- Weak areas get more attention
