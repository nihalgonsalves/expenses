import { PrismaClient } from '@prisma/client';
import { type CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import cookie from 'cookie';

import { config } from './config';
import { GroupService } from './service/group/GroupService';
import { UserService } from './service/user/UserService';
import { type JWTToken, ZJWTToken, type User } from './service/user/types';

const prisma = new PrismaClient();
const userService = new UserService(prisma);
const groupService = new GroupService(prisma);

const AUTH_COOKIE_NAME = 'auth';

const getMaybeUser = async (
  cookieHeader: string | undefined,
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
    return undefined;
  }
};

export const createContext = async ({ req, res }: CreateHTTPContextOptions) => {
  return {
    prisma,
    user: await getMaybeUser(req.headers.cookie),
    userService,
    groupService,
    setJwtToken: (value: JWTToken | null) => {
      res.setHeader(
        'Set-Cookie',
        cookie.serialize(AUTH_COOKIE_NAME, value ?? '', {
          httpOnly: true,
          secure: config.SECURE,
          maxAge: config.JWT_EXPIRY_SECONDS,
        }),
      );
    },
  };
};

export type ContextFn = typeof createContext;

export type ContextObj = Awaited<ReturnType<ContextFn>>;
