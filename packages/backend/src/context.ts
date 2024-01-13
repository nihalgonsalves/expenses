import type { PrismaClient } from "@prisma/client";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import cookie from "cookie";
import { UAParser } from "ua-parser-js";

import {
  type JWTToken,
  ZJWTToken,
} from "@nihalgonsalves/expenses-shared/types/user";

import { config } from "./config";
import { FrankfurterService } from "./service/frankfurter/FrankfurterService";
import { NotificationService } from "./service/notification/NotificationService";
import { SheetService } from "./service/sheet/SheetService";
import { TransactionService } from "./service/transaction/TransactionService";
import { UserService } from "./service/user/UserService";
import { UserServiceError } from "./service/user/utils";
import type { Workers } from "./startWorkers";

export const AUTH_COOKIE_NAME = "auth";

export const getMaybeUser = async (
  cookieHeader: string | null,
  setJwtToken: (value: JWTToken | null) => Promise<void>,
  userServiceImpl: Pick<UserService, "exchangeToken">,
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
    if (e instanceof UserServiceError && e.code === "FORBIDDEN") {
      await setJwtToken(null);
    }
    throw e;
  }
};

export const makeCreateContext = (prisma: PrismaClient, workers: Workers) => {
  const userService = new UserService(prisma, workers.emailWorker);

  const notificationSubscriptionService = new NotificationService(prisma);

  const transactionService = new TransactionService(
    prisma,
    workers.notificationDispatchService,
  );
  const sheetService = new SheetService(prisma, transactionService);

  const frankfurterService = new FrankfurterService(
    config.FRANKFURTER_BASE_URL,
  );

  return async ({
    req,
    resHeaders,
  }: Pick<FetchCreateContextFnOptions, "req" | "resHeaders">) => {
    const setJwtToken = async (value: JWTToken | null) => {
      if (!value) {
        resHeaders.set("clear-site-data", '"*"');
      }

      // Clear old versions of the cookie
      resHeaders.append(
        "Set-Cookie",
        cookie.serialize(AUTH_COOKIE_NAME, value ?? "", {
          path: "/api/trpc",
          httpOnly: true,
          secure: config.SECURE,
          maxAge: -1,
        }),
      );

      resHeaders.append(
        "Set-Cookie",
        cookie.serialize(AUTH_COOKIE_NAME, value ?? "", {
          path: "/",
          httpOnly: true,
          secure: config.SECURE,
          sameSite: "strict",
          maxAge: value ? config.JWT_EXPIRY_SECONDS : -1,
        }),
      );
    };

    return {
      prisma,
      user: await getMaybeUser(
        req.headers.get("cookie"),
        setJwtToken,
        userService,
      ),
      get userAgent() {
        return new UAParser(
          req.headers.get("user-agent") ?? undefined,
        ).getResult();
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
