import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from 'testcontainers';
import { UAParser } from 'ua-parser-js';
import { afterAll, beforeEach } from 'vitest';

import { config } from '../src/config';
import { type ContextObj } from '../src/context';
import { appRouter } from '../src/router/appRouter';
import { ExpenseService } from '../src/service/expense/ExpenseService';
import { FrankfurterService } from '../src/service/frankfurter/FrankfurterService';
import { GroupService } from '../src/service/group/GroupService';
import { NotificationService } from '../src/service/notification/NotificationService';
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

  const useCaller = (
    user: User | undefined,
    setJwtToken: (_token: JWTToken | null) => void,
  ) => {
    const userService = new UserService(prisma);
    const groupService = new GroupService(prisma);
    const notificationService = new NotificationService(prisma);
    const expenseService = new ExpenseService(prisma, notificationService);
    const frankfurterService = new FrankfurterService(
      config.FRANKFURTER_BASE_URL,
    );

    const context: ContextObj = {
      prisma,
      userService,
      groupService,
      expenseService,
      notificationService,
      frankfurterService,
      user,
      get userAgent() {
        return new UAParser(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.15',
        ).getResult();
      },
      setJwtToken,
    };

    return appRouter.createCaller(context);
  };

  return {
    prisma,
    usePublicCaller: (setJwtToken = (_token: JWTToken | null) => {}) =>
      useCaller(undefined, setJwtToken),
    useProtectedCaller: (user: User) => useCaller(user, () => {}),
  };
};
