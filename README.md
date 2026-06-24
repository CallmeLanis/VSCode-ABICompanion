# ABI Companion

Tactical raid-tracking dashboard for Arena Breakout Infinite. Log raids, track economy, review highlights, and monitor performance — all stored locally in your browser.

**Live demo:** [https://callmelanis.github.io/VSCode-ABICompanion/](https://callmelanis.github.io/VSCode-ABICompanion/)

[![Deploy to GitHub Pages](https://github.com/CallmeLanis/VSCode-ABICompanion/actions/workflows/deploy.yml/badge.svg)](https://github.com/CallmeLanis/VSCode-ABICompanion/actions/workflows/deploy.yml)

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
