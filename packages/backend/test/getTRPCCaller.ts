import { UAParser } from "ua-parser-js";
import { beforeEach } from "vitest";

import type {
  User,
  JWTToken,
} from "@nihalgonsalves/expenses-shared/types/user";

import { appRouter } from "../src/appRouter";
import { config } from "../src/config";
import type { ContextObj } from "../src/context";
import { FrankfurterService } from "../src/service/frankfurter/FrankfurterService";
import { NotificationService } from "../src/service/notification/NotificationService";
import { SheetService } from "../src/service/sheet/SheetService";
import { TransactionService } from "../src/service/transaction/TransactionService";
import {
  UserService,
  type EmailPayload,
} from "../src/service/user/UserService";
import { t } from "../src/trpc";

import { getPrisma } from "./getPrisma";
import { FakeNotificationDispatchService } from "./webPushUtils";

export const getTRPCCaller = async () => {
  const prisma = await getPrisma();
  const mailbox: { messages: EmailPayload[] } = { messages: [] };

  beforeEach(() => {
    mailbox.messages = [];
  });

  const useCaller = (
    user: User | undefined,
    setJwtToken: (_token: JWTToken | null) => Promise<void>,
  ) => {
    const notificationDispatchService = new FakeNotificationDispatchService();

    const userService = new UserService(prisma, async (email) => {
      mailbox.messages.push(email);
    });
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
    mailbox,
    usePublicCaller: (setJwtToken = async (_token: JWTToken | null) => {}) =>
      useCaller(undefined, setJwtToken),
    useProtectedCaller: (
      user: User,
      setJwtToken = async (_token: JWTToken | null) => {},
    ) => useCaller(user, setJwtToken),
  };
};
