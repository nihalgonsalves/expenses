import type { Pool } from "pg";

import { config } from "./config.ts";
import { createPrisma, type PrismaClientType } from "./create-prisma.ts";
import { createBullMQPool, migrateBullMQ } from "./postgres.ts";
import { closeWorkers, startWorkers, type Workers } from "./start-workers.ts";

export type BackendRuntime = {
  prisma: PrismaClientType;
  bullMQPool: Pool;
  workers: Workers;
};

export const createBackendRuntime = async (): Promise<BackendRuntime> => {
  const prisma = createPrisma();
  const bullMQPool = createBullMQPool(config.DATABASE_URL);

  try {
    await migrateBullMQ(bullMQPool);
    const workers = await startWorkers(prisma, bullMQPool);

    return { prisma, bullMQPool, workers };
  } catch (error) {
    await Promise.allSettled([prisma.$disconnect(), bullMQPool.end()]);
    throw error;
  }
};

export const closeBackendRuntime = async (runtime: BackendRuntime) => {
  await closeWorkers(runtime.workers);
  await Promise.all([runtime.prisma.$disconnect(), runtime.bullMQPool.end()]);
};
