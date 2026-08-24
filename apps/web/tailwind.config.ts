import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
        urgent: {
          50: "#fef2f2",
          500: "#dc2626",
          700: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
