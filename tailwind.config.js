/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#E11D70",
          light: "#FFF9FA",
          dark: "#BE185D",
        },
      },
    },
  },
  plugins: [],
};