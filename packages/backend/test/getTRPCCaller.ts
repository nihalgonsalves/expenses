import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from 'testcontainers';
import { afterAll, beforeEach } from 'vitest';

import { type ContextObj } from '../src/context';
import { appRouter } from '../src/router/appRouter';
import { UserService } from '../src/service/user/UserService';
import { type User, type JWTToken } from '../src/service/user/types';

export const getTRPCCaller = async () => {
  const container = await new PostgreSqlContainer('postgres:15.3-alpine')
    .withName(`vitest-backend-${process.env['VITEST_WORKER_ID']}`)
    .withReuse()
    .start();

  await promisify(exec)(`yarn prisma db push --skip-generate`, {
    cwd: path.join(__dirname, '../'),
    env: {
      ...process.env,
      DATABASE_URL: container.getConnectionUri(),
    },
  });

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: container.getConnectionUri(),
      },
    },
  });

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

  return (
    user: User | undefined = undefined,
    setJwtToken = (_token: JWTToken | null) => {},
  ) => {
    const userService = new UserService(prisma);

    const context: ContextObj = {
      prisma,
      userService,
      user,
      setJwtToken,
    };

    return appRouter.createCaller(context);
  };
};
