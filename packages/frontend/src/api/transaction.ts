import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as api from "@nihalgonsalves/expenses-backend/src/service/transaction/transaction-api";
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
import { ZCategoryEmoji } from "@nihalgonsalves/expenses-shared/types/user";
import { requiredServerContextMiddleware } from "../server/context";

const authenticatedMiddleware = [requiredServerContextMiddleware] as const;

export const createPersonalSheetTransaction = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZCreatePersonalSheetTransactionInput)
  .handler(async ({ context, data }) =>
    api.createPersonalSheetTransaction(context, data),
  );
export const updatePersonalSheetTransaction = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZUpdatePersonalSheetTransactionInput)
  .handler(async ({ context, data }) =>
    api.updatePersonalSheetTransaction(context, data),
  );
export const createPersonalSheetTransactionSchedule = createServerFn({
  method: "POST",
})
  .middleware(authenticatedMiddleware)
  .validator(ZCreatePersonalSheetTransactionScheduleInput)
  .handler(async ({ context, data }) =>
    api.createPersonalSheetTransactionSchedule(context, data),
  );
export const batchCreatePersonalSheetTransactions = createServerFn({
  method: "POST",
})
  .middleware(authenticatedMiddleware)
  .validator(ZBatchCreatePersonalSheetTransactionInput)
  .handler(async ({ context, data }) =>
    api.batchCreatePersonalSheetTransactions(context, data),
  );
export const createGroupSheetTransaction = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZCreateGroupSheetTransactionInput)
  .handler(async ({ context, data }) =>
    api.createGroupSheetTransaction(context, data),
  );
export const replaceGroupSheetTransaction = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZReplaceGroupSheetTransactionInput)
  .handler(async ({ context, data }) =>
    api.replaceGroupSheetTransaction(context, data),
  );
export const createGroupSheetSettlement = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZCreateGroupSheetSettlementInput)
  .handler(async ({ context, data }) =>
    api.createGroupSheetSettlement(context, data),
  );
const ZDeleteTransactionInput = z.object({
  sheetId: z.string().min(1),
  transactionId: z.string().min(1),
});
export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZDeleteTransactionInput)
  .handler(async ({ context, data }) => api.deleteTransaction(context, data));
const ZDeleteTransactionScheduleInput = z.object({
  sheetId: z.string().min(1),
  transactionScheduleId: z.string().min(1),
});
export const deleteTransactionSchedule = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZDeleteTransactionScheduleInput)
  .handler(async ({ context, data }) =>
    api.deleteTransactionSchedule(context, data),
  );
const ZGetTransactionInput = z.object({
  sheetId: z.string().min(1),
  transactionId: z.string().min(1),
});
export const getTransaction = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(ZGetTransactionInput)
  .handler(async ({ context, data }) => api.getTransaction(context, data));
export const getAllUserTransactions = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(ZGetAllUserTransactionsInput)
  .handler(async ({ context, data }) =>
    api.getAllUserTransactions(context, data),
  );
export const getFutureTransactions = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .handler(async ({ context }) => api.getFutureTransactions(context));
const ZPersonalSheetTransactionsInput = z.object({
  personalSheetId: z.string().min(1),
  limit: z.number().positive().optional(),
});
export const getPersonalSheetTransactions = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(ZPersonalSheetTransactionsInput)
  .handler(async ({ context, data }) =>
    api.getPersonalSheetTransactions(context, data),
  );
const ZPersonalSheetTransactionSchedulesInput = z.object({
  personalSheetId: z.string().min(1),
});
export const getPersonalSheetTransactionSchedules = createServerFn({
  method: "GET",
})
  .middleware(authenticatedMiddleware)
  .validator(ZPersonalSheetTransactionSchedulesInput)
  .handler(async ({ context, data }) =>
    api.getPersonalSheetTransactionSchedules(context, data),
  );
const ZGroupSheetTransactionsInput = z.object({
  groupSheetId: z.string().min(1),
  limit: z.number().positive().optional(),
});
export const getGroupSheetTransactions = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(ZGroupSheetTransactionsInput)
  .handler(async ({ context, data }) =>
    api.getGroupSheetTransactions(context, data),
  );
export const getParticipantSummaries = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(z.string().min(1))
  .handler(async ({ context, data }) =>
    api.getParticipantSummaries(context, data),
  );
