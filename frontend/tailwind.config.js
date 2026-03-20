/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          hover: '#15803d',
          dark: '#166534',
          light: '#dcfce7',
          glow: '#4ade80',
        },
        dark: {
          base: '#0f0f0f',
          sidebar: '#111111',
          card: '#1a1a1a',
          card2: '#222222',
          border: '#2a2a2a',
          border2: '#333333',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#d1d5db',
          muted: '#9ca3af',
          subtle: '#6b7280',
          green: '#4ade80',
        },
        brand: {
          50: '#ecfdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#14532d',
        },
        slate: {
          50: '#1a1a1a',
          100: '#222222',
          200: '#2a2a2a',
          300: '#333333',
          400: '#6b7280',
          500: '#9ca3af',
          600: '#d1d5db',
          700: '#e5e7eb',
          800: '#f3f4f6',
          900: '#f5f5f5',
        },
      },
    },
  },
  plugins: [],
};
