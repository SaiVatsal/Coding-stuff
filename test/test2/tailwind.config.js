/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aura Smart Stadium OS - Premium Brand Palette (Vibrant Blue Theme)
        brand: {
          50: '#eff6ff',   // sky-50 inspired vibrant blue tint
          100: '#dbeafe',  // light blue accents
          200: '#bfdbfe',  // subtle hover states
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Primary brand blue - vibrant action color
          600: '#2563eb',  // Primary hover/active
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',  // Dark brand elements
        },
        surface: {
          page: '#f8fafc',   // Clean light background
          card: '#ffffff',
          border: '#f1f5f9', // Subtle borders
          darkPage: '#0f172a',      // Slate-900 for night mode pages
        },
      },
    },
  },
  plugins: [],
}