export const getSimplifiedBalances = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(z.string().min(1))
  .handler(async ({ context, data }) =>
    api.getSimplifiedBalances(context, data),
  );
export const getCategories = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .handler(async ({ context }) => api.getCategories(context));
export const setCategoryEmojiShortCode = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZCategoryEmoji)
  .handler(async ({ context, data }) =>
    api.setCategoryEmojiShortCode(context, data),
  );

const key = (name: string, input?: unknown) =>
  input === undefined
    ? (["transaction", name] as const)
    : (["transaction", name, input] as const);
const q = <T, R>(name: string, f: (input: T) => Promise<R>) => ({
  queryKey: (input?: T) => key(name, input),
  queryOptions: (input: T, options?: { enabled?: boolean }) =>
    queryOptions({
      queryKey: key(name, input),
      queryFn: async () => f(input),
      staleTime: Infinity,
      ...options,
    }),
});
export const transactionQueries = {
  allUserTransactions: q(
    "all",
    async (x: z.input<typeof ZGetAllUserTransactionsInput>) =>
      getAllUserTransactions({ data: x }),
  ),
  futureTransactions: {
    queryKey: () => key("future"),
    queryOptions: () =>
      queryOptions({
        queryKey: key("future"),
        queryFn: getFutureTransactions,
        staleTime: Infinity,
      }),
  },
  personalSheetTransactions: q(
    "personal",
    async (x: { personalSheetId: string; limit?: number }) =>
      getPersonalSheetTransactions({ data: x }),
  ),
  personalSheetTransactionSchedules: q(
    "personal-schedules",
    async (x: { personalSheetId: string }) =>
      getPersonalSheetTransactionSchedules({ data: x }),
  ),
  groupSheetTransactions: q(
    "group",
    async (x: { groupSheetId: string; limit?: number }) =>
      getGroupSheetTransactions({ data: x }),
  ),
  transaction: q(
    "detail",
    async (x: { sheetId: string; transactionId: string }) =>
      getTransaction({ data: x }),
  ),
  participantSummaries: q("summaries", async (x: string) =>
    getParticipantSummaries({ data: x }),
  ),
  simplifiedBalances: q("balances", async (x: string) =>
    getSimplifiedBalances({ data: x }),
  ),
  categories: {
    queryKey: () => key("categories"),
    queryOptions: () =>
      queryOptions({
        queryKey: key("categories"),
        queryFn: getCategories,
        staleTime: Infinity,
      }),
  },
};

export const transactionMutations = {
  createPersonalSheetTransaction: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZCreatePersonalSheetTransactionInput>,
      ) => createPersonalSheetTransaction({ data }),
    }),
  updatePersonalSheetTransaction: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZUpdatePersonalSheetTransactionInput>,
      ) => updatePersonalSheetTransaction({ data }),
    }),
  createPersonalSheetTransactionSchedule: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZCreatePersonalSheetTransactionScheduleInput>,
      ) => createPersonalSheetTransactionSchedule({ data }),
    }),
  batchCreatePersonalSheetTransactions: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZBatchCreatePersonalSheetTransactionInput>,
      ) => batchCreatePersonalSheetTransactions({ data }),
    }),
  createGroupSheetTransaction: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZCreateGroupSheetTransactionInput>,
      ) => createGroupSheetTransaction({ data }),
    }),
  replaceGroupSheetTransaction: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZReplaceGroupSheetTransactionInput>,
      ) => replaceGroupSheetTransaction({ data }),
    }),
  createGroupSheetSettlement: () =>
    mutationOptions({
      mutationFn: async (
        data: z.input<typeof ZCreateGroupSheetSettlementInput>,
      ) => createGroupSheetSettlement({ data }),
    }),
  deleteTransaction: () =>
    mutationOptions({
      mutationFn: async (data: { sheetId: string; transactionId: string }) =>
        deleteTransaction({ data }),
    }),
  deleteTransactionSchedule: () =>
    mutationOptions({
      mutationFn: async (data: {
        sheetId: string;
        transactionScheduleId: string;
      }) => deleteTransactionSchedule({ data }),
    }),
  setCategoryEmojiShortCode: () =>
    mutationOptions({
      mutationFn: async (data: z.input<typeof ZCategoryEmoji>) =>
        setCategoryEmojiShortCode({ data }),
    }),
};
