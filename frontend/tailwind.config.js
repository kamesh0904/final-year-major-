/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0616",
        foreground: "#e9e7ff",

        primary: "#8b5cf6",
        primaryGlow: "#a78bfa",

        card: "#120b22",
        border: "rgba(255,255,255,0.08)",
        muted: "#a1a1aa",
      },
      boxShadow: {
        glow: "0 0 40px rgba(139,92,246,0.45)",
        soft: "0 20px 60px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl: "16px",
      },
    },
  },
  plugins: [],
};
