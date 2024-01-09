import { UAParser } from "ua-parser-js";

import type {
  User,
  JWTToken,
} from "@nihalgonsalves/expenses-shared/types/user";

import { config } from "../src/config";
import type { ContextObj } from "../src/context";
import { appRouter } from "../src/router";
import { FrankfurterService } from "../src/service/frankfurter/FrankfurterService";
import { NotificationSubscriptionService } from "../src/service/notification/service";
import { SheetService } from "../src/service/sheet/service";
import { TransactionService } from "../src/service/transaction/service";
import { UserService } from "../src/service/user/service";
import { t } from "../src/trpc";

import { getPrisma } from "./getPrisma";
import { FakeNotificationDispatchService } from "./webPushUtils";

export const getTRPCCaller = async () => {
  const prisma = await getPrisma();

  const useCaller = (
    user: User | undefined,
    setJwtToken: (_token: JWTToken | null) => Promise<void>,
  ) => {
    const notificationDispatchService = new FakeNotificationDispatchService();

    const userService = new UserService(prisma);
    const notificationSubscriptionService = new NotificationSubscriptionService(
      prisma,
    );
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
    usePublicCaller: (setJwtToken = async (_token: JWTToken | null) => {}) =>
      useCaller(undefined, setJwtToken),
    useProtectedCaller: (
      user: User,
      setJwtToken = async (_token: JWTToken | null) => {},
    ) => useCaller(user, setJwtToken),
  };
};
