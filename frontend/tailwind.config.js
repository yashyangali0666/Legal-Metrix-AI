/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govNavy: {
          50: '#F0F3F9',
          100: '#E2E8F0',
          500: '#1E293B',
          800: '#0F172A',
          900: '#101828',
          950: '#0B0F19',
        },
        deepBlue: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          light: '#DBEAFE',
        },
        electricBlue: {
          DEFAULT: '#3B82F6',
          glow: '#60A5FA',
        },
        cyanAccent: {
          DEFAULT: '#06B6D4',
          dark: '#0891B2',
          light: '#CFFAFE',
        },
        pageBg: '#F5F7FB',
        pageBgDark: '#0B0F19',
        cardBgDark: '#111827',
        successGreen: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#15803D',
        },
        warningAmber: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
        },
        errorRed: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 12px 28px -4px rgba(16, 24, 40, 0.12)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.35)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
      },
    },
  },
  plugins: [],
}
