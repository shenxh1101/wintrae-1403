/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E8EDF3",
          100: "#C5D1DF",
          200: "#9EB3CA",
          300: "#7695B5",
          400: "#597DA5",
          500: "#3C6595",
          600: "#365D8D",
          700: "#2E5282",
          800: "#274878",
          900: "#1E3A5F",
          950: "#152944",
        },
        accent: {
          gold: "#D4AF37",
          "gold-light": "#E8C96B",
          "gold-dark": "#B8922E",
          teal: "#5B8C5A",
          "teal-light": "#7BAE7A",
          "teal-dark": "#4A7349",
        },
        background: {
          cream: "#F8F5F0",
          warm: "#FAF7F2",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#2C2C2C",
        },
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: "0 2px 12px rgba(30, 58, 95, 0.08)",
        "card-hover": "0 8px 24px rgba(30, 58, 95, 0.12)",
        soft: "0 1px 3px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "shake": "shake 0.4s ease-in-out",
        "scan-line": "scanLine 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
