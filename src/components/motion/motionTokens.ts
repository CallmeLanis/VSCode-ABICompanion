/** Shared motion timing for cinematic tactical animations. */
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_DURATION = {
  fast: 0.2,
  base: 0.35,
  slow: 0.45,
  countUp: 0.75,
  chart: 1,
  step: 0.3,
} as const;

export const MOTION_STAGGER = {
  section: 0.06,
  card: 0.06,
  row: 0.035,
  listCap: 8,
} as const;

export const MOTION_OFFSET = {
  y: 12,
  x: 16,
} as const;

export const revealViewport = { once: true, amount: 0.2 as const };
