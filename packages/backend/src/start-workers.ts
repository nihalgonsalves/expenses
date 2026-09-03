import type { IQueueBackend, Queue, Worker } from "bullmq";
import type { Pool } from "pg";

import { config } from "./config.ts";
import type { PrismaClientType } from "./create-prisma.ts";
import { EmailWorker } from "./service/email/email-worker.ts";
import { NotificationDispatchWorker } from "./service/notification/notification-dispatch-worker.ts";
import { TransactionScheduleWorker } from "./service/transaction/transaction-schedule-worker.ts";

export type IWorker<TData, TResult> = {
  worker: Worker<TData, TResult, string, IQueueBackend>;
  queue: Queue<TData, TResult, string, TData, TResult, string, IQueueBackend>;
  init?: () => Promise<void>;
};

// oxlint-disable typescript/no-explicit-any
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

// oxlint-disable typescript/no-explicit-any
export const closeWorker = async ({ worker, queue }: IWorker<any, any>) => {
  try {
    await Promise.all([worker.close(), queue.close()]);
    console.log(`Worker '${worker.name}' closed`);
  } catch (e) {
    console.error(`Error closing worker '${worker.name}'`, e);
  }
};

export const closeWorkers = async (workers: Workers) => {
  await Promise.all(
    Object.values(workers).map(async (worker) => closeWorker(worker)),
  );
};

export const startWorkers = async (prisma: PrismaClientType, pool: Pool) => {
  const workers = {
    notificationDispatchService: new NotificationDispatchWorker(prisma, pool, {
      publicKey: config.VAPID_PUBLIC_KEY,
      privateKey: config.VAPID_PRIVATE_KEY,
      subject: `mailto:${config.VAPID_EMAIL}`,
    }),
    transactionScheduleWorker: new TransactionScheduleWorker(prisma, pool),
    emailWorker: new EmailWorker(pool),
    // oxlint-disable typescript/no-explicit-any
  } as const satisfies Record<string, IWorker<any, any>>;

  await Promise.all(
    Object.values(workers).map(async (worker) => startWorker(worker)),
  );

  return workers;
};

export type Workers = Awaited<ReturnType<typeof startWorkers>>;
