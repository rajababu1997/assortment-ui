/**
 * Breakpoints matching tailwind.config.ts screens (standard Tailwind values).
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Returns true if the current window is wider than the given breakpoint. */
export function isAbove(bp: Breakpoint): boolean {
  return window.innerWidth >= BREAKPOINTS[bp];
}
