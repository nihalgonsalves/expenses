import { afterAll, inject } from "vitest";

import { createBullMQPool, migrateBullMQ } from "../src/postgres.ts";

export const getBullMQPool = async () => {
  const connectionUri = new URL(inject("postgresConnectionUri"));
  connectionUri.pathname = `/expenses-${process.env["VITEST_WORKER_ID"]}`;
  const pool = createBullMQPool(connectionUri.toString());
  afterAll(async () => pool.end());
  await migrateBullMQ(pool);
  return pool;
};
