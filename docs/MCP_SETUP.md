# MCP Setup — Connect ChatGPT to ABI Companion

This repo includes an MCP server that exposes project documentation to AI assistants.

## What it provides

| Tool | Purpose |
|------|---------|
| `search` | Search project docs (ChatGPT-compatible) |
| `fetch` | Read full document by id (ChatGPT-compatible) |
| `list_documents` | List all indexed docs |
| `get_project_summary` | Quick context for advisory chats |

Indexed documents:

- `docs/AI_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/FILE_INDEX.md`
- `llms.txt`
- `README.md`
- `.cursor/rules/abi-companion-constitution.mdc`

---

## Option A — Cursor (local, already configured)

File: `.cursor/mcp.json`

1. Install MCP server deps once:

```bash
cd mcp-server
npm install
```

2. Restart Cursor (or reload MCP servers in settings)
3. The `abi-companion` MCP server should appear with the tools above

---

## Option B — ChatGPT (requires HTTPS)

ChatGPT **cannot** connect to local stdio MCP directly. It needs a **remote HTTPS MCP URL** (SSE).

Requirements:

- ChatGPT Plus / Pro / Business / Enterprise / Edu
- **Developer Mode** enabled: Settings → Apps & Connectors → Advanced → Developer Mode

### Step 1 — Install and run HTTP MCP server

```bash
cd mcp-server
npm install
npm start
```

Server runs at:

- Health: `http://localhost:8787/health`
- SSE: `http://localhost:8787/sse`

### Step 2 — Expose via HTTPS tunnel

ChatGPT requires public HTTPS. Use one of:

**ngrok (quickest for testing):**

```bash
ngrok http 8787
```

Copy the HTTPS URL, e.g. `https://abc123.ngrok-free.app`

**ChatGPT MCP URL format:** `https://abc123.ngrok-free.app/sse`

**Cloudflare Tunnel (more stable):**

```bash
cloudflared tunnel --url http://localhost:8787
```

### Step 3 — Add app in ChatGPT

1. Settings → Apps & Connectors → **Create**
2. Name: `ABI Companion`
3. MCP server URL: `https://YOUR-TUNNEL-URL/sse`
4. Authentication: **No authentication** (for local/tunnel dev)
5. Save

### Step 4 — Enable in chat

1. New chat → **+** → Developer Mode → Add sources
2. Enable **ABI Companion**
3. Ask: *"Search ABI Companion docs for roadmap priorities and advise what to build next."*

---

## Option C — Deploy to Render (persistent HTTPS)

1. Create a new **Web Service** on Render
2. Connect this GitHub repo
3. Settings:
   - Root directory: `mcp-server`
   - Build: `npm install`
   - Start: `npm start`
4. Use Render URL in ChatGPT: `https://YOUR-SERVICE.onrender.com/sse`

---

## Suggested ChatGPT prompts

```
Use the ABI Companion MCP tools to search and fetch project docs.
Then advise me on product direction for the next 2 weeks.
Focus on: raid logging UX, local-first architecture, and tactical HUD consistency.
```

```
Search ABI Companion documentation for technical debt and roadmap phase 1.
Recommend the highest-impact improvements in priority order.
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| ChatGPT can't connect | URL must be **HTTPS** and end with `/sse` |
| No tools visible | Enable Developer Mode + add source in chat |
| Empty search results | Run server from repo root; docs must exist on disk |
| Cursor MCP not loading | Run `cd mcp-server && npm install`, restart Cursor |

---

## Architecture note

- **stdio** transport → Cursor (`.cursor/mcp.json`)
- **HTTP/SSE** transport → ChatGPT Apps / Connectors
- Docs are read from the local repo filesystem at runtime
- Deployed server should clone/pull latest `main` to stay in sync
