/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0A0B',
        'bg-secondary': '#111113',
        'bg-tertiary': '#1A1A1F',
        'border-custom': '#1F1F28',
        'text-primary': '#F0F0F0',
        'text-secondary': '#8B8B9A',
        'accent-custom': '#5E6AD2',
        'accent-hover': '#6B78E5',
        'success-custom': '#2DA44E',
        'warning-custom': '#F0A732',
        'error-custom': '#F85149',
        'terminal-bg': '#0D0D10',
      },
      fontFamily: {
        ui: ['Inter', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
