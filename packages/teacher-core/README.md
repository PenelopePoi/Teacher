# @theia/teacher-core

AI-powered learning extension for Teacher IDE. Provides agents, curriculum, progress tracking, skill engine, and all teaching widgets.

## Architecture

```
teacher-core/
├── src/common/           Shared protocols + types (RPC-safe)
│   ├── teacher-protocol.ts       Lesson, curriculum, assessment types + TeacherService
│   ├── progress-protocol.ts      Student progress, mastery, weekly reports + ProgressTrackingService
│   ├── skill-engine-protocol.ts  SKILL.md registry, execution, workflows + SkillEngineService
│   ├── asi-bridge-protocol.ts    Local ASI swarm bridge + ASIBridgeService
│   ├── canvas-protocol.ts        Canvas (scratchpad) types
│   ├── learning-profile.ts       Student learning profile shape
│   ├── teacher-preferences.ts    PreferenceSchema for all teacher.* settings
│   ├── constants.ts              Centralized IDs, paths, version
│   └── events.ts                 Centralized event types
│
├── src/browser/          Frontend (InversifyJS DI container)
│   ├── agents/           9 AI agents (tutor, explain, review, debugger, ...)
│   ├── widgets/          18 React widgets (welcome, dashboard, canvas, ...)
│   ├── commands/         Lesson commands + keybindings
│   ├── pulse/            Pulse service + indicator component
│   └── style/            Widget CSS
│
└── src/node/             Backend services
    ├── asi-bridge-service.ts      HTTP bridge to local ASI swarm
    ├── curriculum-service.ts      Course/lesson JSON loader
    ├── assessment-service.ts      Test runner + AI evaluation
    ├── template-service.ts        Workspace template engine
    ├── progress-service.ts        Student progress persistence
    └── skill-engine-service.ts    SKILL.md scanner + executor
```

## Key Interfaces

- **`TeacherService`** -- lesson lifecycle (start, check work, get hint, learning profile)
- **`ProgressTrackingService`** -- mastery tracking, streaks, weekly reports, recommendations
- **`SkillEngineService`** -- skill discovery, execution, workflows, metrics
- **`ASIBridgeService`** -- local ASI status, queries, knowledge export

## Entry Points

- Frontend module: `lib/browser/teacher-frontend-module`
- Backend module: `lib/node/teacher-backend-module`

Declared in `package.json` under `theiaExtensions`.
