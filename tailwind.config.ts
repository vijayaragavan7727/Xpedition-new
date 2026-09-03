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
          },
          primary: {
            DEFAULT: 'var(--xp-primary)',
            hover: 'var(--xp-primary-hover)',
            soft: 'var(--xp-primary-soft)',
          },
          secondary: {
            DEFAULT: 'var(--xp-secondary)',
            soft: 'var(--xp-secondary-soft)',
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
          text: {
            primary: 'var(--xp-text-primary)',
            secondary: 'var(--xp-text-secondary)',
            muted: 'var(--xp-text-muted)',
          },
          border: {
            subtle: 'var(--xp-border-subtle)',
            medium: 'var(--xp-border-medium)',
            focus: 'var(--xp-border-focus)',
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
      backgroundImage: {
        'signature-gradient': 'linear-gradient(96deg, var(--cyan), var(--violet) 55%, #F472F6)',
      },
    },
  },
  plugins: [],
};

export default config;
