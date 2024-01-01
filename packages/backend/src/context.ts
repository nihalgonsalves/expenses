import type { PrismaClient } from '@prisma/client';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import cookie from 'cookie';
import { UAParser } from 'ua-parser-js';

import {
  type JWTToken,
  ZJWTToken,
} from '@nihalgonsalves/expenses-shared/types/user';

import { config } from './config';
import { FrankfurterService } from './service/frankfurter/FrankfurterService';
import { NotificationSubscriptionService } from './service/notification/service';
import { SheetService } from './service/sheet/service';
import { TransactionService } from './service/transaction/service';
import { UserService } from './service/user/service';
import { UserServiceError } from './service/user/utils';
import type { Workers } from './startWorkers';

export const AUTH_COOKIE_NAME = 'auth';

export const getMaybeUser = async (
  cookieHeader: string | undefined,
  setJwtToken: (value: JWTToken | null) => Promise<void>,
  userServiceImpl: Pick<UserService, 'exchangeToken'>,
) => {
  if (!cookieHeader) {
    return undefined;
  }

  const token = cookie.parse(cookieHeader)[AUTH_COOKIE_NAME];

  if (!token) {
    return undefined;
  }

  try {
    const { user, newToken } = await userServiceImpl.exchangeToken(
      ZJWTToken.parse(token),
    );

    if (newToken) {
      await setJwtToken(newToken);
    }

    return user;
  } catch (e) {
    if (e instanceof UserServiceError && e.code === 'FORBIDDEN') {
      await setJwtToken(null);
    }
    throw e;
  }
};

export const makeCreateContext = (prisma: PrismaClient, workers: Workers) => {
  const userService = new UserService(prisma);

  const notificationSubscriptionService = new NotificationSubscriptionService(
    prisma,
  );

  const transactionService = new TransactionService(
    prisma,
    workers.notificationDispatchService,
  );
  const sheetService = new SheetService(prisma, transactionService);

  const frankfurterService = new FrankfurterService(
    config.FRANKFURTER_BASE_URL,
  );

  return async ({ req, res }: CreateFastifyContextOptions) => {
    const setJwtToken = async (value: JWTToken | null) => {
      if (!value) {
        void res.header('clear-site-data', '"*"');
      }
      void res.header(
        'Set-Cookie',
        cookie.serialize(AUTH_COOKIE_NAME, value ?? '', {
          path: '/',
          httpOnly: true,
          secure: config.SECURE,
          maxAge: value ? config.JWT_EXPIRY_SECONDS : -1,
        }),
      );
    };

    return {
      prisma,
      user: await getMaybeUser(req.headers.cookie, setJwtToken, userService),
      get userAgent() {
        return new UAParser(req.headers['user-agent']).getResult();
      },
      userService,
      sheetService,
      transactionService,
      frankfurterService,
      notificationSubscriptionService,
      setJwtToken,
    };
  };
};

export type ContextFn = ReturnType<typeof makeCreateContext>;

export type ContextObj = Awaited<ReturnType<ContextFn>>;
