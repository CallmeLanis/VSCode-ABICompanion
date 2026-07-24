import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DOCUMENT_CATALOG, getDocumentById, searchDocuments } from './documents.js';

function structuredText(payload) {
  const text = JSON.stringify(payload);
  return {
    structuredContent: payload,
    content: [{ type: 'text', text }],
  };
}

export function createAbiCompanionMcpServer() {
  const server = new McpServer({
    name: 'abi-companion',
    version: '1.0.0',
  });

  // ChatGPT company-knowledge compatible tools
  server.tool(
    'search',
    'Search ABI Companion project documentation (context, architecture, roadmap, constitution).',
    {
      query: z.string().describe('Search query about the project'),
    },
    async ({ query }) => {
      const results = searchDocuments(query);
      return structuredText({ results });
    },
  );

  server.tool(
    'fetch',
    'Fetch the full text of an ABI Companion document by id from search results.',
    {
      id: z.string().describe('Document id returned by search'),
    },
    async ({ id }) => {
      const doc = getDocumentById(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }
      return structuredText({
        id: doc.id,
        title: doc.title,
        text: doc.text,
        url: doc.url,
        metadata: doc.metadata,
      });
    },
  );

  // Extra tools for Cursor and advanced ChatGPT sessions
  server.tool(
    'list_documents',
    'List all ABI Companion documents available through this MCP server.',
    {},
    async () => {
      return structuredText({
        documents: DOCUMENT_CATALOG.map(({ id, title, url, tags }) => ({
          id,
          title,
          url,
          tags,
        })),
        liveDemo: 'https://callmelanis.github.io/VSCode-ABICompanion/',
        repository: 'https://github.com/CallmeLanis/VSCode-ABICompanion',
      });
    },
  );

  server.tool(
    'get_project_summary',
    'Return a concise ABI Companion project summary for advisory conversations.',
    {},
    async () => {
      const context = getDocumentById('ai-context');
      const roadmap = getDocumentById('roadmap');
      const summary = [
        context?.text?.split('\n').slice(0, 80).join('\n') ?? '',
        '',
        '---',
        '',
        roadmap?.text?.split('\n').slice(0, 40).join('\n') ?? '',
      ].join('\n');

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    },
  );

  return server;
}
