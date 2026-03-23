import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A", // Negro
        oxford: "#1E293B",     // Gris Oxford
        gold: "#D4AF37",       // Dorado acentuado
        danger: "#EF4444",     // Rojo Alerta
      },
    },
  },
  plugins: [],
};
export default config;
