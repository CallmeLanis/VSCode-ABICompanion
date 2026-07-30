import { useReducedMotion as useMotionReducedMotion } from 'motion/react';

/** True when the user prefers reduced motion (OS setting). */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}
