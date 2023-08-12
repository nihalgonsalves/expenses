import IORedis from 'ioredis';
import { GenericContainer } from 'testcontainers';
import { afterAll } from 'vitest';

export const getRedis = async () => {
  const container = await new GenericContainer('redis:7-alpine')
    .withName(`vitest-redis-${process.env['VITEST_WORKER_ID'] ?? 0}`)
    .withExposedPorts(6379)
    .withReuse()
    .start();

  const redis = new IORedis({
    host: container.getHost(),
    port: container.getMappedPort(6379),
    maxRetriesPerRequest: null,
  });

  afterAll(async () => {
    await container.stop();
  });

  return redis;
};
