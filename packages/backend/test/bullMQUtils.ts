import { QueueEvents } from 'bullmq';
import type IORedis from 'ioredis';

export const makeWaitForQueueSuccess =
  (queueName: string, redis: IORedis) => async (exec: () => Promise<void>) => {
    const queueEvents = new QueueEvents(queueName, {
      connection: redis,
    });

    await exec();

    return new Promise<{
      jobId: string;
      returnvalue: unknown;
      prev?: string;
    }>((resolve, reject) => {
      queueEvents.on('completed', resolve);
      queueEvents.on('failed', reject);
    });
  };
