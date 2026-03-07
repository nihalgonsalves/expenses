#!/usr/bin/env node

import { writeFile } from "fs/promises";

import { default as webPush } from "web-push";

const { publicKey, privateKey } = webPush.generateVAPIDKeys();

await writeFile(
  new URL("../.env", import.meta.url),
  Object.entries({
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres",
    VAPID_PRIVATE_KEY: privateKey,
    VAPID_PUBLIC_KEY: publicKey,
    BETTER_AUTH_SECRET: "",
    BETTER_AUTH_URL: "",
  })
    .map(([key, value]) => `${key}=${value}`)
    .join("\n"),
  "utf8",
);
