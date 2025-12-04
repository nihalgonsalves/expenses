import { defineConfig } from "prisma/config";

import { config } from "./src/config.ts";

export default defineConfig({
  datasource: {
    url: config.DATABASE_URL,
  },
});
