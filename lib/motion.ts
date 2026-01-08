/**
 * Framer Motion Variants & Animation Utilities
 * GW1 Builds Design System
 *
 * Provides crisp, snappy animations across all components.
 * All animations respect prefers-reduced-motion.
 */

import type { Variants, Transition } from 'framer-motion'

// ============================================
// TIMING CONSTANTS - Crisp & Responsive
// ============================================

export const MOTION_DURATION = {
  instant: 0.08, // 80ms - barely perceptible
  fast: 0.12, // 120ms - crisp and snappy
  normal: 0.15, // 150ms - standard modern duration
  slow: 0.25, // 250ms - still quick but noticeable
} as const

export const MOTION_EASE = {
  /** Standard deceleration - use for most animations */
  out: [0, 0, 0.2, 1] as const,
  /** Smooth both ways - use for toggles/reversible */
  inOut: [0.4, 0, 0.2, 1] as const,
  /** Snappy spring-like - buttons and interactive elements */
  snappy: [0.25, 0.1, 0.25, 1] as const,
} as const

export const MOTION_STAGGER = {
  fast: 0.02, // 20ms - tight cascade
  normal: 0.035, // 35ms - moderate
  slow: 0.05, // 50ms - leisurely
} as const

// ============================================
// HOVER LIFT - Signature sticky-note effect
// Refined for crisp, subtle movement
// ============================================

export const hoverLiftVariants: Variants = {
  rest: {
    y: 0,
    x: 0,
    boxShadow: '3px 3px 0 rgba(0, 0, 0, 0.3)',
  },
  hover: {
    y: -1.5,
    x: -1.5,
    boxShadow: '5px 5px 0 rgba(0, 0, 0, 0.25)',
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
  tap: {
    y: 0.5,
    x: 0.5,
    boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.35)',
    transition: {
      duration: MOTION_DURATION.instant,
    },
  },
}

// Without shadow (for elements that handle shadow separately)
export const hoverLiftTransformOnly: Variants = {
  rest: {
    y: 0,
    x: 0,
  },
  hover: {
    y: -1.5,
    x: -1.5,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
  tap: {
    y: 0.5,
    x: 0.5,
    transition: {
      duration: MOTION_DURATION.instant,
    },
  },
}

// ============================================
// SKILL BAR STAGGER ANIMATION
// Tight cascade for quick appearance
// ============================================

export const skillBarContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION_STAGGER.fast,
      delayChildren: 0.05,
    },
  },
}

export const skillSlotVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// FADE IN/OUT
// ============================================

export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.out,
    },
  },
}

// Fade with slight scale
export const fadeScaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// MODAL / DROPDOWN
// ============================================

export const modalOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATION.fast,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATION.instant,
    },
  },
}

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.out,
    },
  },
}

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: -2,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -2,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// LIST STAGGER
// ============================================

export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION_STAGGER.normal,
      delayChildren: 0.05,
    },
  },
}

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}

// Grid stagger (for build cards)
export const gridContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION_STAGGER.normal,
      delayChildren: 0.08,
    },
  },
}

export const gridItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// TOOLTIP
// ============================================

export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 2,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.out,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: MOTION_DURATION.instant,
    },
  },
}

// ============================================
// BUTTON PRESS
// ============================================

export const buttonPressVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1,
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: MOTION_DURATION.instant,
    },
  },
}

// ============================================
// UTILITY TRANSITIONS
// ============================================

export const defaultTransition: Transition = {
  duration: MOTION_DURATION.normal,
  ease: MOTION_EASE.out,
}

export const fastTransition: Transition = {
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE.out,
}

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
}

// ============================================
// COPY SUCCESS ANIMATION
// ============================================

export const copySuccessVariants: Variants = {
  idle: {
    scale: 1,
  },
  success: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.2,
      times: [0, 0.5, 1],
      ease: MOTION_EASE.out,
    },
  },
}

// ============================================
// GOLD GLOW (for elite skills)
// ============================================

export const goldGlowVariants: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(232, 184, 73, 0)',
  },
  glow: {
    boxShadow: '0 0 16px rgba(232, 184, 73, 0.3)',
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
  glowIntense: {
    boxShadow: '0 0 24px rgba(232, 184, 73, 0.5)',
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.out,
    },
  },
}
