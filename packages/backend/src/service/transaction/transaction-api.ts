import { z } from "zod";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import {
  type ZCreateGroupSheetTransactionInput,
  type ZCreateGroupSheetSettlementInput,
  type ZCreatePersonalSheetTransactionInput,
  type ZBatchCreatePersonalSheetTransactionInput,
  type ZCreatePersonalSheetTransactionScheduleInput,
  ZCreateSheetTransactionResponse,
  ZCreateGroupSheetSettlementResponse,
  ZGetAllUserTransactionsResponse,
  ZGetGroupSheetTransactionsResponse,
  ZTransactionWithSheet,
  ZTransactionScheduleListItem,
  ZTransactionSummaryResponse,
  ZBalanceSimplificationResponse,
  type TransactionScheduleListItem,
  ZRecurrenceFrequency,
  type ZUpdatePersonalSheetTransactionInput,
  type ZGetAllUserTransactionsInput,
  ZGetPersonalSheetTransactionsResponse,
  type TransactionWithSheet,
  type ZReplaceGroupSheetTransactionInput,
} from "@nihalgonsalves/expenses-shared/types/transaction";
import { ZCategoryEmoji } from "@nihalgonsalves/expenses-shared/types/user";

import type { Transaction as PrismaTransaction } from "../../prisma/client.ts";
import type { ContextObj } from "../../context.ts";

import { calculateBalances } from "./transaction-service.ts";
import { AppError } from "../../utils/errors.ts";

type StoredTransactionMoney = Pick<
  PrismaTransaction,
  | "amount"
  | "scale"
  | "spentAt"
  | "originalAmount"
  | "originalScale"
  | "originalCurrencyCode"
>;

const mapTransaction = <T extends StoredTransactionMoney>(
  {
    amount,
    scale,
    spentAt,
    originalAmount,
    originalScale,
    originalCurrencyCode,
    ...transaction
  }: T,
  sheet: { currencyCode: string },
): Omit<
  T,
  | "amount"
  | "scale"
  | "spentAt"
  | "originalAmount"
  | "originalScale"
  | "originalCurrencyCode"
> & {
  spentAt: string;
  money: Money;
  originalMoney?: Money;
} => ({
  ...transaction,
  spentAt: spentAt.toISOString(),
  money: { amount, scale, currencyCode: sheet.currencyCode },
  ...(originalAmount != null &&
  originalScale != null &&
  originalCurrencyCode != null
    ? {
        originalMoney: {
          amount: originalAmount,
          scale: originalScale,
          currencyCode: originalCurrencyCode,
        },
      }
    : {}),
});

type AuthenticatedContext = Omit<ContextObj, "user"> & {
  user: NonNullable<ContextObj["user"]>;
};

export const ZDeleteTransactionInput = z.object({
  sheetId: z.string().min(1),
  transactionId: z.string().min(1),
});
export const ZDeleteTransactionScheduleInput = z.object({
  sheetId: z.string().min(1),
  transactionScheduleId: z.string().min(1),
});
export const ZGetTransactionInput = z.object({
  sheetId: z.string().min(1),
  transactionId: z.string().min(1),
});
export const ZGetPersonalSheetTransactionsInput = z.object({
  personalSheetId: z.string().min(1),
  limit: z.number().positive().optional(),
});
export const ZGetPersonalSheetTransactionSchedulesInput = z.object({
  personalSheetId: z.string().min(1),
});
export const ZGetGroupSheetTransactionsInput = z.object({
  groupSheetId: z.string().min(1),
  limit: z.number().positive().optional(),
});
const ZGetFutureTransactionsResponse = z.object({
  count: z.number(),
  last: z.iso.datetime().optional(),
});

export const createPersonalSheetTransaction = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZCreatePersonalSheetTransactionInput>,
) => {
  const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
    input.personalSheetId,
    ctx.user.id,
  );

  return ZCreateSheetTransactionResponse.parse(
    await ctx.transactionService.createPersonalSheetTransaction(
      ctx.user,
      input,
      sheet,
    ),
  );
};

export const updatePersonalSheetTransaction = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZUpdatePersonalSheetTransactionInput>,
) => {
  const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
    input.personalSheetId,
    ctx.user.id,
  );

  return ZCreateSheetTransactionResponse.parse(
    await ctx.transactionService.updatePersonalSheetTransaction(
      ctx.user,
      input,
      sheet,
    ),
  );
};

export const createPersonalSheetTransactionSchedule = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZCreatePersonalSheetTransactionScheduleInput>,
) => {
  const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
    input.personalSheetId,
    ctx.user.id,
  );

  return ZCreateSheetTransactionResponse.parse(
    await ctx.transactionService.createPersonalSheetTransactionSchedule(
      input,
      sheet,
    ),
  );
};

export const batchCreatePersonalSheetTransactions = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZBatchCreatePersonalSheetTransactionInput>,
) => {
  const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
    input.personalSheetId,
    ctx.user.id,
  );

  await ctx.transactionService.batchCreatePersonalSheetTransactions(
    ctx.user,
    input.transactions,
    sheet,
  );
  z.void().parse(undefined);
};

