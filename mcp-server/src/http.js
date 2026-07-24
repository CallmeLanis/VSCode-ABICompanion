#!/usr/bin/env node
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createAbiCompanionMcpServer } from './server.js';

const PORT = Number(process.env.PORT ?? 8787);
const app = express();

/** @type {Map<string, SSEServerTransport>} */
const transports = new Map();

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'abi-companion-mcp',
    endpoints: {
      sse: '/sse',
      message: '/message',
    },
  });
});

app.get('/sse', async (_req, res) => {
  const transport = new SSEServerTransport('/message', res);
  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);

  res.on('close', () => {
    transports.delete(sessionId);
  });

  const server = createAbiCompanionMcpServer();
  await server.connect(transport);
});

// ChatGPT expects SSE URLs that may end with a trailing slash
app.get('/sse/', async (_req, res) => {
  res.redirect(307, '/sse');
});

app.post('/message', express.json(), async (req, res) => {
  const sessionId = req.query.sessionId;
  if (typeof sessionId !== 'string') {
    res.status(400).json({ error: 'Missing sessionId query parameter' });
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: 'Unknown MCP session' });
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`ABI Companion MCP server listening on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log('Expose via HTTPS tunnel (ngrok/cloudflare) for ChatGPT Developer Mode.');
});
