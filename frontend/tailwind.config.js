/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#09090b',
          subtle: '#0c0c10',
          elevated: '#121217',
          card: '#16161d',
          hover: '#1d1d26',
        },
        surface: {
          50: '#272733',
          100: '#1f1f2a',
          200: '#181822',
          300: '#13131a',
          400: '#0e0e14',
        },
        gold: {
          50: '#fbf7ee',
          100: '#f5ecd5',
          200: '#ebd9a8',
          300: '#dec073',
          400: '#d4af37',
          500: '#b89228',
          600: '#96711e',
          700: '#75541a',
          800: '#5e431a',
          900: '#4e371a',
          accent: '#e5c07b',
          glow: 'rgba(212, 175, 55, 0.15)',
        },
        editor: {
          bg: '#0f0f14',
          sidebar: '#0a0a0f',
          activeTab: '#16161f',
          inactiveTab: '#0d0d12',
          border: '#1e1e28',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.3)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.2)',
        'card-glow': '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
