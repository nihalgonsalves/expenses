import { PrismaClient } from '@prisma/client';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import cookie from 'cookie';
import { UAParser } from 'ua-parser-js';

import {
  type JWTToken,
  ZJWTToken,
  type User,
} from '@nihalgonsalves/expenses-shared/types/user';

import { config } from './config';
import { ExpenseService } from './service/expense/service';
import { FrankfurterService } from './service/frankfurter/FrankfurterService';
import { NotificationService } from './service/notification/service';
import { SheetService } from './service/sheet/service';
import { UserService } from './service/user/service';
import { UserServiceError } from './service/user/utils';

const prisma = new PrismaClient();
const userService = new UserService(prisma);
const sheetService = new SheetService(prisma);
const notificationService = new NotificationService(prisma);
const expenseService = new ExpenseService(prisma, notificationService);

const frankfurterService = new FrankfurterService(config.FRANKFURTER_BASE_URL);

export const AUTH_COOKIE_NAME = 'auth';

export const getMaybeUser = async (
  cookieHeader: string | undefined,
  setJwtToken: (value: JWTToken | null) => void,
  userServiceImpl: Pick<UserService, 'exchangeToken'> = userService,
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
      setJwtToken(newToken);
    }

    return user;
  } catch (e) {
    if (e instanceof UserServiceError && e.code === 'FORBIDDEN') {
      setJwtToken(null);
    }
    throw e;
  }
};

export const createContext = async ({ req, res }: CreateHTTPContextOptions) => {
  const setJwtToken = (value: JWTToken | null) => {
    res.setHeader(
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
    user: await getMaybeUser(req.headers.cookie, setJwtToken),
    get userAgent() {
      return new UAParser(req.headers['user-agent']).getResult();
    },
    userService,
    sheetService,
    expenseService,
    frankfurterService,
    notificationService,
    setJwtToken,
  };
};

export type ContextFn = typeof createContext;

export type ContextObj = Awaited<ReturnType<ContextFn>>;
