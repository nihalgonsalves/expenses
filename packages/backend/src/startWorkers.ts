import type { PrismaClient } from "@prisma/client";
import type { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { config } from "./config";
import { EmailWorker } from "./service/email/EmailWorker";
import { NotificationDispatchWorker } from "./service/notification/NotificationDispatchWorker";
import { TransactionScheduleWorker } from "./service/transaction/TransactionScheduleWorker";

export type IWorker<TData, TResult> = {
  worker: Worker<TData, TResult>;
  queue: Queue<TData, TResult>;
  init?: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const startWorker = async (worker: IWorker<any, any>) => {
  console.log(`Worker '${worker.worker.name}' started`);
  if (worker.init) {
    await worker.init();
    console.log(`Worker '${worker.worker.name}' initialized`);
  }

  worker.worker.on("closed", () => {
    console.log(`Worker '${worker.worker.name}' closed`);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const closeWorker = async ({ worker }: IWorker<any, any>) => {
  try {
    await worker.close();
    console.log(`Worker '${worker.name}' closed`);
  } catch (e) {
    console.error(`Error closing worker '${worker.name}'`, e);
  }
};

export const startWorkers = async (prisma: PrismaClient, redis: Redis) => {
  const workers = {
    notificationDispatchService: new NotificationDispatchWorker(prisma, redis, {
      publicKey: config.VAPID_PUBLIC_KEY,
      privateKey: config.VAPID_PRIVATE_KEY,
      subject: `mailto:${config.VAPID_EMAIL}`,
    }),
    transactionScheduleWorker: new TransactionScheduleWorker(prisma, redis),
    emailWorker: new EmailWorker(redis),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as const satisfies Record<string, IWorker<any, any>>;

  await Promise.all(
    Object.values(workers).map(async (worker) => startWorker(worker)),
  );

  process.on("SIGINT", () => {
    console.log(`SIGINT received, closing workers`);

    Object.values(workers).forEach((worker) => {
      void closeWorker(worker);
    });
  });

  return workers;
};

export type Workers = Awaited<ReturnType<typeof startWorkers>>;
