import { Temporal } from '@js-temporal/polyfill';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

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
} from '@nihalgonsalves/expenses-shared/types/transaction';

import { protectedProcedure, router } from '../../trpc';

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
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
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
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
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

  getAllUserTransactions: protectedProcedure
    .input(
      z.object({
        fromTimestamp: z.string().datetime(),
        toTimestamp: z.string().datetime(),
      }),
    )
    .output(ZGetAllUserTransactionsResponse)
    .query(async ({ ctx, input }) => {
      const { expenses, earnings } =
        await ctx.transactionService.getAllUserTransactions(ctx.user, {
          from: Temporal.Instant.from(input.fromTimestamp),
          to: Temporal.Instant.from(input.toTimestamp),
        });

      return {
        expenses: expenses.map(({ spentAt, sheet, ...transaction }) => ({
          transaction: { ...transaction, spentAt: spentAt.toISOString() },
          sheet,
        })),
        earnings: earnings.map(({ spentAt, sheet, ...transaction }) => ({
          transaction: { ...transaction, spentAt: spentAt.toISOString() },
          sheet,
        })),
      };
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
        transactions: transactions.map(
          ({ amount, scale, spentAt, ...transaction }) => ({
            ...transaction,
            spentAt: spentAt.toISOString(),
            money: { amount, scale, currencyCode: sheet.currencyCode },
          }),
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
        transactions: transactions.map(
          ({
            participantBalances,
            amount,
            scale,
            spentAt,
            ...transaction
          }) => ({
            ...transaction,
            participants: participantBalances,
            spentAt: spentAt.toISOString(),
            money: { amount, scale, currencyCode: sheet.currencyCode },
            yourBalance: participantBalances.find(
              ({ id }) => id === ctx.user.id,
            )?.balance,
          }),
        ),
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

      return summaries.sort(({ participantId }) =>
        participantId === ctx.user.id ? -1 : 1,
      );
    }),
});
