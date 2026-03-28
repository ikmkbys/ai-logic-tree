import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F5F0E3",
          dark: "#EDE7D3",
        },
        ink: {
          DEFAULT: "#2C2416",
          soft: "#5C4F3A",
          muted: "#9C8E7A",
          faint: "#C8B898",
        },
        yellow: {
          roll: "#F5C518",
          light: "#FDF0A0",
          faint: "#FDF8E1",
        },
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        node: "0 2px 8px rgba(44, 36, 22, 0.10), 0 1px 2px rgba(44, 36, 22, 0.06)",
        "node-hover": "0 4px 16px rgba(44, 36, 22, 0.15), 0 2px 4px rgba(44, 36, 22, 0.08)",
        "node-selected": "0 0 0 2px #F5C518, 0 4px 16px rgba(44, 36, 22, 0.12)",
      },
      borderRadius: {
        node: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
