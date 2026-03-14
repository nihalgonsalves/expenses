import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { UAParser } from "ua-parser-js";
import { config } from "./config.ts";
import type { PrismaClientType } from "./create-prisma.ts";
import { FrankfurterService } from "./service/frankfurter/frankfurter-service.ts";
import { NotificationService } from "./service/notification/notification-service.ts";
import { SheetService } from "./service/sheet/sheet-service.ts";
import { TransactionService } from "./service/transaction/transaction-service.ts";
import { UserService } from "./service/user/user-service.ts";
import type { Workers } from "./start-workers.ts";
import { createAuth } from "./utils/auth.ts";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

export const makeCreateContext = (
  prisma: PrismaClientType,
  workers: Workers,
) => {
  const betterAuth = createAuth(prisma, workers.emailWorker);

  const userService = new UserService(prisma, betterAuth);

  const notificationSubscriptionService = new NotificationService(prisma);

  const transactionService = new TransactionService(
    prisma,
    workers.notificationDispatchService,
  );
  const sheetService = new SheetService(
    prisma,
    transactionService,
    userService,
  );

  const frankfurterService = new FrankfurterService(
    config.FRANKFURTER_BASE_URL,
  );

  return async ({
    req,
    resHeaders,
  }: Pick<FetchCreateContextFnOptions, "req" | "resHeaders">) => {
    const appendHeaders = (headers: Headers) => {
      for (const [key, value] of headers.entries()) {
        resHeaders.append(key, value);
      }
    };

    const clearSiteData = () => {
      resHeaders.set("clear-site-data", '"*"');
    };

    const session = await betterAuth.api.getSession({
      headers: req.headers,
    });

    // TODO: not return full user; use ID and not email
    const user: User | null = session
      ? await userService.findByEmail(session.user.email)
      : null;

    return {
      betterAuth,
      prisma,
      user,
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
      headers: req.headers,
      appendHeaders,
      clearSiteData,
    };
  };
};

export type ContextFn = ReturnType<typeof makeCreateContext>;

export type ContextObj = Awaited<ReturnType<ContextFn>>;
