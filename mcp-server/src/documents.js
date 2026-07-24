import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main';

/** @type {{ id: string; title: string; relativePath: string; url: string; tags: string[] }[]} */
export const DOCUMENT_CATALOG = [
  {
    id: 'ai-context',
    title: 'ABI Companion — AI Project Context',
    relativePath: 'docs/AI_CONTEXT.md',
    url: `${GITHUB_RAW_BASE}/docs/AI_CONTEXT.md`,
    tags: ['context', 'vision', 'features', 'product'],
  },
  {
    id: 'architecture',
    title: 'ABI Companion — Architecture',
    relativePath: 'docs/ARCHITECTURE.md',
    url: `${GITHUB_RAW_BASE}/docs/ARCHITECTURE.md`,
    tags: ['architecture', 'data-flow', 'technical'],
  },
  {
    id: 'roadmap',
    title: 'ABI Companion — Roadmap & Advisory Questions',
    relativePath: 'docs/ROADMAP.md',
    url: `${GITHUB_RAW_BASE}/docs/ROADMAP.md`,
    tags: ['roadmap', 'priorities', 'product-direction'],
  },
  {
    id: 'file-index',
    title: 'ABI Companion — Source File Index',
    relativePath: 'docs/FILE_INDEX.md',
    url: `${GITHUB_RAW_BASE}/docs/FILE_INDEX.md`,
    tags: ['files', 'source', 'index'],
  },
  {
    id: 'mcp-setup',
    title: 'ABI Companion — MCP Setup for ChatGPT',
    relativePath: 'docs/MCP_SETUP.md',
    url: `${GITHUB_RAW_BASE}/docs/MCP_SETUP.md`,
    tags: ['mcp', 'chatgpt', 'setup'],
  },
  {
    id: 'llms-index',
    title: 'ABI Companion — LLM Index',
    relativePath: 'llms.txt',
    url: `${GITHUB_RAW_BASE}/llms.txt`,
    tags: ['llm', 'index'],
  },
  {
    id: 'readme',
    title: 'ABI Companion — README',
    relativePath: 'README.md',
    url: `${GITHUB_RAW_BASE}/README.md`,
    tags: ['readme', 'getting-started'],
  },
  {
    id: 'constitution',
    title: 'ABI Companion — Project Constitution',
    relativePath: '.cursor/rules/abi-companion-constitution.mdc',
    url: `${GITHUB_RAW_BASE}/.cursor/rules/abi-companion-constitution.mdc`,
    tags: ['rules', 'constitution', 'design-system'],
  },
];

const contentCache = new Map();

function readDocument(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

export function getDocumentById(id) {
  const entry = DOCUMENT_CATALOG.find((doc) => doc.id === id);
  if (!entry) return null;

  if (!contentCache.has(id)) {
    const text = readDocument(entry.relativePath);
    if (text == null) return null;
    contentCache.set(id, text);
  }

  return {
    id: entry.id,
    title: entry.title,
    url: entry.url,
    text: contentCache.get(id),
    metadata: {
      path: entry.relativePath,
      tags: entry.tags,
      liveDemo: 'https://callmelanis.github.io/VSCode-ABICompanion/',
      repository: 'https://github.com/CallmeLanis/VSCode-ABICompanion',
    },
  };
}

function scoreDocument(doc, queryTokens) {
  const entry = DOCUMENT_CATALOG.find((item) => item.id === doc.id);
  const body = getDocumentById(doc.id)?.text ?? '';
  const haystack = `${doc.title} ${entry?.tags.join(' ') ?? ''} ${body}`.toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    const matches = haystack.split(token).length - 1;
    score += matches;
    if (doc.title.toLowerCase().includes(token)) score += 3;
    if (entry?.tags.some((tag) => tag.includes(token))) score += 2;
  }
  return score;
}

export function searchDocuments(query) {
  const queryTokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

  const ranked = DOCUMENT_CATALOG.map((doc) => ({
    id: doc.id,
    title: doc.title,
    url: doc.url,
    score: scoreDocument(doc, queryTokens),
  }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  const results = (ranked.length > 0 ? ranked : DOCUMENT_CATALOG.map((doc) => ({
    id: doc.id,
    title: doc.title,
    url: doc.url,
    score: 0,
  }))).slice(0, 8);

  return results.map(({ id, title, url }) => ({ id, title, url }));
}
