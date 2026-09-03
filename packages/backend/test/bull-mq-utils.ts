import { QueueEvents } from "bullmq";
import type { Pool } from "pg";
import { createPostgresBackend } from "../src/postgres.ts";

export const makeWaitForQueueSuccess =
  (queueName: string, pool: Pool) => async (exec: () => Promise<void>) => {
    const queueEvents = new QueueEvents(
      queueName,
      { connection: pool },
      createPostgresBackend,
    );

    await queueEvents.waitUntilReady();
    await exec();

    const result = await new Promise<{
      jobId: string;
      returnvalue: unknown;
      prev?: string;
    }>((resolve, reject) => {
      queueEvents.on("completed", resolve);
      queueEvents.on("failed", reject);
    });

    await queueEvents.close();
    return result;
  };
