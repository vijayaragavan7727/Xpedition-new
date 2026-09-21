/**
 * XPEDITION DESIGN SYSTEM TOKENS
 * Design Direction: "Design 1 — Dark, Immersive, 3D Focus"
 * Centralized, typed single source of truth for design tokens.
 */

export const XP_COLORS = {
  // Viewport & Surfaces
  bg: {
    base: '#060B18',
    subtle: '#0A1024',
    surface: '#0E152E',
    elevated: '#141D3D',
    interactive: '#1A254D',
    glass: 'rgba(14, 21, 46, 0.78)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
  },

  // Brand Palette
  brand: {
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    primaryActive: '#4338CA',
    primarySoft: 'rgba(99, 102, 241, 0.15)',
    primaryGlow: 'rgba(99, 102, 241, 0.45)',

    secondary: '#0EA5E9',
    secondaryHover: '#0284C7',
    secondarySoft: 'rgba(14, 165, 233, 0.15)',
    secondaryGlow: 'rgba(14, 165, 233, 0.4)',

    purple: '#8B5CF6',
    purpleSoft: 'rgba(139, 92, 246, 0.15)',
    warm: '#F59E0B',
    warmSoft: 'rgba(245, 158, 11, 0.14)',
    sage: '#10B981',
    sageSoft: 'rgba(16, 185, 129, 0.14)',
    rose: '#F43F5E',
    roseSoft: 'rgba(244, 63, 94, 0.14)',
  },

  // Text Hierarchy
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
    disabled: '#475569',
    inverse: '#020617',
  },

  // Class Stages (Unified Learning Session)
  stage: {
    intro: {
      color: '#38BDF8',
      soft: 'rgba(56, 189, 248, 0.14)',
      label: 'Introduce',
      defaultCta: 'Explore Hook →',
    },
    explain: {
      color: '#818CF8',
      soft: 'rgba(129, 140, 248, 0.14)',
      label: 'Explain',
      defaultCta: 'See How It Works →',
    },
    explore: {
      color: '#06B6D4',
      soft: 'rgba(6, 182, 212, 0.14)',
      label: 'Explore',
      defaultCta: 'Got it → Predict',
    },
    predict: {
      color: '#F59E0B',
      soft: 'rgba(245, 158, 11, 0.14)',
      label: 'Predict',
      defaultCta: 'Confirm Prediction',
    },
    interact: {
      color: '#6366F1',
      soft: 'rgba(99, 102, 241, 0.15)',
      label: 'Interact',
      defaultCta: 'Test Parameters',
    },
    observe: {
      color: '#14B8A6',
      soft: 'rgba(20, 184, 166, 0.14)',
      label: 'Observe',
      defaultCta: 'Continue to Check →',
    },
    check: {
      color: '#10B981',
      soft: 'rgba(16, 185, 129, 0.14)',
      label: 'Quick Check',
      defaultCta: 'Submit Answer',
    },
    mission: {
      color: '#F59E0B',
      soft: 'rgba(245, 158, 11, 0.14)',
      label: 'Mission',
      defaultCta: 'Start Mission',
    },
    challenge: {
      color: '#EC4899',
      soft: 'rgba(236, 72, 153, 0.14)',
      label: 'Challenge',
      defaultCta: 'Try Now',
    },
    assessment: {
      color: '#8B5CF6',
      soft: 'rgba(139, 92, 246, 0.14)',
      label: 'Assessment',
      defaultCta: 'Submit Evaluation',
    },
    feedback: {
      color: '#0EA5E9',
      soft: 'rgba(14, 165, 233, 0.14)',
      label: 'Feedback',
      defaultCta: 'Claim Rewards →',
    },
    reward: {
      color: '#FBBF24',
      soft: 'rgba(251, 191, 36, 0.16)',
      label: 'Reward',
      defaultCta: 'Next Class →',
    },
    next: {
      color: '#6366F1',
      soft: 'rgba(99, 102, 241, 0.15)',
      label: 'Next Class',
      defaultCta: 'Start Next Class',
    },
  },

  // AI Entities
  ai: {
    buddy: {
      accent: '#38BDF8',
      glow: 'rgba(56, 189, 248, 0.25)',
      bubbleBg: 'rgba(15, 23, 42, 0.88)',
      bubbleBorder: 'rgba(56, 189, 248, 0.3)',
    },
    xira: {
      accent: '#818CF8',
      glow: 'rgba(129, 140, 248, 0.25)',
      cardBg: 'rgba(19, 26, 54, 0.85)',
      cardBorder: 'rgba(129, 140, 248, 0.35)',
    },
  },

  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#F43F5E',
    info: '#38BDF8',
    skipped: '#64748B',
  },
} as const;

export type ClassStageKey = keyof typeof XP_COLORS.stage;

export const XP_SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '0.75rem', // 12px
  lg: '1rem',    // 16px
  xl: '1.5rem',  // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  touchMin: '44px', // Minimum interactive touch target size
} as const;

export const XP_RADII = {
  sm: '0.5rem',      // 8px
  control: '0.75rem',// 12px
  card: '1rem',      // 16px
  modal: '1.5rem',   // 24px
  pill: '9999px',
} as const;

export const XP_SHADOWS = {
  subtle: '0 4px 20px -4px rgba(0, 0, 0, 0.4)',
  elevated: '0 12px 36px -6px rgba(0, 0, 0, 0.6)',
  glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
  primaryCta: '0 6px 24px -2px rgba(99, 102, 241, 0.45)',
  buddyGlow: '0 0 24px -2px rgba(56, 189, 248, 0.25)',
  xiraGlow: '0 0 24px -2px rgba(129, 140, 248, 0.25)',
} as const;

export const XP_MOTION = {
  instant: '75ms',
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
