export const motion = {
  duration: {
    fast: "120ms",
    normal: "200ms",
    slow: "320ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    entrance: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;
