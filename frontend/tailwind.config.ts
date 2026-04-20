
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        headline: ['var(--font-manrope)', 'Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        // ─── Obsidian Lens — tokens visuais ─────────────────────────────────
        surface: {
          DEFAULT: '#0c1324',
          dim: '#0c1324',
          container: '#191f31',
          'container-low': '#151b2d',
          'container-high': '#23293c',
          'container-highest': '#2e3447',
        },
        'on-surface': '#dce1fb',
        tertiary: '#ffb95f',
        // ─── Shadcn UI — aliases CSS var ─────────────────────────────────────
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: '#c0c1ff',
          container: '#8083ff',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: '#4edea3',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        error: {
          DEFAULT: '#ffb4ab',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // ─── SPIN Selling — cores semânticas ────────────────────────────────
        spin: {
          situation: {
            DEFAULT: 'hsl(var(--spin-situation))',
            foreground: 'hsl(var(--spin-situation-foreground))',
          },
          problem: {
            DEFAULT: 'hsl(var(--spin-problem))',
            foreground: 'hsl(var(--spin-problem-foreground))',
          },
          implication: {
            DEFAULT: 'hsl(var(--spin-implication))',
            foreground: 'hsl(var(--spin-implication-foreground))',
          },
          need: {
            DEFAULT: 'hsl(var(--spin-need))',
            foreground: 'hsl(var(--spin-need-foreground))',
          },
        },
        // ─── Status de chamada ───────────────────────────────────────────────
        status: {
          success: {
            DEFAULT: 'hsl(var(--status-success))',
            foreground: 'hsl(var(--status-success-foreground))',
          },
          warning: {
            DEFAULT: 'hsl(var(--status-warning))',
            foreground: 'hsl(var(--status-warning-foreground))',
          },
          error: {
            DEFAULT: 'hsl(var(--status-error))',
            foreground: 'hsl(var(--status-error-foreground))',
          },
          info: {
            DEFAULT: 'hsl(var(--status-info))',
            foreground: 'hsl(var(--status-info-foreground))',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // ─── Z-index scale para App Shell ─────────────────────────────────────
      zIndex: {
        header: '50',
        sidebar: '40',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
