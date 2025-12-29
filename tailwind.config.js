/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables for consistency
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          lighter: 'var(--color-primary-lighter)',
          dark: 'var(--color-primary-dark)',
          darker: 'var(--color-primary-darker)',
        },
        // Semantic colors
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          dark: 'var(--color-success-dark)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
          dark: 'var(--color-warning-dark)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
          dark: 'var(--color-error-dark)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          dark: 'var(--color-info-dark)',
        },
        // Neutral scale
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        // Text colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          light: 'var(--color-text-light)',
        },
        // Background colors
        bg: {
          main: 'var(--color-bg-main)',
          card: 'var(--color-bg-card)',
          accent: 'var(--color-bg-accent)',
          warm: 'var(--color-bg-warm)',
        },
        // Legacy brand colors (deprecated - use primary instead)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-mulish)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-fade-in': 'slide-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'wavey': 'wavey 1s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'mesh-drift': 'mesh-drift 12s ease-in-out infinite',
      },
      keyframes: {
        'slide-fade-in': {
          from: {
            opacity: '0',
            transform: 'translateY(15px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'wavey': {
          '0%, 100%': {
            transform: 'scaleY(0.2)',
          },
          '50%': {
            transform: 'scaleY(1.0)',
          },
        },
        'pulse-soft': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.7',
          },
        },
        'mesh-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(5%, -3%) scale(1.02)' },
          '50%': { transform: 'translate(-3%, 5%) scale(0.98)' },
          '75%': { transform: 'translate(-5%, -2%) scale(1.01)' },
        },
      },
      // Safe area insets for notched devices
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
  // Ensure dark mode support
  darkMode: 'class',
}

