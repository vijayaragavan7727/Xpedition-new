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
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
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
