#!/usr/bin/env node

import { writeFile } from "fs/promises";

import { default as webPush } from "web-push";

const { publicKey, privateKey } = webPush.generateVAPIDKeys();

await writeFile(
  new URL("../.env", import.meta.url),
  Object.entries({
    VAPID_PRIVATE_KEY: privateKey,
    VAPID_PUBLIC_KEY: publicKey,
  })
    .map(([key, value]) => `${key}=${value}`)
    .join("\n"),
  "utf8",
);
