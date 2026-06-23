import type { Variants } from 'framer-motion';

// Fuse timing constants
const ENTER = { duration: 0.225, ease: [0.0, 0.0, 0.2, 1] as const };  // deceleration
const EXIT  = { duration: 0.195, ease: [0.4, 0.0, 1.0, 1] as const };  // acceleration

// Directional offsets
const D = 24;      // px — subtle offset for fade directional variants
const S = '100%';  // full offset for slide variants

// ─── Fade variants ───────────────────────────────────────────────────────────
export const fadeIn: Variants       = { hidden: { opacity: 0 },          visible: { opacity: 1, transition: ENTER } };
export const fadeOut: Variants      = { visible: { opacity: 1 },         hidden:  { opacity: 0, transition: EXIT  } };
export const fadeInTop: Variants    = { hidden: { opacity: 0, y: -D },   visible: { opacity: 1, y: 0, transition: ENTER } };
export const fadeInBottom: Variants = { hidden: { opacity: 0, y:  D },   visible: { opacity: 1, y: 0, transition: ENTER } };
export const fadeInLeft: Variants   = { hidden: { opacity: 0, x: -D },   visible: { opacity: 1, x: 0, transition: ENTER } };
export const fadeInRight: Variants  = { hidden: { opacity: 0, x:  D },   visible: { opacity: 1, x: 0, transition: ENTER } };
export const fadeOutTop: Variants    = { visible: { opacity: 1, y:  0 }, hidden:  { opacity: 0, y: -D, transition: EXIT } };
export const fadeOutBottom: Variants = { visible: { opacity: 1, y:  0 }, hidden:  { opacity: 0, y:  D, transition: EXIT } };
export const fadeOutLeft: Variants   = { visible: { opacity: 1, x:  0 }, hidden:  { opacity: 0, x: -D, transition: EXIT } };
export const fadeOutRight: Variants  = { visible: { opacity: 1, x:  0 }, hidden:  { opacity: 0, x:  D, transition: EXIT } };

// ─── Slide variants (full offset) ────────────────────────────────────────────
export const slideInTop: Variants     = { hidden: { y: `-${S}`, opacity: 0 }, visible: { y: 0, opacity: 1, transition: ENTER } };
export const slideInBottom: Variants  = { hidden: { y:  S,      opacity: 0 }, visible: { y: 0, opacity: 1, transition: ENTER } };
export const slideInLeft: Variants    = { hidden: { x: `-${S}`, opacity: 0 }, visible: { x: 0, opacity: 1, transition: ENTER } };
export const slideInRight: Variants   = { hidden: { x:  S,      opacity: 0 }, visible: { x: 0, opacity: 1, transition: ENTER } };
export const slideOutTop: Variants    = { visible: { y: 0, opacity: 1 }, hidden: { y: `-${S}`, opacity: 0, transition: EXIT } };
export const slideOutBottom: Variants = { visible: { y: 0, opacity: 1 }, hidden: { y:  S,      opacity: 0, transition: EXIT } };
export const slideOutLeft: Variants   = { visible: { x: 0, opacity: 1 }, hidden: { x: `-${S}`, opacity: 0, transition: EXIT } };
export const slideOutRight: Variants  = { visible: { x: 0, opacity: 1 }, hidden: { x:  S,      opacity: 0, transition: EXIT } };

// ─── Zoom variants ────────────────────────────────────────────────────────────
export const zoomIn: Variants  = { hidden: { scale: 0, opacity: 0 },  visible: { scale: 1, opacity: 1, transition: ENTER } };
export const zoomOut: Variants = { visible: { scale: 1, opacity: 1 }, hidden:  { scale: 0, opacity: 0, transition: EXIT  } };

// ─── Expand/collapse (height accordion) ──────────────────────────────────────
export const expandCollapse: Variants = {
  hidden:  { height: 0, opacity: 0, overflow: 'hidden', transition: EXIT  },
  visible: { height: 'auto', opacity: 1, overflow: 'hidden', transition: ENTER },
};

// ─── Shake (validation error feedback) ───────────────────────────────────────
export const shake: Variants = {
  hidden:  { x: 0 },
  visible: { x: [0, -10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } },
};

// ─── Convenience: all variants in one object (mirrors fuseAnimations array) ──
export const fuseVariants = {
  fadeIn, fadeOut,
  fadeInTop, fadeInBottom, fadeInLeft, fadeInRight,
  fadeOutTop, fadeOutBottom, fadeOutLeft, fadeOutRight,
  slideInTop, slideInBottom, slideInLeft, slideInRight,
  slideOutTop, slideOutBottom, slideOutLeft, slideOutRight,
  zoomIn, zoomOut,
  expandCollapse, shake,
} as const;

export type AnimationKey = keyof typeof fuseVariants;
