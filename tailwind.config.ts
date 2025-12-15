import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        spotify: {
          green: "var(--spotify-green)", // #1DB954
          black: "var(--spotify-black)", // #191414
          white: "var(--spotify-white)", // #FFFFFF
          "gray-dark": "var(--spotify-gray-dark)", // #212121
          gray: "var(--spotify-gray)", // #535353
          "gray-light": "var(--spotify-gray-light)", // #B3B3B3
        },
      },
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
