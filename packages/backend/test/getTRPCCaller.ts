import { UAParser } from "ua-parser-js";
import { beforeEach } from "vitest";

import type {
  User,
  JWTToken,
} from "@nihalgonsalves/expenses-shared/types/user";

import { appRouter } from "../src/appRouter.ts";
import { config } from "../src/config.ts";
import type { ContextObj } from "../src/context.ts";
import { FrankfurterService } from "../src/service/frankfurter/FrankfurterService.ts";
import { NotificationService } from "../src/service/notification/NotificationService.ts";
import { SheetService } from "../src/service/sheet/SheetService.ts";
import { TransactionService } from "../src/service/transaction/TransactionService.ts";
import { UserService } from "../src/service/user/UserService.ts";
import { t } from "../src/trpc.ts";
import { noopAsync } from "../src/utils/noop.ts";

import { FakeEmailWorker } from "./FakeEmailWorker.ts";
import { getPrisma } from "./getPrisma.ts";
import { FakeNotificationDispatchService } from "./webPushUtils.ts";

export const getTRPCCaller = async () => {
  const prisma = await getPrisma();

  const emailWorker = new FakeEmailWorker();
  beforeEach(() => {
    emailWorker.messages = [];
  });

  const useCaller = (
    user: User | undefined,
    setJwtToken: (_token: JWTToken | null) => Promise<void>,
  ) => {
    const notificationDispatchService = new FakeNotificationDispatchService();

    const userService = new UserService(prisma, emailWorker);
    const notificationSubscriptionService = new NotificationService(prisma);
    const transactionService = new TransactionService(
      prisma,
      notificationDispatchService,
    );
    const sheetService = new SheetService(prisma, transactionService);
    const frankfurterService = new FrankfurterService(
      config.FRANKFURTER_BASE_URL,
    );

    const context: ContextObj = {
      prisma,
      userService,
      sheetService,
      transactionService,
      notificationSubscriptionService,
      frankfurterService,
      user,
      get userAgent() {
        return new UAParser(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.15",
        ).getResult();
      },
      setJwtToken,
    };

    const createCaller = t.createCallerFactory(appRouter);

    return createCaller(context);
  };

  return {
    prisma,
    emailWorker,
    usePublicCaller: (setJwtToken = noopAsync) =>
      useCaller(undefined, setJwtToken),
    useProtectedCaller: (user: User, setJwtToken = noopAsync) =>
      useCaller(user, setJwtToken),
  };
};
