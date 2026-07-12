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
          50: "#FFF5F1",
          100: "#FDE7DF",
          200: "#F9CBBB",
          300: "#F3A58D",
          400: "#EA805F",
          500: "#E06B45",
          600: "#C65333",
          700: "#A5412B",
          800: "#873726",
          900: "#6E3023",
        },

        ink: {
          50: "#F3F6F8",
          100: "#E2E8EC",
          200: "#C4D0D8",
          300: "#98ACB9",
          400: "#658193",
          500: "#456276",
          600: "#354D60",
          700: "#2C3F4F",
          800: "#243441",
          900: "#172A3A",
        },

        gold: {
          50: "#FCF8EA",
          100: "#F7EDC5",
          200: "#EFD98C",
          300: "#E5C052",
          400: "#D8A43B",
          500: "#C88A29",
          600: "#AC6921",
          700: "#8A4D20",
          800: "#713D20",
          900: "#5F341E",
        },

        surface: {
          page: "#F7F5F1",
          card: "#FFFFFF",
          muted: "#F0EDE7",
        },

        line: "#E7E2DA",

        text: {
          primary: "#19232D",
          secondary: "#6D7680",
          muted: "#98A0A8",
        },

        success: "#2E8B70",
        danger: "#D94B4B",
        warning: "#D8A43B",
      },

      fontFamily: {
        sans: ["Alexandria", "Tajawal", "Arial", "sans-serif"],
      },

      borderRadius: {
        card: "18px",
        control: "12px",
      },

      boxShadow: {
        card: "0 12px 32px rgba(23, 42, 58, 0.06)",
        floating: "0 18px 50px rgba(23, 42, 58, 0.12)",
        control: "0 4px 14px rgba(23, 42, 58, 0.05)",
      },

      keyframes: {
        fadeUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(12px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        fadeUp: "fadeUp 500ms ease-out both",
      },
    },
  },

  plugins: [],
};