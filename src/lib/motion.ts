// Central motion tokens — never hardcode durations/easings in components.
export const motion = {
  duration: {
    instant: 0.1,
    fast: 0.16,
    base: 0.24,
    slow: 0.36,
    emphasis: 0.52,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as [number, number, number, number],
    enter: [0, 0, 0, 1] as [number, number, number, number],
    exit: [0.3, 0, 1, 1] as [number, number, number, number],
  },
  spring: {
    soft: { type: "spring" as const, stiffness: 180, damping: 22 },
    snap: { type: "spring" as const, stiffness: 320, damping: 28 },
  },
  stagger: {
    tight: 0.04,
    base: 0.06,
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};
