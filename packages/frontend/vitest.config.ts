import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: fileURLToPath(new URL("./test/setup.ts", import.meta.url)),
    include: ["./src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
    },
  },
});
