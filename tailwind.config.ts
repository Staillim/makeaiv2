import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "#050508",
        surface:  "#0e0e16",
        surface2: "#161622",
        surface3: "#1e1e2e",
        accent:   "#7c5cfc",
        accent2:  "#f43f8e",
        accent3:  "#06d6a0",
        border:   "rgba(255,255,255,0.06)",
      },
      fontFamily: {
        head: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
      },
      animation: {
        "fade-in":   "fadeIn 0.4s ease",
        "slide-up":  "slideUp 0.3s ease",
        "pulse-dot": "pulseDot 2s infinite",
        "shimmer":   "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn:   { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:  { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
        shimmer:  { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(100%)" } },
      },
    },
  },
  plugins: [],
};
export default config;
