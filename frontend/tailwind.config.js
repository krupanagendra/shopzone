/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        amazon: {
          DEFAULT: "#131921",
          blue: "#232f3e",
          yellow: "#febd69",
          orange: "#f90",
          light: "#37475a",
        }
      }
    },
  },
  plugins: [],
}
