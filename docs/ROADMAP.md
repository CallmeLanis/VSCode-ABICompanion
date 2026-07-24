# Roadmap & Advisory Questions

> This document is designed for AI assistants to help prioritize direction.
> Update the "Current priorities" section as decisions are made.

## Current priorities (owner to fill in)

- [ ] Decide: local-first only vs. optional cloud sync
- [ ] Simplify raid logging UX (biggest user friction?)
- [ ] Unify formatters (`economy.ts` as single source)
- [ ] Fix typecheck/lint baseline
- [ ] Remove or gate first-visit mock data

## Phase 1 — Polish core loop (recommended next)

**Goal:** Make raid logging fast and analytics trustworthy.

| Task | Impact | Effort |
|------|--------|--------|
| Raid form refactor (split RaidsPage into subcomponents) | Maintainability | Medium |
| Quick-log mode (minimal fields, expand for detail) | UX | Medium |
| Single formatter module | Consistency | Low |
| Mobile raid log layout | Accessibility | Medium |
| Empty state without mock data | Onboarding | Low |

## Phase 2 — Deeper intel

**Goal:** Help players make better in-game decisions.

| Feature | Description |
|---------|-------------|
| Map profitability ranking | Which maps/modes have best avg ROI over last N raids |
| Loadout recommendations | Gear page suggests setups based on historical ROI |
| Session goals | Set profit/KPI target per session, track live |
| Trend alerts | "Extraction rate dropped 20% this week" |
| Loot DB auto-suggest | Pre-fill loot values from DB when logging raid |

## Phase 3 — Platform expansion

| Option | Pros | Cons |
|--------|------|------|
| **PWA** | Offline, installable, no app store | Limited native APIs |
| **Supabase sync** | Backup, multi-device | Auth complexity, cost |
| **Tauri desktop** | Native feel, file system access | Separate build pipeline |
| **Squad/clan mode** | Social, shared stats | Scope explosion |

## Strategic questions for AI advisory

### Product

1. Is the primary user a **casual tracker** (quick log, simple stats) or **power analyst** (full investment breakdown)?
2. Should the app target **ABI only** or generalize to other extraction shooters?
3. What's the **minimum viable daily workflow** — log raid in <30 seconds?

### Technical

1. Is localStorage sufficient long-term (thousands of raids), or migrate to IndexedDB?
2. Should cloud sync be opt-in premium or free community feature?
3. Worth adding automated tests before new features?

### UX / Visual

1. Keep tactical HUD aesthetic or offer theme toggle?
2. Is the current information density right for mobile?
3. Should Overview remain the landing page or Raids (action-first)?

### Business (if applicable)

1. Free open-source community tool?
2. Donations / Ko-fi?
3. Premium cloud features?

## Known bugs / issues to track

| Issue | Severity | File(s) |
|-------|----------|---------|
| Duplicate currency formatters | Medium | `economy.ts`, `mockData.ts` |
| Typecheck failures (unused vars) | Low | Multiple pages |
| `RaidMode` type mismatch | Medium | `storage.ts` |
| shadcn light-theme body override conflict | Low | `index.css` |
| Performance page ROI always green | Low | `Performance.tsx` |

## Success metrics (suggested)

- Time to log a raid (target: <60 seconds)
- Weekly active logging sessions
- Data export/import usage (backup behavior)
- Pages per session (engagement depth)

## Changelog (high level)

| Date | Change |
|------|--------|
| 2026-07 | Tactical HUD design system unification |
| 2026-07 | shadcn/ui partial integration |
| 2026-06 | Initial BoltAI desync, VSCode-only development |
| Earlier | Core raid logging, economy charts, highlights |

---

**For AI:** When advising, please reference `docs/AI_CONTEXT.md` for full product context and ask the owner which phase aligns with their current goals and available time.
