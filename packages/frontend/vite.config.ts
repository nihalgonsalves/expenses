import { fileURLToPath } from "url";

import { codecovVitePlugin } from "@codecov/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import react from "@vitejs/plugin-react";
import { jotaiPlugin } from "jotai-rolldown";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import IstanbulPlugin from "vite-plugin-istanbul";
// We only need this for Vite's native loader, nowhere else
// @ts-expect-error An import path can only end with a .ts extension when allowImportingTsExtensions is enabled.
import { generateSw } from "./bin/generate-sw.ts";

const relativePath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

let swGenerated = false;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "#": relativePath("./src"),
    },
  },
  build: {
    target: "es2025",
    sourcemap: true,
    rolldownOptions: {
      // TODO use onLog
      // oxlint-disable-next-line typescript/no-deprecated
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
  },
  plugins: [
    devtools({
      consolePiping: { enabled: true },
      enhancedLogs: { enabled: true },
    }),
    jotaiPlugin(),
    process.env["ENABLE_BUNDLE_VISUALIZER"] && visualizer({ open: true }),
    tailwindcss(),
    !process.env["VITE_STORYBOOK"] &&
      tanstackStart({
        importProtection: {
          client: {
            // `files` replaces TanStack Start's defaults, so retain the
            // `.server` convention while treating all backend source as server-only.
            files: ["**/*.server.*", "**/packages/backend/src/**"],
            excludeFiles: ["**/node_modules/**"],
          },
        },
      }),
    !process.env["VITE_STORYBOOK"] &&
      mode === "production" && {
        name: "generate-sw-on-build",
        async closeBundle() {
          // Vite runs in three steps: Client, SSR, Nitro output.
          // We only want to run after the client bundle.
          // Running it later results in a race condition
          if (swGenerated) {
            return;
          }
          swGenerated = true;
          await generateSw();
        },
      },
    !process.env["VITE_STORYBOOK"] && nitro({}),
    react({ compiler: { logDiagnostics: false } }),
    !process.env["VITE_STORYBOOK"] &&
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
      sentryVitePlugin({
        authToken: process.env["SENTRY_AUTH_TOKEN"],
        org: process.env["SENTRY_ORG"],
        project: process.env["SENTRY_PROJECT"],
        release: { name: process.env["VITE_GIT_COMMIT_SHA"] },
        reactComponentAnnotation: { enabled: true },
        telemetry: false,
      }),
    process.env["CODECOV_TOKEN"] &&
      codecovVitePlugin({
        enableBundleAnalysis: true,
        bundleName: "frontend",
        uploadToken: process.env["CODECOV_TOKEN"],
        telemetry: false,
      }),
  ].filter(Boolean),
}));
