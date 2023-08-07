#!/usr/bin/env node
// @ts-check

import { writeFile } from 'fs/promises';

import { default as webPush } from 'web-push';

const { publicKey, privateKey } = webPush.generateVAPIDKeys();

const env = {
  DATABASE_URL: 'postgresql://postgres:postgres@postgres:5432/postgres',
  JWT_SECRET: 'test-secret',
  VAPID_EMAIL: 'ci+test@example.com',
  VAPID_PRIVATE_KEY: privateKey,
  VAPID_PUBLIC_KEY: publicKey,
};

await Promise.all([
  writeFile(
    new URL('../../../.env.backend', import.meta.url),
    Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n'),
    'utf8',
  ),
  writeFile(
    new URL('../../../.env.postgres', import.meta.url),
    'POSTGRES_PASSWORD=postgres',
    'utf8',
  ),
]);
