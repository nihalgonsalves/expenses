import { UAParser } from "ua-parser-js";
import { beforeEach } from "vitest";

import type { ContextObj } from "../src/context.ts";
import {
  type User,
  ZCategoryEmoji,
} from "@nihalgonsalves/expenses-shared/types/user";
import {
  ZBatchCreatePersonalSheetTransactionInput,
  ZCreateGroupSheetSettlementInput,
  ZCreateGroupSheetTransactionInput,
  ZCreatePersonalSheetTransactionInput,
  ZCreatePersonalSheetTransactionScheduleInput,
  ZGetAllUserTransactionsInput,
  ZReplaceGroupSheetTransactionInput,
  ZUpdatePersonalSheetTransactionInput,
} from "@nihalgonsalves/expenses-shared/types/transaction";
import {
  ZAddGroupSheetMemberInput,
  ZCreateGroupSheetInput,
  ZCreatePersonalSheetInput,
  ZSheetsQuery,
  ZUpdateSheetInput,
} from "@nihalgonsalves/expenses-shared/types/sheet";
import { ZNotificationSubscriptionUpsertInput } from "@nihalgonsalves/expenses-shared/types/notification";
import {
  ZCreateCategoryGroupInput,
  ZUpdateCategoryGroupInput,
} from "@nihalgonsalves/expenses-shared/types/category-group";
import { z } from "zod";
import { config } from "../src/config.ts";
import * as currencyConversionApi from "../src/service/frankfurter/currency-conversion-api.server.ts";
import * as notificationApi from "../src/service/notification/notification-api.server.ts";
import * as sheetApi from "../src/service/sheet/sheet-api.server.ts";
import * as transactionApi from "../src/service/transaction/transaction-api.server.ts";
import * as userApi from "../src/service/user/user-api.server.ts";

import { FrankfurterService } from "../src/service/frankfurter/frankfurter-service.ts";
import { NotificationService } from "../src/service/notification/notification-service.ts";
import { SheetService } from "../src/service/sheet/sheet-service.ts";
import { TransactionService } from "../src/service/transaction/transaction-service.ts";
import { UserService } from "../src/service/user/user-service.ts";
import { createAuth } from "../src/utils/auth.ts";
import { FakeEmailWorker } from "./fake-email-worker.ts";
import { getPrisma } from "./get-prisma.ts";
import { FakeNotificationDispatchService } from "./web-push-utils.ts";

const noop = () => {
  // do nothing
};

const getTestCaller = async () => {
  const prisma = await getPrisma();

  const emailWorker = new FakeEmailWorker();
  const notificationDispatchService = new FakeNotificationDispatchService();
  beforeEach(() => {
    emailWorker.messages = [];
    notificationDispatchService.messages = [];
  });

  const betterAuth = createAuth(prisma, emailWorker);

  const useCaller = (
    options: Pick<ContextObj, "user" | "headers" | "clearSiteData">,
  ) => {
    const userService = new UserService(prisma, betterAuth, emailWorker);
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

    return { context };
  };

  return {
    prisma,
    betterAuth,
    emailWorker,
    usePublicCaller: ({
      headers = new Headers(),
      clearSiteData = noop,
    }: Partial<Pick<ContextObj, "headers" | "clearSiteData">> = {}) =>
      useCaller({ user: null, headers, clearSiteData }),
    useProtectedCaller: (
      {
        user,
        cookieHeader,
      }: {
        user: User;
        cookieHeader: string;
      },
      { clearSiteData = noop }: Partial<Pick<ContextObj, "clearSiteData">> = {},
    ) =>
      useCaller({
        user,
        headers: new Headers([["Cookie", cookieHeader]]),
        clearSiteData,
      }),
  };
};

const authenticated = (context: ContextObj) => {
  if (!context.user) throw new Error("Unauthorized");
  return { ...context, user: context.user };
};

const parse = <T>(schema: { parse: (input: unknown) => T }, input: unknown) =>
  schema.parse(input);

