import { PrismaClient } from '@prisma/client';
import { type CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import cookie from 'cookie';
import { UAParser } from 'ua-parser-js';

import { config } from './config';
import { ExpenseService } from './service/expense/ExpenseService';
import { FrankfurterService } from './service/frankfurter/FrankfurterService';
import { NotificationService } from './service/notification/NotificationService';
import { SheetService } from './service/sheet/SheetService';
import { UserService } from './service/user/UserService';
import { type JWTToken, ZJWTToken, type User } from './service/user/types';

const prisma = new PrismaClient();
const userService = new UserService(prisma);
const sheetService = new SheetService(prisma);
const notificationService = new NotificationService(prisma);
const expenseService = new ExpenseService(prisma, notificationService);

const frankfurterService = new FrankfurterService(config.FRANKFURTER_BASE_URL);

const AUTH_COOKIE_NAME = 'auth';

const getMaybeUser = async (
  cookieHeader: string | undefined,
  setJwtToken: (value: JWTToken | null) => void,
): Promise<User | undefined> => {
  if (!cookieHeader) {
    return undefined;
  }

  const token = cookie.parse(cookieHeader)[AUTH_COOKIE_NAME];

  if (!token) {
    return undefined;
  }

  try {
    return await userService.exchangeToken(ZJWTToken.parse(token));
  } catch (e) {
    setJwtToken(null);
    return undefined;
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
