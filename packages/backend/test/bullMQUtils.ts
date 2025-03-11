import { QueueEvents } from "bullmq";
import type { Redis } from "ioredis";

export const makeWaitForQueueSuccess =
  (queueName: string, redis: Redis) => async (exec: () => Promise<void>) => {
    const queueEvents = new QueueEvents(queueName, {
      connection: redis,
    });

    await queueEvents.waitUntilReady();
    await exec();

    return new Promise<{
      jobId: string;
      returnvalue: unknown;
      prev?: string;
    }>((resolve, reject) => {
      queueEvents.on("completed", resolve);
      queueEvents.on("failed", reject);
    });
  };
