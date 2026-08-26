/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101820",
        civic: {
          50: "#eef3f7",
          100: "#d7e3ec",
          200: "#aec6da",
          300: "#7fa4c1",
          400: "#4c7ea3",
          500: "#2c6188",
          600: "#1f4a6b",
          700: "#193c57",
          800: "#152f44",
          900: "#0f2333",
        },
        signal: {
          red: "#C4432B",
          amber: "#D98E2B",
          green: "#2E8B57",
        },
        paper: "#F3F1EC",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        blueprint:
          "linear-gradient(rgba(25,60,87,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(25,60,87,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};
