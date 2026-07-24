# ABI Companion — AI Project Context

> **Purpose of this document:** Give AI assistants (ChatGPT, Claude, etc.) enough context to advise on product direction, architecture, and UX — without needing access to the GitHub repo browser UI.

## What is this project?

**ABI Companion** is a tactical raid-tracking dashboard for **Arena Breakout Infinite** (ABI). Players log raids, track economy (profit/loss, ROI, ammo/consumable spend), review highlights, analyze performance by map/mode, and manage a personal loot database.

**Live demo:** https://callmelanis.github.io/VSCode-ABICompanion/

**Repository:** https://github.com/CallmeLanis/VSCode-ABICompanion

## Product vision

Build a **premium tactical AAA game HUD** experience — not a generic admin dashboard. Think Arena Breakout / Escape from Tarkov operational intel panels:

- Data-dense but readable
- Warm dark palette, Oxanium typography
- Semantic colors: green = profit/success, red = loss/danger, orange = accent/brand
- Local-first: all data in browser `localStorage`, no server required for core use

## Target user

ABI players who want to:

1. Log every raid with investment breakdown (ammo, consumables, gear, rescue)
2. See cumulative P/L, spend breakdown, extraction rate over time
3. Identify best maps, modes, sessions, and gear loadouts
4. Track notable raids (high profit, high kills, rare loot)
5. Maintain a personal loot value database for vendor decisions

## Current feature set

| Area | Status | Notes |
|------|--------|-------|
| Raid logging | ✅ Core | Full form: map, mode, status, ammo tiers, consumables, gear rescue, loot |
| Overview dashboard | ✅ | KPIs, latest highlight, best session, recent raids timeline |
| Economy analytics | ✅ | Cumulative P/L chart, spend donut, ammo/consumable leaderboards |
| Sessions | ✅ | Auto-grouped play sessions with drill-down |
| Highlights | ✅ | Profit/kills/rare/manual categories, favorites |
| Performance | ✅ | Breakdown by map, mode, time-of-day |
| Gear page | ✅ | Loadout/investment tracking |
| Loot DB | ✅ | Personal item database with vendor pricing |
| Commander profile | ✅ | Player stats summary |
| Settings | ✅ | Tax rate, thresholds, import/export, data reset |
| Cloud sync | ❌ Not wired | `@supabase/supabase-js` in deps but unused |
| Multi-user / auth | ❌ | Local-only |
| Mobile UX | ⚠️ Partial | Responsive layout exists, raid log form is dense |

## Navigation structure

```
Ops:      Overview → Raids → Sessions → Highlights
Intel:    Economy → Gear → Performance → Loot DB
Unit:     Commander → Settings
```

Note: `dashboard` route redirects to `economy` (duplicate removed).

## Data model (summary)

### Raid (central entity)

```
Raid {
  id, timestamp, map, mode, status (EXTRACTED|DIED|FLED), duration
  ammo[], consumables[], gearValue, gearRescue?, loot[], lootValue
  kills, deaths
  investment, netProfit, roi  (calculated)
  sessionId, isHighlight, highlightCategory?, highlightReason?
}
```

### Session

Aggregated from raids in a time window: total profit, investment, loot, extraction rate, raid count.

### Highlight

Reference to a raid with category (profit/kills/rare/manual), reason text, favorite flag.

### LootDBItem

Personal catalog: name, base value, vendor prices, rarity, notes.

**Storage keys:** `abi_raids`, `abi_sessions`, `abi_highlights`, `abi_lootdb`, `abi_settings` in localStorage.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + custom CSS tokens in `src/index.css` |
| UI kit | shadcn/ui (partial integration), custom HUD components |
| Icons | Lucide React |
| Font | Oxanium Variable (single family, tabular nums for metrics) |
| Deploy | GitHub Pages + GitHub Actions |
| Backend | None (localStorage); Supabase available for future |

## Design system (recent)

Unified tactical HUD tokens:

- Typography roles: `type-display-xl`, `type-display-l`, `type-heading`, `type-label`, `type-body`, `type-caption`, `type-data`, `type-badge`
- Semantic text: `text-primary`, `text-secondary`, `text-muted`, `text-positive`, `text-negative`, `text-warning`, `text-accent`
- React primitives: `DisplayValue`, `DataValue`, `MapName`, `MetaLabel`, `Caption`, `StatusBadge` in `src/components/ui/`

## Known technical debt

1. **Duplicate formatters** — `src/utils/economy.ts` vs `src/utils/mockData.ts` (currency/percentage formatting split across pages)
2. **Typecheck/lint errors** — Pre-existing unused imports, `any` types, `RaidMode` type mismatch in `storage.ts`
3. **Three color systems** — ABI tokens, shadcn oklch, raw Tailwind greens/reds still partially present (migration in progress)
4. **No tests** — Zero unit/integration test coverage
5. **Mock data on first visit** — Generates demo raids; may confuse new users
6. **Large raid log form** — `RaidsPage.tsx` is ~1300 lines, monolithic

## Open questions (for AI advisory)

1. **Product direction:** Should this stay local-first forever, or add optional cloud sync (Supabase)?
2. **Scope:** Focus on solo raid tracking, or expand to squad/clan features?
3. **Monetization:** Free tool for community, or premium features (cloud backup, advanced analytics)?
4. **Platform:** Web-only, or PWA / desktop wrapper (Tauri/Electron)?
5. **Data import:** Support official ABI API/export if available, or manual-only?
6. **UX priority:** Simplify raid logging flow vs. keep full detail for power users?
7. **Analytics depth:** Add predictive models (map profitability forecast) or keep descriptive stats?

## How to read source code (for AI)

GitHub repo browser URLs (`github.com/.../tree/main/...`) are **not readable** by crawlers. Use these instead:

| Resource | URL |
|----------|-----|
| This file | `https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/AI_CONTEXT.md` |
| Architecture | `https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ARCHITECTURE.md` |
| Roadmap | `https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ROADMAP.md` |
| File index | `https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/FILE_INDEX.md` |
| LLM index | `https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/llms.txt` |
| Live demo | `https://callmelanis.github.io/VSCode-ABICompanion/` |

## Suggested ChatGPT prompt

Copy-paste this into ChatGPT (with Browse enabled):

```
I'm building ABI Companion, a tactical raid tracker for Arena Breakout Infinite.

Please read these documents in order:
1. https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/AI_CONTEXT.md
2. https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ARCHITECTURE.md
3. https://raw.githubusercontent.com/CallmeLanis/VSCode-ABICompanion/main/docs/ROADMAP.md

Live demo: https://callmelanis.github.io/VSCode-ABICompanion/

Based on the project context and roadmap questions, advise me on:
- Product direction (local-first vs cloud, scope, monetization)
- What to build next (priority order)
- UX improvements for raid logging
- Technical debt to address first

Ask clarifying questions if needed.
```
