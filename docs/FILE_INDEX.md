# Source File Index

> All links use `raw.githubusercontent.com` so AI assistants and crawlers can read them directly.
> Base: `https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/`

## Entry & config

| File | Description | Raw link |
|------|-------------|----------|
| `src/App.tsx` | Root component, page routing, first-visit mock data | [App.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/App.tsx) |
| `src/main.tsx` | React DOM mount | [main.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/main.tsx) |
| `src/index.css` | Design tokens, HUD styles, typography system | [index.css](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/index.css) |
| `vite.config.ts` | Vite + path aliases | [vite.config.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/vite.config.ts) |
| `tailwind.config.js` | Tailwind theme (abi colors, fonts) | [tailwind.config.js](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/tailwind.config.js) |
| `package.json` | Dependencies & scripts | [package.json](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/package.json) |

## Pages

| File | Description | Raw link |
|------|-------------|----------|
| `Overview.tsx` | Mission control dashboard | [Overview.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Overview.tsx) |
| `RaidsPage.tsx` | Raid list, filters, log form (~1300 lines) | [RaidsPage.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/RaidsPage.tsx) |
| `Economy.tsx` | P/L chart, spend breakdown | [Economy.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Economy.tsx) |
| `Sessions.tsx` | Session cards + detail modal | [Sessions.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Sessions.tsx) |
| `Highlights.tsx` | Highlight feed | [Highlights.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Highlights.tsx) |
| `Performance.tsx` | Map/mode/time analytics | [Performance.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Performance.tsx) |
| `Gear.tsx` | Gear/loadout tracking | [Gear.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Gear.tsx) |
| `LootDB.tsx` | Personal loot database | [LootDB.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/LootDB.tsx) |
| `Commander.tsx` | Player profile stats | [Commander.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Commander.tsx) |
| `Settings.tsx` | App settings, import/export | [Settings.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Settings.tsx) |
| `Dashboard.tsx` | Legacy dashboard (partial) | [Dashboard.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/Dashboard.tsx) |
| `RaidDetailPopup.tsx` | Raid detail modal | [RaidDetailPopup.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/RaidDetailPopup.tsx) |
| `LogRaidModal.tsx` | Alternate raid log modal | [LogRaidModal.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/pages/LogRaidModal.tsx) |

## Components

| File | Description | Raw link |
|------|-------------|----------|
| `Navigation.tsx` | Sidebar + mobile nav | [Navigation.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/Navigation.tsx) |
| `ui/index.ts` | UI kit exports | [index.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/index.ts) |
| `ui/Typography.tsx` | DisplayValue, DataValue, MapName, etc. | [Typography.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/Typography.tsx) |
| `ui/Badge.tsx` | Badge, Tag, ProgressBar | [Badge.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/Badge.tsx) |
| `ui/StatusBadge.tsx` | EXTRACTED/DIED/FLED badge | [StatusBadge.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/StatusBadge.tsx) |
| `ui/Card.tsx` | Card, StatCard, SectionCard | [Card.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/Card.tsx) |
| `ui/Button.tsx` | Button (shadcn hybrid) | [Button.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/Button.tsx) |
| `ui/PageHeader.tsx` | Page title component | [PageHeader.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/ui/PageHeader.tsx) |
| `dashboard/DashboardWidgets.tsx` | Dashboard widget cards | [DashboardWidgets.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/dashboard/DashboardWidgets.tsx) |
| `MergeDataBlock.tsx` | Import/export UI block | [MergeDataBlock.tsx](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/components/MergeDataBlock.tsx) |

## Utils & data

| File | Description | Raw link |
|------|-------------|----------|
| `types/index.ts` | All TypeScript interfaces | [index.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/types/index.ts) |
| `utils/storage.ts` | localStorage CRUD | [storage.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/utils/storage.ts) |
| `utils/analytics.ts` | Computed metrics & charts data | [analytics.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/utils/analytics.ts) |
| `utils/economy.ts` | Formatters (canonical) | [economy.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/utils/economy.ts) |
| `utils/mockData.ts` | Mock generators + legacy formatters | [mockData.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/utils/mockData.ts) |
| `utils/dataMerge.ts` | Import/export merge logic | [dataMerge.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/utils/dataMerge.ts) |
| `hooks/useStorageQuery.ts` | React hooks for storage | [useStorageQuery.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/hooks/useStorageQuery.ts) |
| `data/constants.ts` | Maps, modes, ammo calibers, colors | [constants.ts](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/src/data/constants.ts) |

## Documentation (AI-readable)

| File | Description | Raw link |
|------|-------------|----------|
| `docs/AI_CONTEXT.md` | Full project context for AI | [AI_CONTEXT.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/AI_CONTEXT.md) |
| `docs/ARCHITECTURE.md` | Technical architecture | [ARCHITECTURE.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ARCHITECTURE.md) |
| `docs/ROADMAP.md` | Roadmap & advisory questions | [ROADMAP.md](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ROADMAP.md) |
| `llms.txt` | LLM discovery index | [llms.txt](https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/llms.txt) |
