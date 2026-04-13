// Shared Framer Motion animation config for the man report viewer
import type { Variants, Transition } from 'framer-motion';

const CUBIC: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export const SPRING: Transition = { type: 'spring', stiffness: 400, damping: 30 };
export const SPRING_GENTLE: Transition = { type: 'spring', stiffness: 220, damping: 26 };

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: CUBIC },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: CUBIC },
  },
};

// Viewport options for scroll-triggered animations
export const VIEWPORT_OPTS = { once: true, amount: 0.08 } as const;
