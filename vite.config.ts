import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";

const isTest = !!process.env.VITEST;

export default defineConfig({
  plugins: isTest
    ? [tsconfigPaths()]
    : [
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
  test: {
    projects: [
      defineWorkersProject({
        test: {
          name: "workers",
          include: ["test/*.spec.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "./wrangler.jsonc" },
            },
          },
        },
      }),
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "components",
          include: ["test/components/**/*.spec.tsx"],
          environment: "happy-dom",
          globals: true,
          setupFiles: ["test/components/setup.ts"],
        },
      },
    ],
  },
});
