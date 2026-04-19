#!/usr/bin/env node
// Teacher-Link MCP bridge.
// Exposes the 7 HTTP JSON-RPC tools on Teacher's :8808 server as MCP tools
// that any Claude client (Desktop, Code, Managed Agents, custom SDK) can call
// once this script is declared as an MCP server in the client's config.
//
// Env vars:
//   TEACHER_MCP_URL    Default http://localhost:8808. Override for remote ASI.
//   TEACHER_MCP_TOKEN  Optional. If set, sent as `Authorization: Bearer <token>`.
//   TEACHER_MCP_TIMEOUT_MS  Default 120000 (2 min). ASI runs can be slow.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const TEACHER_URL = (process.env.TEACHER_MCP_URL || 'http://localhost:8808').replace(/\/$/, '');
const TEACHER_TOKEN = process.env.TEACHER_MCP_TOKEN || null;
const TIMEOUT_MS = Number(process.env.TEACHER_MCP_TIMEOUT_MS) || 120_000;

const TOOLS = [
    {
        name: 'teacher_ask',
        endpoint: 'ask',
        description:
            'Route a question through the full Teacher ASI pipeline: 5 parallel researchers → critic → synthesizer → 3-round improver → scorer. ' +
            'Returns a synthesized answer with a quality score (1–10) and metadata. Use this when you want multi-agent reasoning with quality gating, ' +
            'not a single-shot LLM call. Slow (often 60–180s on local Ollama) — prefer for hard questions, not quick lookups.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The question to route through the swarm.' },
            },
            required: ['query'],
        },
    },
    {
        name: 'teacher_search_knowledge',
        endpoint: 'search_knowledge',
        description:
            'Search the accumulated Teacher knowledge base (graph-structured, scored ≥6/10 entries only). ' +
            'Fast. Use this BEFORE teacher_ask — if the question was answered before and scored well, the KB returns the cached synthesis.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query.' },
                top_k: { type: 'integer', description: 'Number of results to return.', default: 5 },
            },
            required: ['query'],
        },
    },
    {
        name: 'teacher_teach_session',
        endpoint: 'teach',
        description:
            'Run a pedagogical teaching session on a topic. Generates N progressively harder questions, then answers each through the ASI pipeline. ' +
            'Returns a Q&A set suitable for study or curriculum building. Slow (scales with num_questions × ASI latency). ' +
            'Note: this does NOT write new skills into the library — use teacher_contribute_skill (filesystem-side) for that.',
        inputSchema: {
            type: 'object',
            properties: {
                topic: { type: 'string', description: 'Topic to teach (subject, concept, or domain).' },
                num_questions: { type: 'integer', description: 'How many questions to generate.', default: 5 },
            },
            required: ['topic'],
        },
    },
    {
        name: 'teacher_improve',
        endpoint: 'improve',
        description:
            'Trigger a self-improvement cycle: re-runs the lowest-scored knowledge-base entries through the ASI pipeline and replaces them if the new score is higher. ' +
            'Use sparingly — this is expensive (one full ASI pass per entry) and normally runs on a nightly cron.',
        inputSchema: {
            type: 'object',
            properties: {
                num_entries: { type: 'integer', description: 'How many low-scored entries to re-process.', default: 3 },
            },
        },
    },
    {
        name: 'teacher_list_skills',
        endpoint: 'list_skills',
        description:
            'List available skills from the local Teacher skill library (.skills-library/). ' +
            'Returns skill names + short descriptions. Filter by category substring if given. Fast. ' +
            'Use this first if you are not sure which skill to pull with teacher_get_skill.',
        inputSchema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Optional case-insensitive substring filter on skill names.' },
            },
        },
    },
    {
        name: 'teacher_get_skill',
        endpoint: 'get_skill',
        description:
            'Return the full SKILL.md content of a named Teacher skill. Use to import the skill\'s know-how into the current conversation so Claude can apply it. ' +
            'If you don\'t know the exact name, call teacher_list_skills first.',
        inputSchema: {
            type: 'object',
            properties: {
                skill_name: { type: 'string', description: 'Exact skill name (directory name under .skills-library/).' },
            },
            required: ['skill_name'],
        },
    },
    {
        name: 'teacher_add_skill',
        endpoint: 'add_skill',
        description:
            'Write a new SKILL.md into the Teacher skill library. ' +
            'Pairs with the teacher-contribute-skill playbook: draft the skill in chat, get the user\'s explicit approval, THEN call this. ' +
            'Frontmatter is auto-injected if not supplied. Kebab-case name required. Hot-reloaded — the skill is callable via teacher_get_skill immediately after. ' +
            'Provenance fields (author, source_url, reason) are optional but strongly recommended — every write is recorded to the audit log and surfaces in anomaly scans.',
        inputSchema: {
            type: 'object',
            properties: {
                name:        { type: 'string',  description: 'Skill name in kebab-case (e.g. cold-email-founders). Used as directory name.' },
                description: { type: 'string',  description: 'One-line description for the SKILL.md frontmatter. ≤240 chars.' },
                content:     { type: 'string',  description: 'Full SKILL.md body. Frontmatter is auto-prepended if missing. ≤32,000 bytes.' },
                overwrite:   { type: 'boolean', description: 'Allow replacing an existing skill of the same name.', default: false },
                author:      { type: 'string',  description: 'Optional provenance: who produced this skill. ≤120 chars.' },
                source_url:  { type: 'string',  description: 'Optional provenance: http(s)://, file://, or absolute path where the material came from. ≤512 chars.' },
                reason:      { type: 'string',  description: 'Optional provenance: short "why this skill exists now" note. ≤500 chars.' },
            },
            required: ['name', 'description', 'content'],
        },
    },
    {
        name: 'teacher_status',
        endpoint: 'status',
        description:
            'Health-check the local Teacher ASI: knowledge-base stats, model availability (Ollama up?), agent count, recent scores, last improvement run. ' +
            'Fast. Call this if any other teacher_* tool errors or seems slow, and at the start of a long session to confirm the stack is reachable.',
        inputSchema: { type: 'object', properties: {} },
    },
];

