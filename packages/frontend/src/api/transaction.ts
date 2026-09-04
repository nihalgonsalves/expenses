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
import { withRequiredServerContext } from "../server/context";

export const createPersonalSheetTransaction = createServerFn({ method: "POST" })
  .validator(ZCreatePersonalSheetTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.createPersonalSheetTransaction(ctx, data),
    ),
  );
export const updatePersonalSheetTransaction = createServerFn({ method: "POST" })
  .validator(ZUpdatePersonalSheetTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.updatePersonalSheetTransaction(ctx, data),
    ),
  );
export const createPersonalSheetTransactionSchedule = createServerFn({
  method: "POST",
})
  .validator(ZCreatePersonalSheetTransactionScheduleInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.createPersonalSheetTransactionSchedule(ctx, data),
    ),
  );
export const batchCreatePersonalSheetTransactions = createServerFn({
  method: "POST",
})
  .validator(ZBatchCreatePersonalSheetTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.batchCreatePersonalSheetTransactions(ctx, data),
    ),
  );
export const createGroupSheetTransaction = createServerFn({ method: "POST" })
  .validator(ZCreateGroupSheetTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.createGroupSheetTransaction(ctx, data),
    ),
  );
export const replaceGroupSheetTransaction = createServerFn({ method: "POST" })
  .validator(ZReplaceGroupSheetTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.replaceGroupSheetTransaction(ctx, data),
    ),
  );
export const createGroupSheetSettlement = createServerFn({ method: "POST" })
  .validator(ZCreateGroupSheetSettlementInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.createGroupSheetSettlement(ctx, data),
    ),
  );
const ZDeleteTransactionInput = z.object({
  sheetId: z.string().min(1),
  transactionId: z.string().min(1),
});
export const deleteTransaction = createServerFn({ method: "POST" })
  .validator(ZDeleteTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) => api.deleteTransaction(ctx, data)),
  );
const ZDeleteTransactionScheduleInput = z.object({
  sheetId: z.string().min(1),
  transactionScheduleId: z.string().min(1),
});
export const deleteTransactionSchedule = createServerFn({ method: "POST" })
  .validator(ZDeleteTransactionScheduleInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.deleteTransactionSchedule(ctx, data),
    ),
  );
const ZGetTransactionInput = z.object({
  sheetId: z.string().min(1),
  transactionId: z.string().min(1),
});
export const getTransaction = createServerFn({ method: "GET" })
  .validator(ZGetTransactionInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) => api.getTransaction(ctx, data)),
  );
export const getAllUserTransactions = createServerFn({ method: "GET" })
  .validator(ZGetAllUserTransactionsInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.getAllUserTransactions(ctx, data),
    ),
  );
export const getFutureTransactions = createServerFn({ method: "GET" }).handler(
  async () => withRequiredServerContext(api.getFutureTransactions),
);
const ZPersonalSheetTransactionsInput = z.object({
  personalSheetId: z.string().min(1),
  limit: z.number().positive().optional(),
});
export const getPersonalSheetTransactions = createServerFn({ method: "GET" })
  .validator(ZPersonalSheetTransactionsInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.getPersonalSheetTransactions(ctx, data),
    ),
  );
const ZPersonalSheetTransactionSchedulesInput = z.object({
  personalSheetId: z.string().min(1),
});
export const getPersonalSheetTransactionSchedules = createServerFn({
  method: "GET",
})
  .validator(ZPersonalSheetTransactionSchedulesInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.getPersonalSheetTransactionSchedules(ctx, data),
    ),
  );
const ZGroupSheetTransactionsInput = z.object({
  groupSheetId: z.string().min(1),
  limit: z.number().positive().optional(),
});
export const getGroupSheetTransactions = createServerFn({ method: "GET" })
  .validator(ZGroupSheetTransactionsInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.getGroupSheetTransactions(ctx, data),
    ),
  );
export const getParticipantSummaries = createServerFn({ method: "GET" })
  .validator(z.string().min(1))
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.getParticipantSummaries(ctx, data),
    ),
  );
export const getSimplifiedBalances = createServerFn({ method: "GET" })
  .validator(z.string().min(1))
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.getSimplifiedBalances(ctx, data),
    ),
  );
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => withRequiredServerContext(api.getCategories),
);
export const setCategoryEmojiShortCode = createServerFn({ method: "POST" })
  .validator(ZCategoryEmoji)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (ctx) =>
      api.setCategoryEmojiShortCode(ctx, data),
    ),
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
