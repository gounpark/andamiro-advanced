/**
 * GitHub Pages 전용 정적 SPA 빌드 설정.
 * TanStack Start(SSR/Cloudflare) 없이 순수 Vite + React로 빌드.
 * 진입점: index.html → src/pages-entry.tsx
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  base: process.env.VITE_BASE ?? "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
