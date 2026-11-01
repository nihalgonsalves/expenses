import { defineConfig } from "rolldown";

// Bundles the BullMQ worker next to the Nitro server output
export default defineConfig({
  input: "../backend/src/worker.ts",
  platform: "node",
  external: [
    // resolves to node_modules built via the usual build
    /^@sentry\//,
  ],
  output: {
    dir: ".output/server/worker",
    entryFileNames: "index.mjs",
    format: "esm",
    sourcemap: true,
  },
});