export const createGroupSheetTransaction = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZCreateGroupSheetTransactionInput>,
) => {
  const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
    input.groupSheetId,
    ctx.user.id,
  );

  const groupParticipants = new Set(sheet.participants.map(({ id }) => id));
  const transactionParticipants = [
    input.paidOrReceivedById,
    ...input.splits.map(({ participantId }) => participantId),
  ];

  if (transactionParticipants.some((id) => !groupParticipants.has(id))) {
    throw new AppError({
      code: "BAD_REQUEST",
      message: "Invalid participants",
    });
  }

  return ZCreateSheetTransactionResponse.parse(
    await ctx.transactionService.createGroupSheetTransaction(
      ctx.user,
      input,
      sheet,
    ),
  );
};

export const replaceGroupSheetTransaction = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZReplaceGroupSheetTransactionInput>,
) => {
  const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
    input.groupSheetId,
    ctx.user.id,
  );

  const groupParticipants = new Set(sheet.participants.map(({ id }) => id));
  const transactionParticipants = [
    input.paidOrReceivedById,
    ...input.splits.map(({ participantId }) => participantId),
  ];

  if (transactionParticipants.some((id) => !groupParticipants.has(id))) {
    throw new AppError({
      code: "BAD_REQUEST",
      message: "Invalid participants",
    });
  }

  return ZCreateSheetTransactionResponse.parse(
    await ctx.transactionService.replaceGroupSheetTransaction(
      ctx.user,
      input,
      sheet,
    ),
  );
};

export const createGroupSheetSettlement = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZCreateGroupSheetSettlementInput>,
) => {
  const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
    input.groupSheetId,
    ctx.user.id,
  );

  const groupParticipants = new Set(sheet.participants.map(({ id }) => id));

  if (
    !groupParticipants.has(input.fromId) ||
    !groupParticipants.has(input.toId)
  ) {
    throw new AppError({
      code: "BAD_REQUEST",
      message: "Invalid participants",
    });
  }

  return ZCreateGroupSheetSettlementResponse.parse(
    await ctx.transactionService.createSettlement(ctx.user, input, sheet),
  );
};

export const deleteTransaction = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZDeleteTransactionInput>,
) => {
  const { sheetId, transactionId } = input;
  const { sheet } = await ctx.sheetService.ensureSheetMembership(
    sheetId,
    ctx.user.id,
  );

  await ctx.transactionService.deleteTransaction(transactionId, sheet);
  z.void().parse(undefined);
};

export const deleteTransactionSchedule = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZDeleteTransactionScheduleInput>,
) => {
  const { sheetId, transactionScheduleId } = input;
  const { sheet } = await ctx.sheetService.ensureSheetMembership(
    sheetId,
    ctx.user.id,
  );

  await ctx.transactionService.deleteTransactionSchedule(
    transactionScheduleId,
    sheet,
  );
  z.void().parse(undefined);
};

export const getTransaction = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZGetTransactionInput>,
) => {
  const { sheetId, transactionId } = input;
  const { sheet } = await ctx.sheetService.ensureSheetMembership(
    sheetId,
    ctx.user.id,
  );

  const transaction = await ctx.transactionService.getTransaction(
    transactionId,
    sheet,
  );

  if (!transaction) {
    throw new AppError({ code: "NOT_FOUND", message: "Transaction not found" });
  }

  const sheetType = sheet.type;
  switch (sheetType) {
    case "PERSONAL": {
      return ZTransactionWithSheet.parse({
        ...mapTransaction(transaction, sheet),
        sheet,
        sheetType,
      });
    }

    case "GROUP": {
      const participantBalances = calculateBalances(
        sheet,
        transaction.type,
        transaction.transactionEntries,
      );

      return ZTransactionWithSheet.parse({
        ...mapTransaction(transaction, sheet),
        sheet,
        sheetType,
        participants: participantBalances,
        yourBalance: participantBalances.find(({ id }) => id === ctx.user.id)
          ?.balance,
      });
    }

    default:
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unknown sheet type",
      });
  }
};

export const getAllUserTransactions = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZGetAllUserTransactionsInput>,
) => {
  const data = await ctx.transactionService.getAllUserTransactions(ctx.user, {
    from: Temporal.Instant.from(input.fromTimestamp),
    to: Temporal.Instant.from(input.toTimestamp),
  });

  return ZGetAllUserTransactionsResponse.parse(
    data.map(
      ({
        sheet,
        spentAt,
        originalAmount,
        originalScale,
        originalCurrencyCode,
        ...transaction
      }): TransactionWithSheet => {
        const sheetType = sheet.type;
        const originalMoney =
          originalAmount != null &&
          originalScale != null &&
          originalCurrencyCode != null
            ? {
                amount: originalAmount,
                scale: originalScale,
                currencyCode: originalCurrencyCode,
              }
            : undefined;

        if (sheetType === "PERSONAL") {
          return {
            ...transaction,
            ...(originalMoney ? { originalMoney } : {}),
            sheet,
            sheetType,
            spentAt: spentAt.toISOString(),
          };
        }

        const participantBalances = calculateBalances(
          sheet,
          transaction.type,
          transaction.transactionEntries,
        );

        return {
          ...transaction,
          ...(originalMoney ? { originalMoney } : {}),
          sheet,
          sheetType,
          spentAt: spentAt.toISOString(),
          participants: participantBalances,
          yourBalance: participantBalances.find(({ id }) => id === ctx.user.id)
            ?.balance,
        };
      },
    ),
  );
};

