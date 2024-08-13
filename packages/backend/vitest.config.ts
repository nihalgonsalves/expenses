import { fileURLToPath } from "url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: fileURLToPath(new URL("./test/setup.ts", import.meta.url)),
    include: ["./{src,test}/**/*.test.ts"],
    coverage: {
      provider: "v8",
    },
  },
  // `using` is not supported yet:
  // https://github.com/vitejs/vite/issues/15464
  esbuild: {
    target: "es2022",
    include: /\.m?[jt]sx?$/,
    exclude: [],
  },
});
