import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // SSR: registration stays in root.tsx
      strategies: "injectManifest",
      srcDir: "app",
      filename: "sw.ts",
      manifest: false, // Keep existing public/manifest.json; don't generate one
      outDir: "build/client", // Match React Router's client output directory

      injectManifest: {
        globPatterns: ["**/*.{js,css,svg,ico,woff,woff2}"],
      },
    }),
  ],
});
