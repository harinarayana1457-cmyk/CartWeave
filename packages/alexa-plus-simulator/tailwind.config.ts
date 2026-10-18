import type { Config } from 'tailwindcss';

/**
 * CartWeave design tokens (generated with ui-ux-pro-max --design-system):
 * Style: Glassmorphism on dark slate • Type: Plus Jakarta Sans • CTA: status green.
 * All semantic colors resolve to CSS variables declared in globals.css so
 * opacity modifiers (e.g. bg-surface/70) keep working.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        card: token('card'),
        muted: token('muted'),
        line: token('line'),
        fg: token('fg'),
        'fg-muted': token('fg-muted'),
        brand: token('brand'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        alexa: {
          cyan: '#00CAFF',
          indigo: '#6366F1',
          deep: '#070B14',
          panel: '#0F1626',
          card: '#131C31',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 32px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(34,211,238,0.25), 0 8px 40px -8px rgba(34,211,238,0.35)',
        'glow-accent': '0 8px 24px -8px rgba(34,197,94,0.55)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'typing-dot': {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-2px)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fade-up 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'spin-slow': 'spin-slow 6s linear infinite',
        'spin-fast': 'spin-slow 1.6s linear infinite',
        wave: 'wave 900ms ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'typing-dot': 'typing-dot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
