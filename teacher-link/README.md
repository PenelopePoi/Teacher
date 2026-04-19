# Teacher-Link

**The bridge that makes Teacher a utility, not just a destination.**

Teacher-Link lets any Claude client — Desktop, Code, Managed Agents, or a custom SDK build — reach into a running Teacher installation and call the ASI swarm, search the knowledge base, pull skills, or run teaching sessions as if they were native tools.

It does two things:

1. **An MCP bridge** (`mcp-bridge.mjs`) that translates between the Claude MCP protocol and Teacher's HTTP JSON-RPC server at `localhost:8808`.
2. **Seven Claude skills** (`skills/`) that describe when and how to use the bridge's tools well.

---

## Why this exists

Teacher's local ASI server (`~/local-asi/mcp-server.py`) is named "MCP server" but it actually speaks plain HTTP JSON-RPC — not the MCP wire protocol Claude clients expect. This bridge closes that gap with a tiny stdio adapter.

Once installed, you get these MCP tools in any Claude client:

| Tool | What it does |
|---|---|
| `teacher_status` | Health check — is Ollama up, how big is the KB, recent scores |
| `teacher_search_knowledge` | Search the graph-structured knowledge base (≥6/10 entries only) |
| `teacher_list_skills` | List the local skill library with optional category filter |
| `teacher_get_skill` | Return full SKILL.md for a named skill |
| `teacher_ask` | Route a question through the full ASI swarm (slow, 60–180s) |
| `teacher_teach_session` | Generate a scored N-question teaching session on a topic |
| `teacher_improve` | Re-run the lowest-scored KB entries to raise their quality |

---

## Install

### 1. Start the Teacher ASI server

```bash
ollama serve &                        # once per boot
python3 ~/local-asi/mcp-server.py &   # the HTTP JSON-RPC server on :8808
curl -sS http://localhost:8808/ | head  # sanity check
```

### 2. Install the bridge

```bash
cd <path-to-Teacher>/teacher-link
./install.sh
```

`install.sh`:

- Runs `npm install` (pulls `@modelcontextprotocol/sdk`)
- Symlinks each skill under `skills/` into `~/.claude/skills/`
- Prints the exact MCP config JSON for Claude Desktop and Claude Code

### 3. Wire it into your Claude client

Copy the printed config into one of:

- **Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Claude Code (per-project)** — `.mcp.json` at the repo root
- **Claude Code (global)** — merge into `~/.claude.json` under `mcpServers`

Examples live in [`configs/`](configs).

### 4. Restart the client and test

In any Claude session:

> Run teacher_status.

You should see KB stats, model health, and agent count. If you see no `teacher_*` tools, the bridge isn't connected — re-check the config path and restart.

---

## Configuration

Environment variables read by `mcp-bridge.mjs`:

| Var | Default | Purpose |
|---|---|---|
| `TEACHER_MCP_URL` | `http://localhost:8808` | Override if the ASI runs on a different host/port or on a remote box you've reverse-tunneled to |
| `TEACHER_MCP_TOKEN` | (unset) | Sent as `Authorization: Bearer <token>` — set this when you add auth to the server |
| `TEACHER_MCP_TIMEOUT_MS` | `120000` | Per-request timeout in milliseconds. Bump for slow hardware or huge `teach_session` runs |

---

## Directory layout

```
teacher-link/
├── README.md                               ← you are here
├── package.json                            ← Node bridge deps
├── mcp-bridge.mjs                          ← stdio MCP server (the bridge)
├── install.sh                              ← one-command setup
├── configs/
│   ├── claude_desktop_config.example.json
│   └── claude_code.mcp.example.json
└── skills/
    ├── teacher-link/SKILL.md               ← umbrella router
    ├── teacher-ask/SKILL.md
    ├── teacher-search-knowledge/SKILL.md
    ├── teacher-status/SKILL.md
    ├── teacher-get-skill/SKILL.md
    ├── teacher-teach-session/SKILL.md
    └── teacher-contribute-skill/SKILL.md   ← filesystem path, not MCP
```

---

## Known limitations

- **`teacher-contribute-skill` is filesystem-only.** The Teacher server has no "add skill" endpoint yet — the skill writes `SKILL.md` files directly to `.skills-library/`. That works in Claude Code (which has filesystem access) and in clients with the Filesystem MCP configured, but not in vanilla Claude Desktop. A future server-side `add_skill` tool is tracked as an improvement.
- **No auth by default.** The bridge and server are both open on localhost. Do NOT expose port 8808 to a public network without adding bearer-token auth and setting `TEACHER_MCP_TOKEN`.
- **Latency is real.** `teacher_ask` and `teacher_teach_session` are slow because they run the full ASI pipeline on local Ollama. Budget accordingly; warn users when calling them.

---

## Development

Test the bridge stand-alone (it speaks MCP over stdio, so you need a harness):

```bash
# Smoke-test that the script loads and advertises tools
node mcp-bridge.mjs <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# ^ will block on stdin after responding; Ctrl-C to exit
```

For real integration testing, use [`@modelcontextprotocol/inspector`](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector node mcp-bridge.mjs
```

---

## License

Copyleft, same as the Teacher project: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0. Share-alike with attribution to [XELA Creative Studio](https://teacher.xela.studio) / Reconsumeralization LLC.
