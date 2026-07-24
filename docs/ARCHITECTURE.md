# Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────┐
│  App.tsx (router via state, not react-router)           │
│  ├── Navigation (sidebar, mobile drawer)                │
│  └── Page components (Overview, Raids, Economy, …)      │
└─────────────────────────────────────────────────────────┘
         │ reads/writes                    │ renders
         ▼                                 ▼
┌─────────────────────┐          ┌─────────────────────┐
│  useStorageQuery    │          │  UI components      │
│  (React hooks)      │          │  src/components/ui/ │
└─────────────────────┘          └─────────────────────┘
         │
         ▼
┌─────────────────────┐          ┌─────────────────────┐
│  storage.ts         │◄────────►│  dataStore.ts       │
│  (localStorage)     │          │  (query invalidation)│
└─────────────────────┘          └─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  analytics.ts       │
│  (derived metrics)  │
└─────────────────────┘
```

## Routing

No `react-router`. `App.tsx` holds `currentPage` state and renders pages via switch:

| Page ID | Component | Purpose |
|---------|-----------|---------|
| `overview` | `Overview.tsx` | Mission control KPIs |
| `raids` | `RaidsPage.tsx` | Raid list + log form |
| `sessions` | `Sessions.tsx` | Play session groups |
| `highlights` | `Highlights.tsx` | Notable raids |
| `economy` | `Economy.tsx` | Financial charts |
| `gear` | `Gear.tsx` | Loadout tracking |
| `performance` | `Performance.tsx` | Map/mode stats |
| `lootdb` | `LootDB.tsx` | Item database |
| `commander` | `Commander.tsx` | Player profile |
| `settings` | `SettingsPage.tsx` | Config + import/export |

`dashboard` redirects to `economy`.

## Data flow

### Write path (logging a raid)

1. User fills raid form in `RaidsPage.tsx`
2. Investment calculated: ammo + consumables + gear − rescue
3. `netProfit = lootValue − investment`, `roi = netProfit / investment`
4. `addRaid()` or `updateRaid()` in `storage.ts`
5. `invalidateQueries()` triggers hook re-fetch
6. Session auto-assignment via `getSessionId()` based on time gap
7. Highlight auto-detection if thresholds met (settings)

### Read path (dashboard)

1. Page mounts → `useRaids()`, `useAggregatedSessions()`, etc.
2. Hooks read from `localStorage` via `storage.ts`
3. `analytics.ts` computes curves, breakdowns, leaderboards
4. Components render with formatters from `economy.ts` or `mockData.ts`

## Storage schema

| Key | Type | Description |
|-----|------|-------------|
| `abi_raids` | `Raid[]` | All raid records |
| `abi_sessions` | `Session[]` | Aggregated sessions |
| `abi_highlights` | `Highlight[]` | Highlight metadata |
| `abi_lootdb` | `LootDBItem[]` | Personal loot catalog |
| `abi_settings` | `AppSettings` | Tax rate, thresholds, session duration |
| `abi_analytics_cache` | `AnalyticsCache` | Optional computed cache |
| `abi_has_visited` | `"true"` | First-visit mock data flag |

## Key utilities

| File | Role |
|------|------|
| `storage.ts` | CRUD for all entities, migration helpers |
| `dataStore.ts` | Pub/sub query invalidation for hooks |
| `analytics.ts` | `calculateProfitCurve`, `calculateSpendBreakdown`, `calculateAmmoUsage`, etc. |
| `economy.ts` | `formatCurrency`, `formatPercentage`, `formatDateTime` |
| `mockData.ts` | Mock generators + duplicate formatters (legacy) |
| `dataMerge.ts` | JSON import/export validation and merge |

## UI component layers

```
src/components/ui/          ← Shared primitives (Button, Card, Badge, Typography, …)
src/components/dashboard/   ← Dashboard-specific widgets (legacy, partially used)
src/components/highlights/  ← Highlight detail modal
src/components/Navigation.tsx
src/pages/*.tsx             ← Full page views
```

### Typography primitives (design system)

- `DisplayValue` — hero KPI numbers (xl/l size)
- `DataValue` — table/cell numeric values
- `MapName` — map title styling
- `MetaLabel` — uppercase 10px labels
- `Caption` — timestamps, metadata
- `StatusBadge` — EXTRACTED / DIED / FLED pills

## Styling architecture

1. **CSS variables** in `src/index.css` `:root` — semantic tokens
2. **Tailwind config** — `abi.*` color palette, font aliases
3. **Component classes** — `.hud-card`, `.hud-label`, `.type-*` roles
4. **Legacy bridge** — `.text-green-400` etc. mapped to semantic tokens during migration

## Build & deploy

```
npm run build → vite build → dist/
GitHub Actions (deploy.yml) → push to gh-pages or GitHub Pages artifact
postbuild → writes .nojekyll for SPA routing
```

Base path: `/VSCode-ABICompanion/` (configured in `vite.config.ts`).

## Dependencies worth noting

| Package | Status |
|---------|--------|
| `@supabase/supabase-js` | Installed, not integrated |
| `shadcn` + `@base-ui/react` | Partial UI kit integration |
| `@fontsource-variable/oxanium` | Active font |
| `lucide-react` | All icons |

## Extension points (for future architecture)

1. **Backend layer:** Add `src/services/api.ts` wrapping Supabase for sync
2. **State management:** Consider Zustand/Jotai if localStorage pub/sub becomes insufficient
3. **Routing:** react-router if URL-based navigation needed
4. **Testing:** Vitest + Testing Library for storage/analytics unit tests
5. **PWA:** vite-plugin-pwa for offline install
