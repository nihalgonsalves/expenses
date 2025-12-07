import { fileURLToPath } from "url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: fileURLToPath(
      new URL("./test/globalSetup.ts", import.meta.url),
    ),
    setupFiles: fileURLToPath(new URL("./test/setup.ts", import.meta.url)),
    include: ["./{src,test}/**/*.test.ts"],
    coverage: {
      provider: "v8",
    },
  },
});
