/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amazon: {
          DEFAULT: "#131921",
          blue: "#232f3e",
          yellow: "#febd69",
          orange: "#f90",
          light: "#37475a",
        },
        omnikart: {
          accent: "#FFB84D",
          dark: "#0a0e1a",
          light: "#E5E7EB",
          neon: "#00e5ff",
          aurora: "#7c3aed",
          ember: "#f97316",
          surface: "#111827",
          card: "#1e293b",
        }
      },
      animation: {
        'gradient-x': 'gradient-x 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 184, 77, 0.3), 0 0 20px rgba(255, 184, 77, 0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(255, 184, 77, 0.5), 0 0 40px rgba(255, 184, 77, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
