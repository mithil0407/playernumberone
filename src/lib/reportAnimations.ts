// Shared Framer Motion animation config for the man report viewer

export const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };
export const SPRING_GENTLE = { type: 'spring' as const, stiffness: 220, damping: 26 };

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Viewport options for scroll-triggered animations
export const VIEWPORT_OPTS = { once: true, amount: 0.08 } as const;
