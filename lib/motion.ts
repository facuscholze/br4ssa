/** Shared motion language: one easing curve and one duration scale for the whole site. */

export const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** CSS-equivalent of EASE, for keyframe animations declared in class names. */
export const EASE_CSS = "cubic-bezier(.22,.61,.36,1)";

export const DURATION = {
  fast: 0.3,
  base: 0.45,
  slow: 0.7,
  slower: 0.8,
} as const;

export const STAGGER = {
  tight: 0.045,
  base: 0.09,
  loose: 0.1,
} as const;

/** Spring configs for `motion/react` gesture/pointer-linked motion (continuous
 *  physics, interruptible mid-motion) — e.g. magnetic hover, cursor follow.
 *  For discrete two-state UI transitions (button press, icon morph) prefer
 *  SPRING_CSS below; a JS spring is unnecessary overhead there. */
export const SPRING = {
  snappy: { stiffness: 420, damping: 28, mass: 0.5 },
  gentle: { stiffness: 200, damping: 24, mass: 0.6 },
} as const;

/** CSS overshoot curve approximating SPRING.snappy for discrete state
 *  transitions declared via Tailwind arbitrary values or plain CSS. */
export const SPRING_CSS = "cubic-bezier(0.34, 1.56, 0.64, 1)";
