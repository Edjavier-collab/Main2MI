/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Primary brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'slide-fade-in': 'slide-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'wavey': 'wavey 1s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
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

