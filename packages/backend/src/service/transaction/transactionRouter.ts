import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import {
  ZCreateGroupSheetTransactionInput,
  ZCreateSheetTransactionResponse,
  ZCreateGroupSheetSettlementInput,
  ZCreateGroupSheetSettlementResponse,
  ZCreatePersonalSheetTransactionInput,
  ZTransactionSummaryResponse,
  ZGetPersonalSheetTransactionsResponse,
  ZGetGroupSheetTransactionsResponse,
  ZBatchCreatePersonalSheetTransactionInput,
  ZGetAllUserTransactionsResponse,
  ZCreatePersonalSheetTransactionScheduleInput,
  ZTransactionScheduleListItem,
  type TransactionScheduleListItem,
  ZRecurrenceFrequency,
  ZTransactionWithSheet,
  ZUpdatePersonalSheetTransactionInput,
  ZGetAllUserTransactionsInput,
  ZBalanceSimplificationResponse,
  type TransactionWithSheet,
} from "@nihalgonsalves/expenses-shared/types/transaction";
import { ZCategoryEmoji } from "@nihalgonsalves/expenses-shared/types/user";

import { protectedProcedure, router } from "../../trpc.ts";

import { calculateBalances } from "./TransactionService.ts";

const mapTransaction = <
  T extends { amount: number; scale: number; spentAt: Date },
>(
  { amount, scale, spentAt, ...transaction }: T,
  sheet: { currencyCode: string },
): Omit<T, "amount" | "scale" | "spentAt"> & {
  spentAt: string;
  money: Money;
} => ({
  ...transaction,
  spentAt: spentAt.toISOString(),
  money: { amount, scale, currencyCode: sheet.currencyCode },
});

