import { Redis } from "ioredis";
import { inject, afterAll } from "vitest";

export const getRedis = async () => {
  const redis = new Redis(inject("redisConnectionUri"), {
    db: Number.parseInt(process.env["VITEST_WORKER_ID"] ?? "0"),
    maxRetriesPerRequest: null,
  });

  afterAll(async () => {
    await redis.quit();
  });

  return redis;
};
