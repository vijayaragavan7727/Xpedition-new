import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        xp: {
          bg: {
            DEFAULT: 'var(--xp-bg-base)',
            subtle: 'var(--xp-bg-subtle)',
          },
          surface: {
            DEFAULT: 'var(--xp-surface)',
            elevated: 'var(--xp-surface-elevated)',
            interactive: 'var(--xp-surface-interactive)',
            glass: 'var(--xp-surface-glass)',
          },
          primary: {
            DEFAULT: 'var(--xp-primary)',
            hover: 'var(--xp-primary-hover)',
            active: 'var(--xp-primary-active)',
            soft: 'var(--xp-primary-soft)',
          },
          secondary: {
            DEFAULT: 'var(--xp-secondary)',
            hover: 'var(--xp-secondary-hover)',
            soft: 'var(--xp-secondary-soft)',
          },
          teal: {
            DEFAULT: '#004741',
            dark: '#00332E',
            secondary: '#075C55',
            light: '#0B7066',
          },
          cream: {
            DEFAULT: '#F0EDE4',
            secondary: '#E5E0D5',
            dark: '#D4CEBF',
          },
          accent: {
            purple: 'var(--xp-accent-purple)',
            'purple-soft': 'var(--xp-accent-purple-soft)',
            warm: 'var(--xp-accent-warm)',
            'warm-soft': 'var(--xp-accent-warm-soft)',
            sage: 'var(--xp-accent-sage)',
            'sage-soft': 'var(--xp-accent-sage-soft)',
            rose: 'var(--xp-accent-rose)',
            'rose-soft': 'var(--xp-accent-rose-soft)',
          },
          warm: {
            DEFAULT: 'var(--xp-accent-warm)',
            soft: 'var(--xp-accent-warm-soft)',
          },
          sage: {
            DEFAULT: 'var(--xp-accent-sage)',
            soft: 'var(--xp-accent-sage-soft)',
          },
          rose: {
            DEFAULT: 'var(--xp-accent-rose)',
            soft: 'var(--xp-accent-rose-soft)',
          },
          stage: {
            intro: 'var(--xp-stage-intro)',
            explain: 'var(--xp-stage-explain)',
            explore: 'var(--xp-stage-explore)',
            predict: 'var(--xp-stage-predict)',
            interact: 'var(--xp-stage-interact)',
            observe: 'var(--xp-stage-observe)',
            check: 'var(--xp-stage-check)',
            mission: 'var(--xp-stage-mission)',
            challenge: 'var(--xp-stage-challenge)',
            assessment: 'var(--xp-stage-assessment)',
            feedback: 'var(--xp-stage-feedback)',
            reward: 'var(--xp-stage-reward)',
            next: 'var(--xp-stage-next)',
          },
          buddy: {
            accent: 'var(--xp-buddy-accent)',
            bubble: 'var(--xp-buddy-bubble)',
          },
          xira: {
            accent: 'var(--xp-xira-accent)',
            card: 'var(--xp-xira-card)',
          },
          text: {
            primary: 'var(--xp-text-primary)',
            secondary: 'var(--xp-text-secondary)',
            muted: 'var(--xp-text-muted)',
            disabled: 'var(--xp-text-disabled)',
            inverse: 'var(--xp-text-inverse)',
            dark: '#080B0D',
          },
          border: {
            DEFAULT: '#263130',
            dark: '#263130',
            teal: '#17655E',
            subtle: 'var(--xp-border-subtle)',
            medium: 'var(--xp-border-medium)',
            strong: 'var(--xp-border-strong)',
            focus: 'var(--xp-border-focus)',
            interactive: 'var(--xp-border-interactive)',
          },
        },
        ink: 'var(--ink)',
        panel: 'var(--panel)',
        raised: 'var(--raised)',
        line: 'var(--line)',
        violet: {
          DEFAULT: 'var(--violet)',
          hot: 'var(--violet-hot)',
        },
        cyan: 'var(--cyan)',
        magenta: 'var(--magenta)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      borderRadius: {
        'xp-sm': 'var(--xp-radius-sm)',
        'xp-control': 'var(--xp-radius-control)',
        'xp-card': 'var(--xp-radius-card)',
        'xp-modal': 'var(--xp-radius-modal)',
        'xp-pill': 'var(--xp-radius-pill)',
      },
      boxShadow: {
        'xp-subtle': 'var(--xp-shadow-subtle)',
        'xp-elevated': 'var(--xp-shadow-elevated)',
        'xp-glass': 'var(--xp-shadow-glass)',
        'xp-primary-cta': 'var(--xp-shadow-primary-cta)',
      },
      transitionDuration: {
        'xp-instant': 'var(--xp-motion-instant)',
        'xp-fast': 'var(--xp-motion-fast)',
        'xp-normal': 'var(--xp-motion-normal)',
        'xp-slow': 'var(--xp-motion-slow)',
      },
      transitionTimingFunction: {
        'xp-out': 'var(--xp-ease-out)',
        'xp-spring': 'var(--xp-ease-spring)',
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        caveat: ['var(--font-caveat)', 'cursive'],
        kalam: ['var(--font-kalam)', 'cursive'],
      },
      letterSpacing: {
        wordmark: '0.16em',
        subtitle: '0.42em',
        eyebrow: '0.22em',
      },
    },
  },
  plugins: [],
};

export default config;
