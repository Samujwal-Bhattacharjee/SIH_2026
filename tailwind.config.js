/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F8F8F5',
        'paper-light': '#FFFFFF',
        'paper-dark': '#EEEEEC',
        surface: '#FFFFFF',
        'surface-subtle': '#F2F3F5',
        'surface-hover': '#ECEEF2',
        ink: {
          950: '#0B0C0E',
          900: '#111215',
          800: '#1F2329',
          700: '#2E3440',
          600: '#475060',
          500: '#647082',
          400: '#8E99A8',
          300: '#C2C8D1',
          200: '#E2E5EB',
          100: '#F1F3F6',
        },
        border: {
          hairline: '#E2E5EB',
          subtle: '#D1D6E0',
          dark: '#1F2329',
        },
        vermilion: {
          DEFAULT: '#D9381E',
          hover: '#C22D15',
          subtle: '#FEF2F0',
          border: '#F8A99B',
        },
        amberRisk: {
          DEFAULT: '#D97706',
          subtle: '#FFFBEB',
          border: '#FDE68A',
        },
        sageSuccess: {
          DEFAULT: '#15803D',
          subtle: '#F0FDF4',
          border: '#BBF7D0',
        },
        navyInfo: {
          DEFAULT: '#1D4ED8',
          subtle: '#EFF6FF',
          border: '#BFDBFE',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Geist"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Geist Mono"', '"Space Mono"', 'monospace'],
        display: ['"Inter"', '"Geist"', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
        '3xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.02em',
        widestTechnical: '0.12em',
      },
      boxShadow: {
        'subtle-1': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'subtle-2': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevation': '0 4px 12px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
