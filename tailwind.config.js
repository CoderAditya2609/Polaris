/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          100: '#f6ead2',
          200: '#ecd9b4',
          300: '#e2c79a',
          400: '#d3b07c',
          500: '#c39a63',
          600: '#a87d4a',
        },
        ink: {
          900: '#0b0912',
          800: '#12101c',
          700: '#1a1726',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      boxShadow: {
        glass: '0 24px 60px -20px rgba(0,0,0,0.65)',
        polaroid: '0 18px 35px -12px rgba(0,0,0,0.7)',
        glow: '0 0 40px -8px rgba(226,199,154,0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        fadeUp: 'fadeUp 0.5s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
