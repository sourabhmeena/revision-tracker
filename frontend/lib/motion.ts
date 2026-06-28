import type { Transition, Variants } from "framer-motion";

/** Shared motion language — one rhythm/easing across the whole app. */

export const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 };
export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 30 };

/** Container that staggers its children in on mount. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

/** Item that fades + rises into place (deeper = enters from below). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: easeOut } },
};

/** Standard pressable feedback for tappable cards/buttons. */
export const pressable = {
  whileTap: { scale: 0.97 },
  transition: springSnappy,
};

/** Page-level enter transition. */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};
