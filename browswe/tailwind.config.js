/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        april: {
          bg: "#0a0a0f",
          surface: "#141420",
          card: "#1c1c2e",
          border: "#2a2a3e",
          primary: "#7c3aed",
          "primary-light": "#a78bfa",
          accent: "#06b6d4",
          text: "#e4e4e7",
          muted: "#71717a",
          danger: "#ef4444",
          success: "#22c55e",
          warning: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "slide-in": "slideIn 200ms ease-out",
        "slide-out": "slideOut 200ms ease-in",
        "fade-in": "fadeIn 150ms ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOut: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124, 58, 237, 0)" },
          "50%": { boxShadow: "0 0 16px 3px rgba(124, 58, 237, 0.25)" },
        },
      },
    },
  },
  plugins: [],
};
