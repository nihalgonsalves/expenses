import { loadEnvFile } from "node:process";

import { defineConfig, env } from "prisma/config";

loadEnvFile(new URL("./.env", import.meta.url));

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});
