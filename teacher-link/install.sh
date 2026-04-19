#!/usr/bin/env bash
# Teacher-Link installer.
# Sets up npm deps, symlinks the 6 skills into ~/.claude/skills,
# and prints Claude Desktop / Claude Code config snippets ready to paste.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$HERE/skills"
SKILLS_DST="${HOME}/.claude/skills"

echo "==> Installing bridge deps"
cd "$HERE" && npm install --silent

echo "==> Symlinking skills into ${SKILLS_DST}"
mkdir -p "$SKILLS_DST"
for skill in "$SKILLS_SRC"/*/; do
    name=$(basename "$skill")
    ln -sfn "$skill" "$SKILLS_DST/$name"
    echo "    $SKILLS_DST/$name -> $skill"
done

echo
echo "==> Bridge ready at: $HERE/mcp-bridge.mjs"
echo
echo "Add the following MCP server entry to your Claude client:"
echo
echo "---------- Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json) ----------"
cat <<JSON
{
  "mcpServers": {
    "teacher-link": {
      "command": "node",
      "args": ["$HERE/mcp-bridge.mjs"],
      "env": {
        "TEACHER_MCP_URL": "http://localhost:8808"
      }
    }
  }
}
JSON
echo
echo "---------- Claude Code (project root .mcp.json or ~/.claude.json) ----------"
cat <<JSON
{
  "mcpServers": {
    "teacher-link": {
      "type": "stdio",
      "command": "node",
      "args": ["$HERE/mcp-bridge.mjs"],
      "env": {
        "TEACHER_MCP_URL": "http://localhost:8808"
      }
    }
  }
}
JSON
echo
echo "==> Verify the Teacher ASI is up:"
echo "    curl -sS http://localhost:8808/ | head"
echo "==> If empty: python3 ~/local-asi/mcp-server.py"