const apiCaller = (caller: { context: ContextObj }) => {
  const context = caller.context;
  return {
    transaction: {
      createPersonalSheetTransaction: async (
        input: Parameters<
          typeof transactionApi.createPersonalSheetTransaction
        >[1],
      ) =>
        transactionApi.createPersonalSheetTransaction(
          authenticated(context),
          parse(ZCreatePersonalSheetTransactionInput, input),
        ),
      updatePersonalSheetTransaction: async (
        input: Parameters<
          typeof transactionApi.updatePersonalSheetTransaction
        >[1],
      ) =>
        transactionApi.updatePersonalSheetTransaction(
          authenticated(context),
          parse(ZUpdatePersonalSheetTransactionInput, input),
        ),
      createPersonalSheetTransactionSchedule: async (
        input: Parameters<
          typeof transactionApi.createPersonalSheetTransactionSchedule
        >[1],
      ) =>
        transactionApi.createPersonalSheetTransactionSchedule(
          authenticated(context),
          parse(ZCreatePersonalSheetTransactionScheduleInput, input),
        ),
      batchCreatePersonalSheetTransactions: async (
        input: Parameters<
          typeof transactionApi.batchCreatePersonalSheetTransactions
        >[1],
      ) =>
        transactionApi.batchCreatePersonalSheetTransactions(
          authenticated(context),
          parse(ZBatchCreatePersonalSheetTransactionInput, input),
        ),
      createGroupSheetTransaction: async (
        input: Parameters<typeof transactionApi.createGroupSheetTransaction>[1],
      ) =>
        transactionApi.createGroupSheetTransaction(
          authenticated(context),
          parse(ZCreateGroupSheetTransactionInput, input),
        ),
      replaceGroupSheetTransaction: async (
        input: Parameters<
          typeof transactionApi.replaceGroupSheetTransaction
        >[1],
      ) =>
        transactionApi.replaceGroupSheetTransaction(
          authenticated(context),
          parse(ZReplaceGroupSheetTransactionInput, input),
        ),
      createGroupSheetSettlement: async (
        input: Parameters<typeof transactionApi.createGroupSheetSettlement>[1],
      ) =>
        transactionApi.createGroupSheetSettlement(
          authenticated(context),
          parse(ZCreateGroupSheetSettlementInput, input),
        ),
      deleteTransaction: async (
        input: Parameters<typeof transactionApi.deleteTransaction>[1],
      ) =>
        transactionApi.deleteTransaction(
          authenticated(context),
          parse(transactionApi.ZDeleteTransactionInput, input),
        ),
      deleteTransactionSchedule: async (
        input: Parameters<typeof transactionApi.deleteTransactionSchedule>[1],
      ) =>
        transactionApi.deleteTransactionSchedule(
          authenticated(context),
          parse(transactionApi.ZDeleteTransactionScheduleInput, input),
        ),
      getTransaction: async (
        input: Parameters<typeof transactionApi.getTransaction>[1],
      ) =>
        transactionApi.getTransaction(
          authenticated(context),
          parse(transactionApi.ZGetTransactionInput, input),
        ),
      getAllUserTransactions: async (
        input: Parameters<typeof transactionApi.getAllUserTransactions>[1],
      ) =>
        transactionApi.getAllUserTransactions(
          authenticated(context),
          parse(ZGetAllUserTransactionsInput, input),
        ),
      getFutureTransactions: async () =>
        transactionApi.getFutureTransactions(authenticated(context)),
      getPersonalSheetTransactions: async (
        input: Parameters<
          typeof transactionApi.getPersonalSheetTransactions
        >[1],
      ) =>
        transactionApi.getPersonalSheetTransactions(
          authenticated(context),
          parse(transactionApi.ZGetPersonalSheetTransactionsInput, input),
        ),
      getPersonalSheetTransactionSchedules: async (
        input: Parameters<
          typeof transactionApi.getPersonalSheetTransactionSchedules
        >[1],
      ) =>
        transactionApi.getPersonalSheetTransactionSchedules(
          authenticated(context),
          parse(
            transactionApi.ZGetPersonalSheetTransactionSchedulesInput,
            input,
          ),
        ),
      getGroupSheetTransactions: async (
        input: Parameters<typeof transactionApi.getGroupSheetTransactions>[1],
      ) =>
        transactionApi.getGroupSheetTransactions(
          authenticated(context),
          parse(transactionApi.ZGetGroupSheetTransactionsInput, input),
        ),
      getParticipantSummaries: async (
        input: Parameters<typeof transactionApi.getParticipantSummaries>[1],
      ) =>
        transactionApi.getParticipantSummaries(
          authenticated(context),
          parse(z.string().min(1), input),
        ),
      getSimplifiedBalances: async (
        input: Parameters<typeof transactionApi.getSimplifiedBalances>[1],
      ) =>
        transactionApi.getSimplifiedBalances(
          authenticated(context),
          parse(z.string().min(1), input),
        ),
      getCategories: async () =>
        transactionApi.getCategories(authenticated(context)),
      setCategoryEmojiShortCode: async (
        input: Parameters<typeof transactionApi.setCategoryEmojiShortCode>[1],
      ) =>
        transactionApi.setCategoryEmojiShortCode(
          authenticated(context),
          parse(ZCategoryEmoji, input),
        ),
    },
    currencyConversion: {
      getSupportedCurrencies: async () =>
        currencyConversionApi.getSupportedCurrencies(authenticated(context)),
      getConversionRate: async (
        input: Parameters<typeof currencyConversionApi.getConversionRate>[1],
      ) =>
        currencyConversionApi.getConversionRate(
          authenticated(context),
          parse(currencyConversionApi.ZGetConversionRateInput, input),
        ),
    },
    user: {
      signOut: async () => userApi.signOut(context),
      anonymizeUser: async () => userApi.anonymizeUser(authenticated(context)),
      getCategoryGroups: async () =>
        userApi.getCategoryGroups(authenticated(context)),
      createCategoryGroup: async (
        input: Parameters<typeof userApi.createCategoryGroup>[1],
      ) =>
        userApi.createCategoryGroup(
          authenticated(context),
          parse(ZCreateCategoryGroupInput, input),
        ),
      updateCategoryGroup: async (
        input: Parameters<typeof userApi.updateCategoryGroup>[1],
      ) =>
        userApi.updateCategoryGroup(
          authenticated(context),
          parse(ZUpdateCategoryGroupInput, input),
        ),
      deleteCategoryGroup: async (id: string) =>
        userApi.deleteCategoryGroup(
          authenticated(context),
          parse(z.string().min(1), id),
        ),
    },
    notification: {
      getPublicKey: async () =>
        notificationApi.getPublicKey(authenticated(context)),
      upsertSubscription: async (
        input: Parameters<typeof notificationApi.upsertSubscription>[1],
      ) =>
        notificationApi.upsertSubscription(
          authenticated(context),
          parse(ZNotificationSubscriptionUpsertInput, input),
        ),
      deleteSubscription: async (id: string) =>
        notificationApi.deleteSubscription(
          authenticated(context),
          parse(z.string(), id),
        ),
      getSubscriptions: async () =>
        notificationApi.getSubscriptions(authenticated(context)),
    },
    sheet: {
      mySheets: async (input: Parameters<typeof sheetApi.getMySheets>[1]) =>
        sheetApi.getMySheets(
          authenticated(context),
          parse(ZSheetsQuery, input),
        ),
      groupSheetById: async (id: string) =>
        sheetApi.getGroupSheetById(
          authenticated(context),
          parse(z.string().min(1), id),
        ),
      personalSheetById: async (id: string) =>
        sheetApi.getPersonalSheetById(
          authenticated(context),
          parse(z.string().min(1), id),
        ),
      createPersonalSheet: async (
        input: Parameters<typeof sheetApi.createPersonalSheet>[1],
      ) =>
        sheetApi.createPersonalSheet(
          authenticated(context),
          parse(ZCreatePersonalSheetInput, input),
        ),
      createGroupSheet: async (
        input: Parameters<typeof sheetApi.createGroupSheet>[1],
      ) =>
        sheetApi.createGroupSheet(
          authenticated(context),
          parse(ZCreateGroupSheetInput, input),
        ),
      updateSheet: async (input: Parameters<typeof sheetApi.updateSheet>[1]) =>
        sheetApi.updateSheet(
          authenticated(context),
          parse(ZUpdateSheetInput, input),
        ),
      archiveSheet: async (
        input: Parameters<typeof sheetApi.archiveSheet>[1],
      ) =>
        sheetApi.archiveSheet(
          authenticated(context),
          parse(sheetApi.ZArchiveSheetInput, input),
        ),
      deleteSheet: async (id: string) =>
        sheetApi.deleteSheet(
          authenticated(context),
          parse(z.string().min(1), id),
        ),
      addGroupSheetMember: async (
        input: Parameters<typeof sheetApi.addGroupSheetMember>[1],
      ) =>
        sheetApi.addGroupSheetMember(
          authenticated(context),
          parse(ZAddGroupSheetMemberInput, input),
        ),
      deleteGroupSheetMember: async (
        input: Parameters<typeof sheetApi.deleteGroupSheetMember>[1],
      ) =>
        sheetApi.deleteGroupSheetMember(
          authenticated(context),
          parse(sheetApi.ZDeleteGroupSheetMemberInput, input),
        ),
    },
  };
};

export const getApiCaller = async () => {
  const caller = await getTestCaller();
  return {
    ...caller,
    usePublicCaller: (...args: Parameters<typeof caller.usePublicCaller>) =>
      apiCaller(caller.usePublicCaller(...args)),
    useProtectedCaller: (
      ...args: Parameters<typeof caller.useProtectedCaller>
    ) => apiCaller(caller.useProtectedCaller(...args)),
  };
};