export const transactionRouter = router({
  createPersonalSheetTransaction: protectedProcedure
    .input(ZCreatePersonalSheetTransactionInput)
    .output(ZCreateSheetTransactionResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      return ctx.transactionService.createPersonalSheetTransaction(
        ctx.user,
        input,
        sheet,
      );
    }),

  updatePersonalSheetTransaction: protectedProcedure
    .input(ZUpdatePersonalSheetTransactionInput)
    .output(ZCreateSheetTransactionResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      return ctx.transactionService.updatePersonalSheetTransaction(
        ctx.user,
        input,
        sheet,
      );
    }),

  createPersonalSheetTransactionSchedule: protectedProcedure
    .input(ZCreatePersonalSheetTransactionScheduleInput)
    .output(ZCreateSheetTransactionResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      return ctx.transactionService.createPersonalSheetTransactionSchedule(
        input,
        sheet,
      );
    }),

  batchCreatePersonalSheetTransactions: protectedProcedure
    .input(ZBatchCreatePersonalSheetTransactionInput)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      await ctx.transactionService.batchCreatePersonalSheetTransactions(
        ctx.user,
        input.transactions,
        sheet,
      );
    }),

  createGroupSheetTransaction: protectedProcedure
    .input(ZCreateGroupSheetTransactionInput)
    .output(ZCreateSheetTransactionResponse)
    .mutation(async ({ input, ctx }) => {
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid participants",
        });
      }

      return ctx.transactionService.createGroupSheetTransaction(
        ctx.user,
        input,
        sheet,
      );
    }),

  createGroupSheetSettlement: protectedProcedure
    .input(ZCreateGroupSheetSettlementInput)
    .output(ZCreateGroupSheetSettlementResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input.groupSheetId,
        ctx.user.id,
      );

      const groupParticipants = new Set(sheet.participants.map(({ id }) => id));

      if (
        !groupParticipants.has(input.fromId) ||
        !groupParticipants.has(input.toId)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid participants",
        });
      }

      return ctx.transactionService.createSettlement(ctx.user, input, sheet);
    }),

  deleteTransaction: protectedProcedure
    .input(
      z.object({
        sheetId: z.string().min(1),
        transactionId: z.string().min(1),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { sheetId, transactionId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureSheetMembership(
        sheetId,
        ctx.user.id,
      );

      await ctx.transactionService.deleteTransaction(transactionId, sheet);
    }),

  deleteTransactionSchedule: protectedProcedure
    .input(
      z.object({
        sheetId: z.string().min(1),
        transactionScheduleId: z.string().min(1),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { sheetId, transactionScheduleId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureSheetMembership(
        sheetId,
        ctx.user.id,
      );

      await ctx.transactionService.deleteTransactionSchedule(
        transactionScheduleId,
        sheet,
      );
    }),

  getTransaction: protectedProcedure
    .input(
      z.object({
        sheetId: z.string().min(1),
        transactionId: z.string().min(1),
      }),
    )
    .output(ZTransactionWithSheet)
    .query(async ({ input: { sheetId, transactionId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureSheetMembership(
        sheetId,
        ctx.user.id,
      );

      const sheetType = sheet.type;

      // TODO
      if (sheetType === "GROUP") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot getTransaction for a group sheet",
        });
      }

      const transaction = await ctx.transactionService.getTransaction(
        transactionId,
        sheet,
      );

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction not found",
        });
      }

      return {
        ...mapTransaction(transaction, sheet),
        sheet,
        sheetType,
      };
    }),

  getAllUserTransactions: protectedProcedure
    .input(ZGetAllUserTransactionsInput)
    .output(ZGetAllUserTransactionsResponse)
    .query(async ({ ctx, input }) => {
      const data = await ctx.transactionService.getAllUserTransactions(
        ctx.user,
        {
          from: Temporal.Instant.from(input.fromTimestamp),
          to: Temporal.Instant.from(input.toTimestamp),
        },
      );

      return data.map(
        ({ sheet, spentAt, ...transaction }): TransactionWithSheet => {
          const sheetType = sheet.type;

          if (sheetType === "PERSONAL") {
            return {
              ...transaction,
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
            sheet,
            sheetType,
            spentAt: spentAt.toISOString(),
            participants: participantBalances,
            yourBalance: participantBalances.find(
              ({ id }) => id === ctx.user.id,
            )?.balance,
          };
        },
      );
    }),

  getPersonalSheetTransactions: protectedProcedure
    .input(
      z.object({
        personalSheetId: z.string().min(1),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetPersonalSheetTransactionsResponse)
    .query(async ({ input: { personalSheetId, limit }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        personalSheetId,
        ctx.user.id,
      );

      const { transactions, total } =
        await ctx.transactionService.getPersonalSheetTransactions({
          personalSheet: sheet,
          limit,
        });

      return {
        transactions: transactions.map((transaction) =>
          mapTransaction(transaction, sheet),
        ),
        total,
      };
    }),

  getPersonalSheetTransactionSchedules: protectedProcedure
    .input(
      z.object({
        personalSheetId: z.string().min(1),
      }),
    )
    .output(z.array(ZTransactionScheduleListItem))
    .query(async ({ input: { personalSheetId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        personalSheetId,
        ctx.user.id,
      );

      const transactionSchedules =
        await ctx.transactionService.getTransactionSchedules({
          sheetId: sheet.id,
        });

      return transactionSchedules.map(
        ({
          rruleFreq,
          amount,
          scale,
          ...item
        }): TransactionScheduleListItem => ({
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
      );
    }),

  getGroupSheetTransactions: protectedProcedure
    .input(
      z.object({
        groupSheetId: z.string().min(1),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetGroupSheetTransactionsResponse)
    .query(async ({ input: { groupSheetId, limit }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        groupSheetId,
        ctx.user.id,
      );

      const { transactions, total } =
        await ctx.transactionService.getGroupSheetTransaction({
          groupSheet: sheet,
          limit,
        });

      return {
        transactions: transactions.map((transaction) => {
          const participantBalances = calculateBalances(
            sheet,
            transaction.type,
            transaction.transactionEntries,
          );

          return {
            ...mapTransaction(transaction, sheet),
            participants: participantBalances,
            yourBalance: participantBalances.find(
              ({ id }) => id === ctx.user.id,
            )?.balance,
          };
        }),
        total,
      };
    }),

  getParticipantSummaries: protectedProcedure
    .input(z.string().min(1))
    .output(ZTransactionSummaryResponse)
    .query(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input,
        ctx.user.id,
      );

      const summaries =
        await ctx.transactionService.getParticipantSummaries(sheet);

      return summaries.sort(({ id }) => (id === ctx.user.id ? -1 : 1));
    }),

  getSimplifiedBalances: protectedProcedure
    .input(z.string().min(1))
    .output(ZBalanceSimplificationResponse)
    .query(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input,
        ctx.user.id,
      );

      return ctx.transactionService.simplifyBalances(sheet);
    }),

  getCategories: protectedProcedure
    .output(z.array(ZCategoryEmoji))
    .query(async ({ ctx }) => {
      const [allCategoryIds, userCategories] = await Promise.all([
        ctx.transactionService.getCategories(ctx.user),
        ctx.userService.getCategories(ctx.user),
      ]);

      const emojisById = Object.fromEntries(
        userCategories.map((c) => [c.id, c.emojiShortCode]),
      );

      return allCategoryIds.map((id) => ({
        id,
        emojiShortCode: emojisById[id],
      }));
    }),

  setCategoryEmojiShortCode: protectedProcedure
    .input(ZCategoryEmoji)
    .output(ZCategoryEmoji)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.userService.setCategoryEmojiShortCode(
        ctx.user,
        input.id,
        input.emojiShortCode,
      );

      return result ?? { id: input.id, emojiShortCode: undefined };
    }),
});
