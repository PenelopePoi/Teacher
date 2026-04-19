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
- Curriculum-aware workspace templates
- Progress tracking and skill assessment
- Accessibility-first design
- Built for nonprofit educational use (Aurality Foundation)

## Features

- Full IDE capabilities (syntax highlighting, debugging, terminal, git, extensions)
- VS Code extension compatibility
- Browser-based and desktop (Electron) modes
- Multi-language support
- InversifyJS dependency injection architecture
- Plugin system for extensibility

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

### Docker (Self-hosted)

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install && npm run build:browser
EXPOSE 3000
CMD ["npm", "run", "start:browser"]
```

## Architecture

```
Teacher (Theia Fork)
├── packages/          # 77 runtime packages (core + extensions)
│   ├── core/          # Platform foundation
│   ├── editor/        # Editor framework
│   ├── monaco/        # Monaco editor integration
│   ├── terminal/      # Terminal emulator
│   ├── plugin-ext/    # Plugin API implementation
│   └── ...
├── dev-packages/      # Build tooling
├── examples/          # Sample apps (browser, electron)
├── configs/           # Shared TypeScript, ESLint, Mocha configs
└── logo/              # Teacher branding assets
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
