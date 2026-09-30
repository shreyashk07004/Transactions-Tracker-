export const durationTokens = {
  instant: 0.09, // seconds for motion
  fast: 0.15,
  base: 0.24,
  slow: 0.42,
  ambient: 18
};

export const easeTokens = {
  out: [0.16, 1, 0.30, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  in: [0.55, 0, 1, 0.45] as const
};

export const springSoft = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 28,
  mass: 0.9
};

export const springSnap = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.7
};
