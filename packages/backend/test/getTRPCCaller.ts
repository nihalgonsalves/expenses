import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from 'testcontainers';
import { afterAll, beforeEach } from 'vitest';

import { appRouter } from '../src/router/appRouter';
import { UserService } from '../src/service/UserService';

export const getPostgresContainer = async () => {
  const container = await new PostgreSqlContainer('postgres:15.3-alpine')
    .withDatabase(`${process.env['VITEST_WORKER_ID'] ?? '0'}`)
    .withReuse()
    .start();

  await promisify(exec)(`yarn prisma db push --skip-generate`, {
    cwd: path.join(__dirname, '../'),
    env: {
      ...process.env,
      DATABASE_URL: container.getConnectionUri(),
    },
  });

  return container;
};

export const useTRPCCaller = async () => {
  const container = await getPostgresContainer();

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: container.getConnectionUri(),
      },
    },
  });

  const userService = new UserService(prisma);

  const context = { prisma, userService };

  beforeEach(async () => {
    const tablenames = await prisma.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  });

  afterAll(async () => {
    await container.stop();
  });

  return appRouter.createCaller(context);
};
