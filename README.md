Rewritten. Paste this as the new `README.md`:

````markdown
<br/>
<div id="teacher-logo" align="center">
    <br />
    <img src="https://raw.githubusercontent.com/eclipse-theia/theia/master/logo/theia-logo-gray.svg?sanitize=true" alt="Teacher (on Theia)" width="300"/>
    <h3>Teacher — Local-First AI Mentor IDE</h3>
    <em>Built on Eclipse Theia · From Pain to Purpose. From Passion to Prophet.</em>
</div>

---

**Teacher** is a fork of [Eclipse Theia](https://theia-ide.org) that turns a full cloud/desktop IDE into a local-first, guardian-first AI mentor workspace. You keep every Theia capability — Monaco, LSP, debug adapters, terminal, git, VS Code extensions, plugin API, electron + browser targets — and gain an offline AI layer: Ollama models, a multi-agent ASI swarm with a self-accumulating knowledge base, and a 326-skill library covering code, security, creative, ethics, and daily operations.

Built by David J. Weatherspoon and Alex Weatherspoon — Reconsumeralization LLC, Cocoa FL.

## Contents

- [What Teacher Adds](#what-teacher-adds)
- [Inherited from Theia](#inherited-from-theia)
- [Ethical Doctrine](#ethical-doctrine)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Upstream Attribution](#upstream-attribution)
- [License](#license)
- [Trademark](#trademark)

## What Teacher Adds

### Local-first AI (Ollama)

- `qwen2.5:7b` primary, `bonsai-8b` fallback, on `localhost:11434`
- No API keys, no cloud dependency, full model ownership
- Integrates through Theia's `ai-ollama` package alongside Anthropic, OpenAI, Google, MCP, Claude Code, HuggingFace, Llamafile, Copilot, Codex, and Vercel AI — 24 AI packages total, all inherited from upstream

### Local ASI engine

A multi-agent research swarm at `.local-asi/`:

- 5 parallel researchers → critic → synthesizer → 3-round improver → scorer
- Outputs scored on 5 dimensions (accuracy, depth, clarity, actionability, insight); entries ≥6/10 retained
- MCP server on port **8808** exposes 7 tools: `ask`, `search_knowledge`, `teach`, `improve`, `list_skills`, `get_skill`, `status`
- Nightly auto-improve cron lifts the lowest-scored entries
- Distillation pipeline compresses the knowledge base into shareable, copyleft form

### Self-accumulating knowledge base

- Graph-structured store at `.knowledge/` — concepts connected via `graph.json`, not flat JSON
- Grows with each satisfactory answer; future queries search it before hitting an LLM
- Curriculum pipeline builds adaptive lessons from the base

### 326-skill library

Symlinked at `.skills-library/` → `~/.claude/skills`. Category spread:

- **Security**: 22 detection skills (ransomware, privilege escalation, supply-chain, deepfakes, insider threat), incident response, forensics, web-security pipeline
- **AI/ML**: `llm-factory`, `training-orchestrator`, `reward-model`, `eval-pipeline`, `model-deploy`
- **Meta**: `skill-factory`, `skill-compose`, `quality-oracle`, `skill-ecosystem-self-correction`, `mesh-optimizer`
- **Creative**: `story-engine`, `sketch-to-logo`, `brand-voice-studio`, `suno-studio-workstation`, `daw-mastery`
- **Client ops**: `client-crm`, `contract-generator`, `invoice-tracker`, `proposal-generator`
- **Ethics**: `ethical-ai-doctrine`, `guardian-doctrine`, `governance-graph`, `honest-mirror`
- Plus agents, deployment, legal, financial, music, and life-ops domains

### Agent & governance features

Inherited from upstream Theia, active throughout Teacher:

- Specialized coding agents: Architect, Code Reviewer, Context Reviewer, Junior, App Tester, GitHub, Skill Creator
- Tool confirmation UI with collapsed delegation summaries
- Token usage indicator per chat session
- Agent prompt safety: reflection protocols between tool calls, hypothesis-driven debugging, rollback via `writeFileContent`, diff minimization
- Human-in-the-loop PR policy: contributors review all LLM-generated code before requesting review

## Inherited from Theia

Every upstream capability ships unchanged:

- **Editor** — Monaco, multi-language LSP, syntax highlighting, refactoring, call/type hierarchy, bulk edit
- **Debug / tasks** — Debug Adapter Protocol, task runner, terminal, external terminal launcher
- **SCM** — git core + extras, timeline
- **Workspaces** — multi-root, user storage, preferences, dev containers, remote (SSH, WSL)
- **UI** — navigator, outline, breadcrumbs, markers, preview pane, mini-browser, secondary windows, merge editor
- **Extensions (three tiers)** — VS Code extensions (runtime), Theia plugins (runtime, RPC-isolated), Theia extensions (build-time, DI)
- **Notebooks** — Jupyter-style editor, markdown preview, variable inspection
- **Build targets** — browser, browser-only (serverless), electron desktop; Playwright e2e

Full upstream docs: https://theia-ide.org/docs

## Ethical Doctrine

Five immutable principles, enforced at prompt and policy level:

1. **Truth over engagement** — never optimize for clicks, dark patterns, or manipulation
2. **Protect users as a guardian protects children** — no harm by design
3. **Human agency first** — AI assists, humans decide
4. **Transparency by default** — decisions documented, mistakes public
5. **Access for all** — free education and tools; paid services fund the free tier

**Meaningful examples convention** — no "Hello World" or "foo/bar". Every example serves genuine human purpose: learning, connection, accessibility, creativity, health.

## Getting Started

Requirements: Node.js ≥20, Python 3.10+ (for the ASI engine), [Ollama](https://ollama.com).

```bash
git clone https://github.com/PenelopePoi/Teacher.git
cd Teacher
npm install

ollama pull qwen2.5:7b
ollama serve &

python3 .local-asi/asi.py &       # optional: local ASI + MCP server on :8808

npm run start:browser             # http://localhost:3000
# or: npm run start:electron
```

Common build commands (see [`CLAUDE.md`](CLAUDE.md)):

```bash
npm run build:browser   # compile + webpack bundle (required before UI testing)
npm run compile         # TypeScript only (lerna + project references)
npm run watch           # browser + electron concurrent watch
npm run lint            # ESLint across all packages
npm run test            # full Mocha + NYC suite
```

Single test after compile:

```bash
npx mocha ./packages/core/lib/browser/some-file.spec.js
```

## Configuration

- **Ollama host** — set `ai-features.ollama.ollamaHost` in preferences (default `http://localhost:11434`)
- **ASI MCP server** — starts on `:8808`; point MCP-capable clients at it for `ask` / `teach` / `improve` / skill introspection
- **Skills directory** — `.skills-library/`; symlink or populate with `SKILL.md` files. `SkillService` watches and reloads on change
- **Knowledge base** — `.knowledge/`; writable by the ASI, manual JSON contributions welcome

## Contributing

1. Read [`doc/coding-guidelines.md`](doc/coding-guidelines.md) — 4-space indent, single quotes, `undefined` over `null`, PascalCase types, camelCase functions, explicit return types, property injection, localize user-facing strings
2. Read [`doc/Testing.md`](doc/Testing.md) and [`doc/Plugin-API.md`](doc/Plugin-API.md) if touching plugins
3. Fork, branch, follow the human-in-the-loop PR policy — review any LLM-generated code before requesting review
4. Sign the Eclipse Contributor Agreement for any changes touching upstream Theia code paths — see [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Upstream Attribution

Teacher is a downstream fork of [Eclipse Theia](https://github.com/eclipse-theia/theia) maintained by the Eclipse Foundation. Upstream also maintains:

- [Theia Blueprint](https://github.com/eclipse-theia/theia-blueprint) — reference packaged IDE
- [Theia website](https://github.com/eclipse-theia/theia-website)
- [VS Code API compatibility report](https://eclipse-theia.github.io/vscode-theia-comparator/status.html)

We track upstream forward. Open generic Theia-platform issues and discussions on the upstream repository. Teacher-specific issues (Ollama integration, ASI engine, skill library, doctrine) belong here.

## SBOM

Upstream Theia publishes a Software Bill of Materials for every release to the Eclipse Foundation SBOM registry — see [the handbook](https://eclipse-csi.github.io/security-handbook/sbom/registry.html). Teacher inherits the same components. The Weatherspoon layer (Python ASI, skill library, prompts) is documented in [`CLAUDE.md`](CLAUDE.md).

## License

Dual-licensed, same as upstream Theia:

- [Eclipse Public License 2.0](LICENSE-EPL)
- [(Secondary) GNU General Public License v2 with Classpath Exception](LICENSE-GPL-2.0-ONLY-CLASSPATH-EXCEPTION)

Weatherspoon additions (ASI engine, skill library, prompts, knowledge base schema) are copyleft — share-alike with attribution.

## Trademark

"Theia" is a **trademark of the Eclipse Foundation** — [Learn More](https://www.eclipse.org/theia). Teacher is an independent downstream fork and not affiliated with, endorsed by, or sponsored by the Eclipse Foundation.
````
