import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.ts"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        school: {
          navy: "#082b63",
          blue: "#078cc5",
          sky: "#70c7eb",
          paper: "#f5f7fa"
        }
      }
    }
  },
  plugins: []
};

export default config;
