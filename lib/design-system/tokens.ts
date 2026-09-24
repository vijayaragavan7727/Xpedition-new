/**
 * XPEDITION DESIGN SYSTEM TOKENS
 * Brand Identity: Black + Teal + Cream + White
 * Canonical, typed single source of truth for design tokens.
 */

export const XP_COLORS = {
  // Viewport & Surfaces (Foundation: Near-black and Dark Surfaces)
  bg: {
    base: '#080B0D',             // Primary background (near-black)
    subtle: '#0F1415',           // Secondary background
    surface: '#151B1B',          // Dark surface
    elevated: '#1B2221',         // Muted surface / raised elements
    interactive: '#263130',      // Interactive hover / subtle border
    cream: '#F0EDE4',            // Warm cream content highlight
    creamSecondary: '#E5E0D5',   // Cream secondary surface
    glass: 'rgba(21, 27, 27, 0.92)',
    glassBorder: '#263130',
  },

  // Brand Palette (Teal Identity + Cream Highlights)
  brand: {
    primary: '#004741',          // Teal primary
    primaryHover: '#075C55',     // Teal secondary
    primaryActive: '#0B7066',    // Teal light
    primarySoft: 'rgba(7, 92, 85, 0.20)',
    primaryGlow: 'transparent',

    secondary: '#075C55',        // Teal secondary
    secondaryHover: '#0B7066',   // Teal light
    secondarySoft: 'rgba(11, 112, 102, 0.18)',
    secondaryGlow: 'transparent',

    teal: '#004741',
    tealDark: '#00332E',
    tealSecondary: '#075C55',
    tealLight: '#0B7066',

    cream: '#F0EDE4',
    creamSecondary: '#E5E0D5',
    creamDark: '#D4CEBF',

    purple: '#075C55',           // Normalized to Teal Secondary
    purpleSoft: 'rgba(7, 92, 85, 0.15)',
    warm: '#E5E0D5',             // Normalized to Cream Secondary
    warmSoft: 'rgba(240, 237, 228, 0.15)',
    sage: '#0B7066',             // Normalized to Teal Light
    sageSoft: 'rgba(11, 112, 102, 0.15)',
    rose: '#A83232',             // Restrained muted rose for danger/errors
    roseSoft: 'rgba(168, 50, 50, 0.15)',
  },

  // Typography Hierarchy
  text: {
    primary: '#FFFFFF',          // Pure white for dark surfaces
    secondary: '#8E9693',        // Secondary muted text
    muted: '#636C69',            // Dim text & disabled indicators
    disabled: '#3D4645',         // Inactive items
    inverse: '#080B0D',          // Primary dark text over cream/white surfaces
    dark: '#080B0D',             // Explicit dark text token
    cream: '#F0EDE4',            // Cream text accent
  },

  // Borders
  border: {
    dark: '#263130',
    subtle: '#263130',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: '#17655E',
    teal: '#17655E',
    focus: '#0B7066',
  },

  // Class Stages (Unified Learning Session - Normalized Palette)
  stage: {
    intro: {
      color: '#0B7066',
      soft: 'rgba(11, 112, 102, 0.15)',
      label: 'Introduce',
      defaultCta: 'Explore Hook →',
    },
    explain: {
      color: '#E5E0D5',
      soft: 'rgba(240, 237, 228, 0.12)',
      label: 'Explain',
      defaultCta: 'See How It Works →',
    },
    explore: {
      color: '#075C55',
      soft: 'rgba(7, 92, 85, 0.18)',
      label: 'Explore',
      defaultCta: 'Got it → Predict',
    },
    predict: {
      color: '#F0EDE4',
      soft: 'rgba(240, 237, 228, 0.15)',
      label: 'Predict',
      defaultCta: 'Confirm Prediction',
    },
    interact: {
      color: '#0B7066',
      soft: 'rgba(11, 112, 102, 0.18)',
      label: 'Interact',
      defaultCta: 'Test Parameters',
    },
    observe: {
      color: '#075C55',
      soft: 'rgba(7, 92, 85, 0.16)',
      label: 'Observe',
      defaultCta: 'Continue to Check →',
    },
    check: {
      color: '#0B7066',
      soft: 'rgba(11, 112, 102, 0.16)',
      label: 'Quick Check',
      defaultCta: 'Submit Answer',
    },
    mission: {
      color: '#E5E0D5',
      soft: 'rgba(240, 237, 228, 0.15)',
      label: 'Mission',
      defaultCta: 'Start Mission',
    },
    challenge: {
      color: '#F0EDE4',
      soft: 'rgba(240, 237, 228, 0.18)',
      label: 'Challenge',
      defaultCta: 'Try Now',
    },
    assessment: {
      color: '#075C55',
      soft: 'rgba(7, 92, 85, 0.18)',
      label: 'Assessment',
      defaultCta: 'Submit Evaluation',
    },
    feedback: {
      color: '#0B7066',
      soft: 'rgba(11, 112, 102, 0.15)',
      label: 'Feedback',
      defaultCta: 'Claim Rewards →',
    },
    reward: {
      color: '#F0EDE4',
      soft: 'rgba(240, 237, 228, 0.20)',
      label: 'Reward',
      defaultCta: 'Next Class →',
    },
    next: {
      color: '#075C55',
      soft: 'rgba(7, 92, 85, 0.18)',
      label: 'Next Class',
      defaultCta: 'Start Next Class',
    },
  },

  // AI Entities (Unified Xpedition System)
  ai: {
    buddy: {
      accent: '#38BDF8',
      glow: 'transparent',
      bubbleBg: '#151B1B',
      bubbleBorder: '#263130',
    },
    xira: {
      accent: '#004741',
      glow: 'transparent',
      cardBg: '#151B1B',
      cardBorder: '#17655E',
    },
  },

  // Semantic Status Colors (Harmonized)
  status: {
    success: '#075C55',
    warning: '#C29B38',
    error: '#A83232',
    info: '#0B7066',
    skipped: '#636C69',
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
  control: '0.625rem', // 10px
  card: '0.75rem',   // 12px
  modal: '1rem',     // 16px
  pill: '9999px',
} as const;

export const XP_SHADOWS = {
  subtle: '0 2px 8px 0 rgba(0, 0, 0, 0.35)',
  elevated: '0 8px 24px -4px rgba(0, 0, 0, 0.55)',
  glass: '0 4px 16px 0 rgba(0, 0, 0, 0.40)',
  primaryCta: '0 2px 10px 0 rgba(0, 0, 0, 0.45)',
  buddyGlow: 'none',
  xiraGlow: 'none',
} as const;

export const XP_MOTION = {
  instant: '75ms',
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