export const getFutureTransactions = async (ctx: AuthenticatedContext) => {
  const { count, last } = await ctx.transactionService.getFutureTransactions(
    ctx.user,
  );

  return ZGetFutureTransactionsResponse.parse({
    count,
    last: last?.toISOString(),
  });
};

export const getPersonalSheetTransactions = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZGetPersonalSheetTransactionsInput>,
): Promise<z.output<typeof ZGetPersonalSheetTransactionsResponse>> => {
  const { personalSheetId, limit } = input;
  const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
    personalSheetId,
    ctx.user.id,
  );

  const { transactions, total } =
    await ctx.transactionService.getPersonalSheetTransactions({
      personalSheet: sheet,
      limit,
    });

  return ZGetPersonalSheetTransactionsResponse.parse({
    transactions: transactions.map((transaction) =>
      mapTransaction(transaction, sheet),
    ),
    total,
  });
};

export const getPersonalSheetTransactionSchedules = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZGetPersonalSheetTransactionSchedulesInput>,
) => {
  const { personalSheetId } = input;
  const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
    personalSheetId,
    ctx.user.id,
  );

  const transactionSchedules =
    await ctx.transactionService.getTransactionSchedules({
      sheetId: sheet.id,
    });

  return z.array(ZTransactionScheduleListItem).parse(
    transactionSchedules.map(
      ({ rruleFreq, amount, scale, ...item }): TransactionScheduleListItem => ({
        ...item,
        nextOccurrenceAt: Temporal.Instant.fromEpochMilliseconds(
          item.nextOccurrenceAt.valueOf(),
        )
          .toZonedDateTimeISO(item.nextOccurrenceTzId)
          .toString(),
        money: {
          amount,
          scale,
          currencyCode: sheet.currencyCode,
        },
        recurrenceRule: {
          freq: ZRecurrenceFrequency.parse(rruleFreq),
        },
      }),
    ),
  );
};

export const getGroupSheetTransactions = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZGetGroupSheetTransactionsInput>,
) => {
  const { groupSheetId, limit } = input;
  const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
    groupSheetId,
    ctx.user.id,
  );

  const { transactions, total } =
    await ctx.transactionService.getGroupSheetTransaction({
      groupSheet: sheet,
      limit,
    });

  return ZGetGroupSheetTransactionsResponse.parse({
    transactions: transactions.map((transaction) => {
      const participantBalances = calculateBalances(
        sheet,
        transaction.type,
        transaction.transactionEntries,
      );

      return {
        ...mapTransaction(transaction, sheet),
        participants: participantBalances,
        yourBalance: participantBalances.find(({ id }) => id === ctx.user.id)
          ?.balance,
      };
    }),
    total,
  });
};

export const getParticipantSummaries = async (
  ctx: AuthenticatedContext,
  input: string,
) => {
  const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
    input,
    ctx.user.id,
  );

  const summaries = await ctx.transactionService.getParticipantSummaries(sheet);

  return ZTransactionSummaryResponse.parse(
    summaries.toSorted(({ id }) => (id === ctx.user.id ? -1 : 1)),
  );
};

export const getSimplifiedBalances = async (
  ctx: AuthenticatedContext,
  input: string,
) => {
  const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
    input,
    ctx.user.id,
  );

  return ZBalanceSimplificationResponse.parse(
    await ctx.transactionService.simplifyBalances(sheet),
  );
};

export const getCategories = async (ctx: AuthenticatedContext) => {
  const [allCategoryIds, userCategories] = await Promise.all([
    ctx.transactionService.getCategories(ctx.user),
    ctx.userService.getCategories(ctx.user),
  ]);

  const emojisById = Object.fromEntries(
    userCategories.map((c) => [c.id, c.emojiShortCode]),
  );

  return z.array(ZCategoryEmoji).parse(
    allCategoryIds.map((id) => ({
      id,
      emojiShortCode: emojisById[id],
    })),
  );
};

export const setCategoryEmojiShortCode = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZCategoryEmoji>,
) => {
  const result = await ctx.userService.setCategoryEmojiShortCode(
    ctx.user,
    input.id,
    input.emojiShortCode,
  );

  return ZCategoryEmoji.parse(
    result ?? { id: input.id, emojiShortCode: undefined },
  );
};
