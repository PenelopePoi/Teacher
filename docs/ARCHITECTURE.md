# Teacher IDE Architecture

High-level architecture of the Teacher IDE system.

## Layer Diagram

```
+------------------------------------------------------------------+
|                        FRONTEND (Browser)                        |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |    18 Widgets     |  |    9 AI Agents   |  |  8 DI Rebinds   | |
|  | welcome, canvas,  |  | tutor, explain,  |  | tabs, status,   | |
|  | dashboard, skill,  |  | review, debug,   |  | sidebar, menu,  | |
|  | analytics, ...    |  | growth, motiv,   |  | palette, focus  | |
|  |                   |  | project, plan,   |  |                 | |
|  |                   |  | thinking         |  |                 | |
|  +--------+----------+  +--------+---------+  +--------+--------+ |
|           |                      |                      |         |
|           +----------+-----------+----------+-----------+         |
|                      |                      |                     |
|              InversifyJS DI Container                             |
|              (teacher-frontend-module.ts)                         |
+---------------------------+--------------------------------------+
                            | JSON-RPC
+---------------------------v--------------------------------------+
|                        BACKEND (Node.js)                         |
|                                                                  |
|  +-------------------+  +-------------------+  +---------------+ |
|  | TeacherService     |  | ProgressService   |  | SkillEngine   | |
|  | - curriculum load  |  | - mastery track   |  | - scan/search | |
|  | - lesson lifecycle |  | - streak/reports  |  | - execute     | |
|  | - assessment       |  | - recommendations |  | - workflows   | |
|  +-------------------+  +-------------------+  +---------------+ |
|  +-------------------+  +-------------------+                    |
|  | ASIBridgeService   |  | TemplateService   |                    |
|  | - HTTP to ASI      |  | - workspace setup |                    |
|  +-------------------+  +-------------------+                    |
+---------------------------+--------------------------------------+
                            | HTTP / stdio
+---------------------------v--------------------------------------+
|                         AI LAYER                                 |
|                                                                  |
|  +-------------------+  +-------------------+  +---------------+ |
|  | Ollama             |  | ASI Swarm         |  | MCP Servers   | |
|  | localhost:11434    |  | 5 researchers     |  | teacher-link  | |
|  | qwen2.5:7b        |  | + critic          |  | skill bridge  | |
|  | bonsai-8b          |  | + synthesizer     |  |               | |
|  +-------------------+  +-------------------+  +---------------+ |
+------------------------------------------------------------------+
                            | File I/O
+------------------------------------------------------------------+
|                        DATA LAYER                                |
|                                                                  |
|  +-------------------+  +-------------------+  +---------------+ |
|  | Learning Profile   |  | Skills Library    |  | Knowledge     | |
|  | ~/.theia/teacher/  |  | ~/.claude/skills/ |  | .knowledge/   | |
|  | progress/*.json    |  | 306 SKILL.md      |  | graph entries | |
|  +-------------------+  +-------------------+  +---------------+ |
|  +-------------------+                                           |
|  | Curriculum         |                                          |
|  | curriculum/        |                                          |
|  | 3 courses/15 les.  |                                          |
|  +-------------------+                                           |
+------------------------------------------------------------------+
```

## Package Boundaries

- **`teacher-core`** -- All teaching logic: agents, widgets, services, protocols. Has both frontend (`src/browser/`) and backend (`src/node/`) code.
- **`teacher-ui`** -- Visual shell only: DI rebinds, CSS theme, Pulse Panel. Frontend-only package.
- **`curriculum/`** -- Static course data (JSON + starter code). No TypeScript.
- **`teacher-plugins/`** -- VS Code extensions (theme, snippets, welcome walkthrough). Runtime-loaded.

## Communication

- Frontend-to-backend: JSON-RPC over WebSocket (Theia standard)
- Backend-to-Ollama: HTTP REST to `localhost:11434`
- Backend-to-ASI: HTTP REST to `localhost:8765`
- Agent-to-agent: In-process via `AgentHandoffService`
- Skill execution: Backend reads SKILL.md, formats for agent injection
