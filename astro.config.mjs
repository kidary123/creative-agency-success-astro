import { defineConfig } from "astro/config";

export default defineConfig({
  // site: "https://tu-dominio.vercel.app",  // rellenar tras el primer deploy
  build: { inlineStylesheets: "auto" },
  vite: {
    build: { cssMinify: "lightningcss" },
  },
});
