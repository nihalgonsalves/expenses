import type { PrismaClient } from '@prisma/client';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import cookie from 'cookie';
import type IORedis from 'ioredis';
import { UAParser } from 'ua-parser-js';

import {
  type JWTToken,
  ZJWTToken,
  type User,
} from '@nihalgonsalves/expenses-shared/types/user';

import { config } from './config';
import { FrankfurterService } from './service/frankfurter/FrankfurterService';
import {
  NotificationSubscriptionService,
  NotificationDispatchService,
} from './service/notification/service';
import { SheetService } from './service/sheet/service';
import { TransactionService } from './service/transaction/service';
import { UserService } from './service/user/service';
import { UserServiceError } from './service/user/utils';

export const AUTH_COOKIE_NAME = 'auth';

export const getMaybeUser = async (
  cookieHeader: string | undefined,
  setJwtToken: (value: JWTToken | null) => Promise<void>,
  userServiceImpl: Pick<UserService, 'exchangeToken'>,
): Promise<User | undefined> => {
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

export const makeCreateContext = (prisma: PrismaClient, redis: IORedis) => {
  const userService = new UserService(prisma);
  const notificationSubscriptionService = new NotificationSubscriptionService(
    prisma,
  );
  const notificationDispatchService = new NotificationDispatchService(
    prisma,
    redis,
    {
      publicKey: config.VAPID_PUBLIC_KEY,
      privateKey: config.VAPID_PRIVATE_KEY,
      subject: `mailto:${config.VAPID_EMAIL}`,
    },
  );
  const transactionService = new TransactionService(
    prisma,
    notificationDispatchService,
  );
  const sheetService = new SheetService(prisma, transactionService);

  const frankfurterService = new FrankfurterService(
    config.FRANKFURTER_BASE_URL,
  );

  return async ({ req, res }: CreateFastifyContextOptions) => {
    const setJwtToken = async (value: JWTToken | null) => {
      // await res.header() hangs for whatever reason
      res.raw.setHeader(
        'Set-Cookie',
        cookie.serialize(AUTH_COOKIE_NAME, value ?? '', {
          httpOnly: true,
          secure: config.SECURE,
          maxAge: config.JWT_EXPIRY_SECONDS,
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
