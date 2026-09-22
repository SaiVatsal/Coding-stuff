/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          bg: "#FBF9F5",
          "bg-subtle": "#F5F2EB",
          "bg-hover": "#EFEBE3",
          dark: "#141414",
          charcoal: "#242424",
          text: "#2B2825",
          muted: "#6B665F",
          faint: "#9C978E",
          border: "#E7E2D8",
          "border-dark": "#C7C1B5",
          accent: "#9E4A28",
          "accent-hover": "#823C20",
          "accent-light": "#F7ECE6",
          green: "#2E5A36",
          "green-light": "#EDF5EE",
          gold: "#A87A2A",
          "gold-light": "#FBF5E9",
          red: "#B3261E",
          "red-light": "#FDF2F2",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        display: ["'Cinzel'", "'Playfair Display'", "serif"],
        sans: ["'Plus Jakarta Sans'", "'Inter'", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "6px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.04)",
        lift: "0 8px 30px rgba(0, 0, 0, 0.06)",
        drawer: "-4px 0 25px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-left": "slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
}
