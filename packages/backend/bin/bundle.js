#!/usr/bin/env node

/* eslint-env node */
import { mkdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";
import { context } from "esbuild";
import { z } from "zod";

import rootPackageJson from "../../../package.json" with { type: "json" };
import packageJson from "../package.json" with { type: "json" };

/**
 * @param {string} path
 * @returns {string}
 */
export const relativePath = (path) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

const nodeEnv = z
  .union([z.literal("test"), z.literal("development"), z.literal("production")])
  .default("development")
  .parse(process.env["NODE_ENV"]);

const ctx = await context({
  platform: "node",
  // NODE_VERSION
  target: "node22",
  format: "cjs",
  bundle: true,
  treeShaking: true,
  minify: nodeEnv === "production",
  sourcemap: true,
  outdir: relativePath("../dist/"),
  packages: "bundle",
  // some packages don't work well bundled, so we exclude them and install only
  // these specific packages later in the Dockerfile (see newPackage below)
  external: Object.keys(packageJson.resolutions),
  entryPoints: [relativePath("../src/app.ts")],
  define: {
    // must match `src/globals.d.ts` and `vitest.config.ts`
    IS_PROD: JSON.stringify(nodeEnv === "production"),
  },
  loader: {
    // https://github.com/getsentry/profiling-node/issues/189#issuecomment-1695841736
    ".node": "copy",
  },
  plugins: [
    process.env["SENTRY_ORG"] &&
      process.env["SENTRY_PROJECT"] &&
      process.env["SENTRY_AUTH_TOKEN"] &&
      sentryEsbuildPlugin({
        org: process.env["SENTRY_ORG"],
        project: process.env["SENTRY_PROJECT"],
        authToken: process.env["SENTRY_AUTH_TOKEN"],
      }),
  ].filter(Boolean),
});

const newPackage = {
  name: `${packageJson.name}_bundle`,
  version: packageJson.version,
  type: "commonjs",
  dependencies: packageJson.resolutions,
  packageManager: rootPackageJson.packageManager,
};

await mkdir(relativePath("../dist"), { recursive: true });
await writeFile(
  relativePath("../dist/package.json"),
  JSON.stringify(newPackage, null, 2),
  "utf-8",
);

if (process.argv.includes("--watch")) {
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  const result = await ctx.rebuild();
  console.log(result);
  await ctx.dispose();
}
