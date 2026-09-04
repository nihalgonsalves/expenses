import type { Pool } from "pg";

import { config } from "./config.ts";
import { createPrisma, type PrismaClientType } from "./create-prisma.ts";
import { createBullMQPool, migrateBullMQ } from "./postgres.ts";
import { EmailQueue, type IEmailWorker } from "./service/email/email-worker.ts";
import {
  NotificationDispatchQueue,
  type INotificationDispatchWorker,
} from "./service/notification/notification-dispatch-worker.ts";
import { TransactionScheduleQueue } from "./service/transaction/transaction-schedule-worker.ts";
import { closeWorkers, startWorkers, type Workers } from "./start-workers.ts";

type BackendRuntimeBase = {
  prisma: PrismaClientType;
  bullMQPool: Pool;
  services: BackendServices;
  queues: BackendQueue[];
};

export type BackendRuntime = BackendRuntimeBase & {
  workers: Workers;
};

export type BackendWebRuntime = BackendRuntimeBase;

export type BackendServices = {
  emailWorker: IEmailWorker;
  notificationDispatchService: INotificationDispatchWorker;
};

export type BackendQueue =
  | EmailQueue["queue"]
  | NotificationDispatchQueue["queue"]
  | TransactionScheduleQueue["queue"];

export const createBackendRuntime = async (): Promise<BackendRuntime> => {
  const prisma = createPrisma();
  const bullMQPool = createBullMQPool(config.DATABASE_URL);

  try {
    await migrateBullMQ(bullMQPool);
    const workers = await startWorkers(prisma, bullMQPool);
    return {
      prisma,
      bullMQPool,
      services: workers,
      queues: [
        workers.emailWorker.queue,
        workers.notificationDispatchService.queue,
        workers.transactionScheduleWorker.queue,
      ],
      workers,
    };
  } catch (error) {
    await Promise.allSettled([prisma.$disconnect(), bullMQPool.end()]);
    throw error;
  }
};

export const createBackendWebRuntime = async (): Promise<BackendWebRuntime> => {
  const prisma = createPrisma();
  const bullMQPool = createBullMQPool(config.DATABASE_URL);

  try {
    const email = new EmailQueue(bullMQPool);
    const notification = new NotificationDispatchQueue(prisma, bullMQPool, {
      publicKey: config.VAPID_PUBLIC_KEY,
      privateKey: config.VAPID_PRIVATE_KEY,
      subject: `mailto:${config.VAPID_EMAIL}`,
    });
    const transactionSchedule = new TransactionScheduleQueue(
      prisma,
      bullMQPool,
    );

    return {
      prisma,
      bullMQPool,
      services: {
        emailWorker: email,
        notificationDispatchService: notification,
      },
      queues: [email.queue, notification.queue, transactionSchedule.queue],
    };
  } catch (error) {
    await Promise.allSettled([prisma.$disconnect(), bullMQPool.end()]);
    throw error;
  }
};

export const closeBackendRuntime = async (
  runtime: BackendRuntime | BackendWebRuntime,
) => {
  if ("workers" in runtime) {
    await closeWorkers(runtime.workers);
  } else {
    await Promise.all(runtime.queues.map(async (queue) => queue.close()));
  }
  await Promise.all([runtime.prisma.$disconnect(), runtime.bullMQPool.end()]);
};
