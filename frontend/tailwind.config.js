/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy — the primary brand color. Chosen over a generic bright blue to read as a
        // serious financial/professional-services product rather than a generic AI demo.
        brand: {
          50: "#eef2f7",
          100: "#d7e0ec",
          200: "#b0c2da",
          300: "#82a0c4",
          400: "#5480ad",
          500: "#365e8c",
          600: "#274870",
          700: "#1d3657",
          800: "#16283f",
          900: "#0f1c2e",
        },
        // Warm bronze/gold — reserved for Premium accents and highlights ("mercado plata").
        accent: {
          50: "#fdf8ec",
          100: "#faf0d4",
          200: "#f3ddA4",
          300: "#eccb7a",
          400: "#dfae4c",
          500: "#c9922f",
          600: "#a8741f",
          700: "#855a18",
        },
      },
      fontFamily: {
        sans: [
          "'Inter'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 28 46 / 0.04), 0 1px 3px 0 rgb(15 28 46 / 0.08)",
        "card-hover": "0 4px 10px -2px rgb(15 28 46 / 0.10), 0 2px 6px -2px rgb(15 28 46 / 0.08)",
      },
    },
  },
  plugins: [],
};
