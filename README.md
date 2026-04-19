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

Teacher is a fork of Eclipse Theia, customized as an educational IDE that pairs real software development with AI-powered guidance. It supports VS Code extensions, multiple languages, and runs in the browser or as a desktop app.

**Key differences from upstream Theia:**
- AI tutoring integration — contextual explanations, not just autocomplete
- Curriculum-aware workspace templates with guided lessons
- Progress tracking, skill mastery, and assessment engine
- Local-first AI via Ollama + multi-agent ASI system
- Built for nonprofit educational use (Aurality Foundation)

## Features

### AI Agents
- **Tutor Agent** — Socratic AI coding mentor that guides discovery instead of giving answers
- **Explain Agent** — Select any code, get structured explanations (What / Why / How / Try It)
- **Teaching Review Agent** — Code review that teaches the concepts behind each suggestion

### Curriculum System
- Course browser with modules and lessons
- Workspace templates with starter code and tests
- Assessment engine (code challenges, AI evaluation, quizzes)
- Lesson commands: Start Lesson (`Ctrl+Shift+L`), Check My Work (`Ctrl+Shift+C`), Get Hint (`Ctrl+Shift+H`)
- AI context injection — lesson objectives automatically inform all agent responses

### Progress Tracking
- Student dashboard with skill mastery visualization
- Lesson completion and score tracking
- Time-spent analytics
- Suggested next lessons

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

```
Teacher (Theia Fork)
├── packages/
│   ├── teacher-core/      # Teacher-specific extension
│   │   ├── src/browser/
│   │   │   ├── agents/    # Tutor, Explain, Teaching Review agents
│   │   │   ├── commands/  # Lesson commands (Start, Check, Hint, Submit)
│   │   │   ├── widgets/   # Welcome page, Progress Dashboard, Curriculum Browser
│   │   │   └── style/     # Teacher CSS (Theia variables only)
│   │   ├── src/node/
│   │   │   ├── asi-bridge-service.ts      # Local ASI HTTP bridge
│   │   │   ├── curriculum-service.ts      # Course/lesson loader
│   │   │   ├── assessment-service.ts      # Test runner + AI evaluation
│   │   │   ├── template-service.ts        # Workspace template engine
│   │   │   └── progress-service.ts        # Student progress persistence
│   │   └── src/common/    # RPC protocols, preferences, types
│   ├── ai-core/           # Agent framework, LLM abstraction
│   ├── ai-ollama/         # Ollama integration (localhost:11434)
│   ├── ai-chat/           # Chat agents framework
│   ├── core/              # Platform foundation
│   ├── editor/            # Editor framework
│   ├── monaco/            # Monaco editor integration
│   └── ...                # 77 packages total
├── curriculum/            # Sample courses (Intro to Python)
├── examples/              # Browser + Electron apps
├── .github/workflows/     # CI, Docker publish, Electron release
├── Dockerfile             # Browser mode container
├── docker-compose.yml     # IDE + Ollama stack
└── logo/                  # Teacher branding assets
```

**Per-package code organization:**
- `src/common/` — Shared APIs (runs everywhere)
- `src/browser/` — Browser/DOM APIs
- `src/node/` — Node.js backend APIs
- `src/electron-browser/` — Electron renderer
- `src/electron-main/` — Electron main process

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
