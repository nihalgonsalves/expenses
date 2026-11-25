import { fileURLToPath } from "node:url";
import { build } from "rolldown";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:install-trusted-types";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const ENTRY = fileURLToPath(
  new URL("../src/install-trusted-types.ts", import.meta.url),
);

/**
 * `virtual:install-trusted-types` exports `src/install-trusted-types.ts`,
 * bundled into a standalone script as a string, for an inline <script> in
 * <head> (__root.tsx). Unlike a module, it runs before any app code in both
 * dev and build, however the app is split into chunks.
 */
export const trustedTypesPlugin = (): Plugin => ({
  name: "install-trusted-types",
  resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
  async load(id) {
    if (id !== RESOLVED_ID) {
      return undefined;
    }

    const { output } = await build({
      input: ENTRY,
      platform: "browser",
      write: false,
      transform: {
        define: {
          "import.meta.env.DEV": JSON.stringify(
            this.environment.mode === "dev",
          ),
        },
      },
      output: { format: "iife", minify: true },
    });

    for (const module of output[0].moduleIds) {
      this.addWatchFile(module);
    }

    return `export default ${JSON.stringify(output[0].code.trim())};`;
  },
});
