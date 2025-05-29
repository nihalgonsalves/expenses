import { fileURLToPath } from "url";

import { codecovVitePlugin } from "@codecov/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import spotlightSidecar from "@spotlightjs/sidecar/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
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
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }

        warn(warning);
      },
    },
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
    TanStackRouterVite({ autoCodeSplitting: true }),
    react({
      babel: {
        plugins: [
          [
            import.meta.resolve("babel-plugin-react-compiler"),
            { target: "19" },
          ],
        ],
      },
    }),
    tailwindcss(),
    !process.env["VITE_STORYBOOK"] &&
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
    spotlightSidecar(),
    mode === "development" &&
      codeInspectorPlugin({
        bundler: "vite",
        hideConsole: true,
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
        reactComponentAnnotation: { enabled: true },
        telemetry: false,
      }) as Plugin),
    process.env["CODECOV_TOKEN"] &&
      codecovVitePlugin({
        enableBundleAnalysis: true,
        bundleName: "frontend",
        uploadToken: process.env["CODECOV_TOKEN"],
        telemetry: false,
      }),
  ].filter(Boolean),
}));
