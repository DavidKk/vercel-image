import type { Config } from 'tailwindcss'

export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        studio: {
          chrome: {
            DEFAULT: 'var(--studio-chrome-bg)',
            fg: 'var(--studio-chrome-fg)',
            muted: 'var(--studio-chrome-fg-muted)',
            border: 'var(--studio-chrome-border)',
          },
          surface: {
            DEFAULT: 'var(--studio-surface-bg)',
            muted: 'var(--studio-surface-muted)',
            subtle: 'var(--studio-surface-subtle)',
            border: 'var(--studio-surface-border)',
            fg: 'var(--studio-surface-fg)',
            'fg-muted': 'var(--studio-surface-fg-muted)',
          },
          workspace: 'var(--studio-workspace-bg)',
          canvas: 'var(--studio-canvas-bg)',
          accent: {
            DEFAULT: 'var(--studio-accent)',
            hover: 'var(--studio-accent-hover)',
            muted: 'var(--studio-accent-muted)',
            fg: 'var(--studio-accent-fg)',
          },
          success: {
            DEFAULT: 'var(--studio-success)',
            muted: 'var(--studio-success-muted)',
            fg: 'var(--studio-success-fg)',
          },
          danger: {
            DEFAULT: 'var(--studio-danger)',
            muted: 'var(--studio-danger-muted)',
          },
        },
      },
      borderRadius: {
        'studio-sm': 'var(--studio-radius-sm)',
        'studio-md': 'var(--studio-radius-md)',
        'studio-lg': 'var(--studio-radius-lg)',
      },
      boxShadow: {
        'studio-sm': 'var(--studio-shadow-sm)',
        'studio-md': 'var(--studio-shadow-md)',
        'studio-pop': 'var(--studio-shadow-pop)',
      },
      width: {
        'studio-inspector': 'var(--studio-inspector-width)',
        'studio-library': 'var(--studio-library-width)',
      },
      keyframes: {
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-out': 'fade-out .26s forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
