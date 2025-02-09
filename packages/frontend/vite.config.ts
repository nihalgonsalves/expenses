import { fileURLToPath } from "url";

import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type Plugin } from "vite";
import IstanbulPlugin from "vite-plugin-istanbul";
import { VitePWA } from "vite-plugin-pwa";

const relativePath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: "es2022",
    sourcemap: true,
    cssMinify: "lightningcss",
  },
  css: { transformer: "lightningcss" },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [
    process.env["ENABLE_BUNDLE_VISUALIZER"] &&
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (visualizer({ open: true }) as unknown as Plugin),
    react(),
    tailwindcss(),
    VitePWA({
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: null,
      strategies: "injectManifest",
      selfDestroying:
        mode === "development" && process.env["ENABLE_DEV_PWA"] == null,
      devOptions: {
        enabled: true,
        type: "module",
        resolveTempFolder: () => relativePath("./dist/vite-pwa-dev/"),
      },
      manifest: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
    process.env["VITE_COVERAGE"] &&
      IstanbulPlugin({
        include: "src/*",
        exclude: ["node_modules", "test/"],
        extension: [".js", ".ts", ".tsx"],
      }),
    process.env["SENTRY_AUTH_TOKEN"] &&
      process.env["SENTRY_ORG"] &&
      process.env["SENTRY_PROJECT"] &&
      process.env["VITE_GIT_COMMIT_SHA"] &&
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (sentryVitePlugin({
        authToken: process.env["SENTRY_AUTH_TOKEN"],
        org: process.env["SENTRY_ORG"],
        project: process.env["SENTRY_PROJECT"],
        release: { name: process.env["VITE_GIT_COMMIT_SHA"] },
      }) as Plugin),
  ].filter(Boolean),
}));