const TOOLS_BY_NAME = new Map(TOOLS.map(t => [t.name, t]));

async function callTeacher(endpoint, params) {
    const url = `${TEACHER_URL}/tool/${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const headers = { 'Content-Type': 'application/json' };
    if (TEACHER_TOKEN) {
        headers.Authorization = `Bearer ${TEACHER_TOKEN}`;
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(params ?? {}),
            signal: controller.signal,
        });
        const text = await res.text();
        if (!res.ok) {
            return {
                _transport_error: true,
                status: res.status,
                statusText: res.statusText,
                body: text.slice(0, 2000),
                hint:
                    res.status === 404
                        ? `Tool endpoint not found at ${url}. Is the Teacher MCP server running? Try: python3 ~/local-asi/mcp-server.py`
                        : `Unexpected HTTP ${res.status}. Run teacher_status to check backend health.`,
            };
        }
        try {
            return JSON.parse(text);
        } catch {
            return { _non_json_response: true, body: text.slice(0, 2000) };
        }
    } catch (err) {
        return {
            _transport_error: true,
            message: err.name === 'AbortError' ? `Teacher-MCP call timed out after ${TIMEOUT_MS}ms` : String(err),
            url,
            hint: `Is the Teacher MCP server up at ${TEACHER_URL}? Start it with: python3 ~/local-asi/mcp-server.py`,
        };
    } finally {
        clearTimeout(timer);
    }
}

const server = new Server(
    { name: 'teacher-link', version: '1.0.0' },
    { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;
    const tool = TOOLS_BY_NAME.get(name);
    if (!tool) {
        return {
            isError: true,
            content: [{ type: 'text', text: `Unknown tool: ${name}. Known tools: ${TOOLS.map(t => t.name).join(', ')}` }],
        };
    }
    const result = await callTeacher(tool.endpoint, args ?? {});
    const isError = result && (result._transport_error || result.error);
    return {
        isError: Boolean(isError),
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});

const transport = new StdioServerTransport();
await server.connect(transport);
