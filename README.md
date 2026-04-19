<br/>
<div id="teacher-logo" align="center">
    <br />
    <img src="logo/teacher-logo.svg" alt="Teacher Logo" width="400"/>
    <h3>AI-Powered Learning IDE</h3>
    <p><em>From Pain to Purpose. From Passion to Prophet.</em></p>
</div>

<div id="badges" align="center">

  [![Built on Theia](https://img.shields.io/badge/Built_on-Eclipse_Theia-blue.svg?style=flat-curved)](https://theia-ide.org)
  [![License](https://img.shields.io/badge/License-EPL_2.0-brightgreen.svg?style=flat-curved)](LICENSE-EPL)

**Teacher** is a full-featured, AI-enhanced IDE built on [Eclipse Theia](https://theia-ide.org) — designed to make learning to code accessible, guided, and real. Not a toy. Not a tutorial. A professional-grade development environment that teaches you while you build.

</div>

---

## What is Teacher?

Teacher is a fork of Eclipse Theia with a custom visual identity (Glassmorphic Industrial — warm charcoal + amber accent), three teaching-focused AI agents, a structured curriculum system, and 8 InversifyJS DI rebinds that break the VS Code shell geometry. It supports VS Code extensions, multiple languages, and runs in the browser or as a desktop app.

**Key differences from upstream Theia:**
- **Custom shell** — 8 DI rebinds: rounded tab renderer, sidebar rail, hidden menu bar with brand wordmark, glass command palette, ambient Pulse Panel, stripped status bar, focus mode
- **Glassmorphic Industrial design** — warm charcoal surfaces (#12151A), amber accent (#E8A948), Geist/Geist Mono typography, 2400ms breathing glow signature, Teacher Dark syntax theme
- **AI tutoring** — Socratic agents that guide discovery, not autocomplete
- **Curriculum system** — workspace templates, assessments, progress tracking
- **Local-first AI** — Ollama + multi-agent ASI system, zero cloud dependency
- Built for nonprofit educational use (Aurality Foundation)

## Features

| Category | Items |
|----------|-------|
| **Widgets** (18) | Welcome, Progress Dashboard, Curriculum Browser, Canvas, Canvas Review, Learning Analytics, Learning Path, Skill Browser, Skill Command, AI History Search, Ghost Timeline, Improvement Dashboard, Permission Mode, Plan Mode, Teachable Moments, Rewind Panel, Workflow Builder, Pulse Panel |
| **AI Agents** (9) | Tutor, Explain, Review, Debugger, Growth Tracker, Motivator, Project Builder, Strategic Planner, Thinking Coach |
| **Skill Engine** | 306 SKILL.md files, fuzzy search, execution metrics, multi-step workflows, auto-triggers |
| **Eye UI Theme** | Glassmorphic Industrial design, warm charcoal palette, amber accent, 2400ms breathing glow, 8 DI rebinds |
| **Curriculum** | 3 courses (Python, Web, Git), 15 lessons, assessment engine, workspace templates |
| **Progress** | Skill mastery tracking, weekly reports, streak counter, weak area detection, recommendations |
| **Local AI** | Ollama integration, 5-agent ASI research swarm, zero cloud dependency |
| **Platform** | VS Code extension compatibility, browser + Electron, multi-language support |

### Visual Identity
- **Teacher Dark theme** — warm industrial charcoal palette with amber accent, periwinkle functions, teal strings, violet keywords
- **Glassmorphic surfaces** — frosted glass on command palette, dialogs, AI panels; flat chrome on editor viewport
- **Pulse Panel** — ambient AI status strip with 2400ms breathing glow (idle / thinking / suggesting / ready)
- **Focus Mode** (`Cmd+Shift+F`) — strips to essentials for beginners
- **Brand wordmark** — "Teacher" replaces menu bar, opens command palette on click

### AI Agents
- **Tutor Agent** — Socratic AI coding mentor that guides discovery instead of giving answers
- **Explain Agent** — Select any code, get structured explanations (What / Why / How / Try It)
- **Teaching Review Agent** — Code review that teaches the concepts behind each suggestion

### Curriculum System
- 3 courses: Intro to Python (5 lessons), Web Fundamentals (6 lessons), Git Basics (4 lessons)
- Workspace templates with starter code, tests, and `.teacher/lesson.json` metadata
- Assessment engine (code challenges, AI evaluation, quizzes)
- Lesson commands: Start Lesson (`Ctrl+Shift+L`), Check My Work (`Ctrl+Shift+C`), Get Hint (`Ctrl+Shift+H`)
- AI context injection — lesson objectives automatically inform all agent responses

### Progress Tracking
- Student dashboard with skill mastery visualization
- Lesson completion and score tracking
- Time-spent analytics and learning path timeline
- Suggested next lessons

### VS Code Extensions
- **Teacher Theme** — dark + light variants matching the industrial palette
- **Teacher Snippets** — 16 Python + 16 JavaScript educational snippets with teaching comments
- **Teacher Welcome** — 5-step guided walkthrough for new users

### Platform
- Full IDE capabilities (syntax highlighting, debugging, terminal, git, extensions)
- VS Code extension compatibility
- Browser-based and desktop (Electron) modes
- Multi-language support
- Local ASI bridge — connects to a 5-agent research swarm for deep explanations
- 306 skills in the bundled skills library

## Quick Start

### Prerequisites

- Node.js >= 20
- npm

### Install & Run (Browser)

```bash
npm install
npm run build:browser
npm run start:browser
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run as Desktop App

```bash
npm install
npm run build:electron
npm run start:electron
```

## Deployment

> **Teacher is a full-stack IDE — it cannot deploy to serverless platforms like Vercel.**
> It requires persistent WebSockets, a writable filesystem, and long-running processes.

| Mode | How |
|---|---|
| **Desktop** | Build Electron binaries via [Theia Blueprint](https://github.com/eclipse-theia/theia-blueprint) |
| **Self-hosted browser** | Docker container on Fly.io, Railway, Render, DigitalOcean, or any VPS |
| **Managed cloud IDE** | Gitpod, Coder, or Eclipse Che |
| **Marketing site** | A static landing page *can* deploy to Vercel/Netlify |

### Docker Compose (Recommended)

```bash
docker compose up
```

This starts Teacher IDE on port 3000 and Ollama on port 11434 with persistent volumes.

### Docker (Manual)

```bash
docker build -t teacher-ide .
docker run -p 3000:3000 teacher-ide
```

## Architecture

Teacher extends Theia via two custom packages — no upstream source modifications.

```
Teacher (Theia Fork)
├── packages/
│   ├── teacher-core/         # AI agents, curriculum, progress (backend + frontend)
│   │   ├── src/browser/
│   │   │   ├── agents/       # Tutor, Explain, Teaching Review agents
│   │   │   ├── commands/     # Lesson commands + keybindings
│   │   │   ├── widgets/      # Welcome, Dashboard, Curriculum Browser, Canvas
│   │   │   └── style/        # Widget CSS
│   │   ├── src/node/
│   │   │   ├── asi-bridge-service.ts     # Local ASI HTTP bridge
│   │   │   ├── curriculum-service.ts     # Course/lesson loader
│   │   │   ├── assessment-service.ts     # Test runner + AI evaluation
│   │   │   ├── template-service.ts       # Workspace template engine
│   │   │   └── progress-service.ts       # Student progress persistence
│   │   └── src/common/       # RPC protocols, preferences, types
│   │
│   ├── teacher-ui/           # Visual shell — DI rebinds + CSS (frontend only)
│   │   └── src/browser/
│   │       ├── teacher-tab-bar-renderer.ts    # Rounded tabs, amber underline
│   │       ├── teacher-side-panel-handler.ts  # Sidebar rail, immovable tabs
│   │       ├── teacher-status-bar.ts          # Stripped status bar + Pulse
│   │       ├── teacher-menu-bar.ts            # Hidden menu, brand wordmark
│   │       ├── teacher-quick-input.ts         # Glass command palette
│   │       ├── teacher-focus-mode.ts          # Cmd+Shift+F minimal UI
│   │       ├── pulse-panel-widget.tsx          # 2400ms breathing AI status
│   │       └── style/
│   │           ├── teacher-shell.css           # Glassmorphic Industrial theme
│   │           └── teacher-identity.css        # Font declarations
│   │
│   ├── monaco/data/monaco-themes/vscode/
│   │   └── dark_teacher.json  # Teacher Dark color theme
│   │
│   ├── ai-core/              # Agent framework, LLM abstraction
│   ├── ai-ollama/            # Ollama integration (localhost:11434)
│   ├── ai-chat/              # Chat agents framework
│   ├── core/                 # Platform foundation
│   ├── editor/               # Editor framework
│   └── ...                   # 78 packages total
│
├── curriculum/               # 3 courses, 15 lessons
│   ├── intro-to-python/      # 5 lessons with tests
│   ├── web-fundamentals/     # 6 lessons (HTML/CSS/JS)
│   └── git-basics/           # 4 lessons with setup scripts
│
├── teacher-plugins/          # VS Code extensions
│   ├── teacher-theme/        # Dark + Light color themes
│   ├── teacher-snippets/     # 32 educational snippets (Python + JS)
│   └── teacher-welcome-ext/  # 5-step onboarding walkthrough
│
├── .github/workflows/        # CI, Docker publish, Electron release
├── doc/
│   ├── DESIGN-SPEC.md        # Glassmorphic Industrial design system
│   └── DESIGN-SPEC-v2.md     # Dual-surface canonical reference
├── Dockerfile                # Browser mode container
├── docker-compose.yml        # IDE + Ollama stack
└── logo/                     # Teacher branding assets
```

### Customization Layers

| Layer | What | How |
|-------|------|-----|
| **A — Theme** | 500+ color tokens | `dark_teacher.json` in monaco-themes |
| **B — CSS** | Variables, glass effects, animations | `teacher-shell.css` overrides `--theia-*` |
| **C — DI** | 8 InversifyJS rebinds | `teacher-ui-frontend-module.ts` calls `rebind()` |

No upstream files modified. All Teacher code lives in `teacher-core/`, `teacher-ui/`, `curriculum/`, and `teacher-plugins/`.

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Compile TypeScript only
npm run compile

# Lint
npm run lint

# Run tests
npm run test

# Build specific package
npx lerna run compile --scope @theia/core
```

See [doc/Developing.md](doc/Developing.md) for the full development guide.

## Contributing

1. Fork the repository
2. Follow the [coding guidelines](doc/coding-guidelines.md)
3. Read the [Code of Conduct](CODE_OF_CONDUCT.md)
4. Submit a pull request

## Upstream

Teacher tracks [Eclipse Theia](https://github.com/eclipse-theia/theia) upstream. Core framework updates are pulled periodically.

## License

- [Eclipse Public License 2.0](LICENSE-EPL)
- [GNU GPL v2.0 with Classpath Exception](LICENSE-GPL-2.0-ONLY-CLASSPATH-EXCEPTION)

## Trademark

"Theia" is a trademark of the Eclipse Foundation. Teacher is an independent fork and is not affiliated with or endorsed by the Eclipse Foundation.

---

<div align="center">
  <sub>Built by <a href="https://xelabrandingstudio.com">XELA Creative Branding Studio</a></sub>
</div>
