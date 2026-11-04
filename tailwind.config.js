/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F1F8F5',
          100: '#E0EFE9',
          200: '#BFDCD1',
          300: '#8DBBAA',
          400: '#5C9A85',
          500: '#3B7663',
          600: '#2A5E4C',
          700: '#1F4A3B',
          800: '#16382C',
          900: '#0F2A21',
          950: '#0A1F18',
        },
        cream: {
          50: '#FCFAF5',
          100: '#F7F2E7',
          200: '#EFE6D3',
          300: '#E2D5BB',
        },
        caramel: {
          400: '#C9A06A',
          500: '#B38550',
          600: '#8F6A3C',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
