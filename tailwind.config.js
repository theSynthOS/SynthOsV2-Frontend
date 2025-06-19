/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        "first": "first 15s ease infinite",
        "second": "second 15s ease infinite",
      },
      keyframes: {
        first: {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "25%": { transform: "translate(5%, 5%) scale(1.05)" },
          "50%": { transform: "translate(2%, -3%) scale(0.95)" },
          "75%": { transform: "translate(-5%, 3%) scale(1.02)" },
          "100%": { transform: "translate(0%, 0%) scale(1)" }
        },
        second: {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "25%": { transform: "translate(-5%, -3%) scale(1.05)" },
          "50%": { transform: "translate(3%, 5%) scale(0.95)" },
          "75%": { transform: "translate(5%, -5%) scale(1.02)" },
          "100%": { transform: "translate(0%, 0%) scale(1)" }
        },
      },
    },
  },
  plugins: [],
} 