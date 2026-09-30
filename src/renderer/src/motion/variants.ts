import { Variants } from 'motion/react';
import { easeTokens } from './tokens';

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.20,
      ease: easeTokens.out
    }
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: 0.12,
      ease: easeTokens.in
    }
  }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

export const statCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: easeTokens.out
    }
  }
};

export const suggestionStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045
    }
  }
};

export const suggestionCardVariants: Variants = {
  initial: {
    opacity: 0,
    x: -10
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.22,
      ease: easeTokens.out
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.18,
      ease: easeTokens.in
    }
  }
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalPanelVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 12
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 32,
      mass: 0.7
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.12,
      ease: easeTokens.in
    }
  }
};

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 24,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 240,
      damping: 28,
      mass: 0.9
    }
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: easeTokens.in
    }
  }
};
