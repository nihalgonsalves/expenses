import { fileURLToPath } from "url";

import { codecovVitePlugin } from "@codecov/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import IstanbulPlugin from "vite-plugin-istanbul";
import { generateSw } from "./bin/generate-sw";

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
    target: "es2024",
    sourcemap: true,
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
  },
  plugins: [
    process.env["ENABLE_BUNDLE_VISUALIZER"] && visualizer({ open: true }),
    tailwindcss(),
    !process.env["VITE_STORYBOOK"] && tanstackStart(),
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
    react(),
    babel({
      presets: [
        reactCompilerPreset(),
        ["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
      ],
    }),
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
