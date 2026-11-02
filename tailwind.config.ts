import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        canvas: '#f4f5f9',
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 10px 30px -12px rgba(79,70,229,.14)',
        'soft-lg': '0 2px 4px rgba(15,23,42,.05), 0 24px 48px -16px rgba(79,70,229,.22)',
        glow: '0 8px 24px -6px rgba(99,102,241,.55)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '50%': { transform: 'translate3d(0,-12px,0) rotate(4deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '50%': { transform: 'translate3d(6px,-16px,0) rotate(-5deg)' },
        },
        'slide-x': {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-50%,0,0)' },
        },
        'dash-flow': {
          to: { strokeDashoffset: '-28' },
        },
        'shadow-pulse': {
          '0%, 100%': { transform: 'scaleX(1)', opacity: '0.25' },
          '50%': { transform: 'scaleX(0.82)', opacity: '0.14' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'orbit-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'slide-x-slow': 'slide-x 60s linear infinite',
        'slide-x-mid': 'slide-x 40s linear infinite',
        'slide-x-fast': 'slide-x 26s linear infinite',
        'dash-flow': 'dash-flow 1.2s linear infinite',
        'shadow-pulse': 'shadow-pulse 4s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        'orbit-spin': 'orbit-spin 0.9s linear infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
