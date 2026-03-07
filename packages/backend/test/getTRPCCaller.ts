import { UAParser } from "ua-parser-js";
import { beforeEach } from "vitest";

import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { appRouter } from "../src/appRouter.ts";
import { config } from "../src/config.ts";
import type { ContextObj } from "../src/context.ts";
import { FrankfurterService } from "../src/service/frankfurter/FrankfurterService.ts";
import { NotificationService } from "../src/service/notification/NotificationService.ts";
import { SheetService } from "../src/service/sheet/SheetService.ts";
import { TransactionService } from "../src/service/transaction/TransactionService.ts";
import { UserService } from "../src/service/user/UserService.ts";
import { t } from "../src/trpc.ts";

import { FakeEmailWorker } from "./FakeEmailWorker.ts";
import { getPrisma } from "./getPrisma.ts";
import { FakeNotificationDispatchService } from "./webPushUtils.ts";
import { createAuth } from "../src/utils/auth.ts";

const noop = () => {
  // do nothing
};

export const getTRPCCaller = async () => {
  const prisma = await getPrisma();

  const emailWorker = new FakeEmailWorker();
  const notificationDispatchService = new FakeNotificationDispatchService();
  beforeEach(() => {
    emailWorker.messages = [];
    notificationDispatchService.messages = [];
  });

  const betterAuth = createAuth(prisma, emailWorker);

  const useCaller = (
    options: Pick<
      ContextObj,
      "user" | "headers" | "appendHeaders" | "clearSiteData"
    >,
  ) => {
    const userService = new UserService(prisma, betterAuth);
    const notificationSubscriptionService = new NotificationService(prisma);
    const transactionService = new TransactionService(
      prisma,
      notificationDispatchService,
    );
    const sheetService = new SheetService(
      prisma,
      transactionService,
      userService,
    );
    const frankfurterService = new FrankfurterService(
      config.FRANKFURTER_BASE_URL,
    );

    const context: ContextObj = {
      prisma,
      betterAuth,
      userService,
      sheetService,
      transactionService,
      notificationSubscriptionService,
      frankfurterService,
      ...options,
      get userAgent() {
        return new UAParser(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.15",
        ).getResult();
      },
    };

    const createCaller = t.createCallerFactory(appRouter);

    return createCaller(context);
  };

  return {
    prisma,
    betterAuth,
    emailWorker,
    usePublicCaller: ({
      headers = new Headers(),
      appendHeaders = noop,
      clearSiteData = noop,
    }: Partial<
      Pick<ContextObj, "headers" | "appendHeaders" | "clearSiteData">
    > = {}) => useCaller({ user: null, headers, appendHeaders, clearSiteData }),
    useProtectedCaller: (
      {
        user,
        cookieHeader,
      }: {
        user: User;
        cookieHeader: string;
      },
      {
        appendHeaders = noop,
        clearSiteData = noop,
      }: Partial<
        Pick<ContextObj, "headers" | "appendHeaders" | "clearSiteData">
      > = {},
    ) =>
      useCaller({
        user,
        headers: new Headers([["Cookie", cookieHeader]]),
        appendHeaders,
        clearSiteData,
      }),
  };
};
