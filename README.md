# ABI Companion

Tactical raid-tracking dashboard for Arena Breakout Infinite. Log raids, track economy, review highlights, and monitor performance — all stored locally in your browser.

**Live demo:** [https://callmelanis.github.io/VSCode-ABICompanion/](https://callmelanis.github.io/VSCode-ABICompanion/)

[![Deploy to GitHub Pages](https://github.com/CallmeLanis/VSCode-ABICompanion/actions/workflows/deploy.yml/badge.svg)](https://github.com/CallmeLanis/VSCode-ABICompanion/actions/workflows/deploy.yml)

## For AI assistants (ChatGPT, Claude, etc.)

GitHub repo browser links are **not readable** by AI crawlers. Use these **raw text links** instead:

| Document | Link |
|----------|------|
| **Start here** — project context | [docs/AI_CONTEXT.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/AI_CONTEXT.md) |
| Architecture | [docs/ARCHITECTURE.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ARCHITECTURE.md) |
| Roadmap & questions | [docs/ROADMAP.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ROADMAP.md) |
| Source file index | [docs/FILE_INDEX.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/FILE_INDEX.md) |
| LLM index | [llms.txt](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/llms.txt) |
| **MCP setup (ChatGPT)** | [docs/MCP_SETUP.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/MCP_SETUP.md) |

**Copy-paste prompt for ChatGPT** (enable Browse/Web):

```
Read these docs about my ABI Companion project:
1. https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/AI_CONTEXT.md
2. https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ARCHITECTURE.md
3. https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ROADMAP.md

Live demo: https://callmelanis.github.io/VSCode-ABICompanion/

Advise me on product direction, what to build next, and UX improvements.
```

## Run locally

**Requirements:** Node.js 20+ and npm

```bash
git clone https://github.com/CallmeLanis/VSCode-ABICompanion.git
cd VSCode-ABICompanion
npm ci
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Other scripts

| Command | Description |
| --- | --- |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Deploy to GitHub Pages

This repo is configured for automatic deployment on every push to `main`.

### One-time setup

1. Push this repository to GitHub.
2. Open **Settings → Pages** in the repo on GitHub.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually from the Actions tab).

The site will be published at:

`https://<your-github-username>.github.io/VSCode-ABICompanion/`

If your repo name differs, update the `homepage` field in `package.json` to match.

### Manual deploy (optional)

You can also publish from your machine with the `gh-pages` branch:

```bash
npm run deploy
```

Then set **Settings → Pages → Source** to the `gh-pages` branch.

## Data storage

All raid data is stored in the browser's `localStorage`. Nothing is sent to a server unless you explicitly use import/export features.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- GitHub Pages + GitHub Actions
