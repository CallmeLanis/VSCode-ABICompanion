#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createAbiCompanionMcpServer } from './server.js';

const server = createAbiCompanionMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
