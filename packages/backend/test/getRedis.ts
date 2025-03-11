import { RedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import { afterAll } from "vitest";

export const getRedis = async () => {
  const container = await new RedisContainer("redis:7-alpine")
    .withName(`vitest-redis-${process.env["VITEST_WORKER_ID"] ?? 0}`)
    .withReuse()
    .start();

  const redis = new Redis(container.getConnectionUrl(), {
    maxRetriesPerRequest: null,
  });

  afterAll(async () => {
    await redis.quit();
    await container.stop();
  });

  return redis;
};
