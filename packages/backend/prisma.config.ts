import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "prisma/config";

if (existsSync(new URL("./.env", import.meta.url))) {
  loadEnvFile(new URL("./.env", import.meta.url));
}

export default defineConfig({
  datasource: process.env["DATABASE_URL"]
    ? {
        url: process.env["DATABASE_URL"],
      }
    : {},
});
