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
} from '@nihalgonsalves/expenses-shared/types/transaction';

import { protectedProcedure, router } from '../../trpc';

export const transactionRouter = router({
  createPersonalSheetExpense: protectedProcedure
    .input(ZCreatePersonalSheetTransactionInput)
    .output(ZCreateSheetTransactionResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      return ctx.expenseService.createPersonalSheetTransaction(
        ctx.user,
        input,
        sheet,
      );
    }),

  batchCreatePersonalSheetExpenses: protectedProcedure
    .input(ZBatchCreatePersonalSheetTransactionInput)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      await ctx.expenseService.batchCreatePersonalSheetTransactions(
        ctx.user,
        input.transactions,
        sheet,
      );
    }),

  createGroupSheetExpenseOrIncome: protectedProcedure
    .input(ZCreateGroupSheetTransactionInput)
    .output(ZCreateSheetTransactionResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input.groupSheetId,
        ctx.user.id,
      );

      const groupParticipants = new Set(sheet.participants.map(({ id }) => id));
      const expenseParticipants = [
        input.paidOrReceivedById,
        ...input.splits.map(({ participantId }) => participantId),
      ];

      if (expenseParticipants.some((id) => !groupParticipants.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
        });
      }

      return ctx.expenseService.createGroupSheetTransaction(
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

      return ctx.expenseService.createSettlement(ctx.user, input, sheet);
    }),

  deleteExpense: protectedProcedure
    .input(
      z.object({
        sheetId: z.string().nonempty(),
        expenseId: z.string().nonempty(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { sheetId, expenseId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureSheetMembership(
        sheetId,
        ctx.user.id,
      );

      await ctx.expenseService.deleteTransaction(expenseId, sheet);
    }),

  getAllUserExpenses: protectedProcedure
    .input(
      z.object({
        fromTimestamp: z.string().datetime(),
        toTimestamp: z.string().datetime(),
      }),
    )
    .output(ZGetAllUserTransactionsResponse)
    .query(async ({ ctx, input }) => {
      const { expenses, earnings } =
        await ctx.expenseService.getAllUserTransactions(ctx.user, {
          from: Temporal.Instant.from(input.fromTimestamp),
          to: Temporal.Instant.from(input.toTimestamp),
        });

      return {
        transactions: expenses.map(({ spentAt, sheet, ...expense }) => ({
          transaction: { ...expense, spentAt: spentAt.toISOString() },
          sheet,
        })),
        earnings: earnings.map(({ spentAt, sheet, ...expense }) => ({
          transaction: { ...expense, spentAt: spentAt.toISOString() },
          sheet,
        })),
      };
    }),

  getPersonalSheetExpenses: protectedProcedure
    .input(
      z.object({
        personalSheetId: z.string().nonempty(),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetPersonalSheetTransactionsResponse)
    .query(async ({ input: { personalSheetId, limit }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        personalSheetId,
        ctx.user.id,
      );

      const { transactions: expenses, total } =
        await ctx.expenseService.getPersonalSheetTransactions({
          personalSheet: sheet,
          limit,
        });

      return {
        transactions: expenses.map(
          ({ amount, scale, spentAt, ...expense }) => ({
            ...expense,
            spentAt: spentAt.toISOString(),
            money: { amount, scale, currencyCode: sheet.currencyCode },
          }),
        ),
        total,
      };
    }),

  getGroupSheetExpenses: protectedProcedure
    .input(
      z.object({
        groupSheetId: z.string().nonempty(),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetGroupSheetTransactionsResponse)
    .query(async ({ input: { groupSheetId, limit }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        groupSheetId,
        ctx.user.id,
      );

      const { transactions: expenses, total } =
        await ctx.expenseService.getGroupSheetTransaction({
          groupSheet: sheet,
          limit,
        });

      return {
        transactions: expenses.map(
          ({ participantBalances, amount, scale, spentAt, ...expense }) => ({
            ...expense,
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
    .input(z.string().nonempty())
    .output(ZTransactionSummaryResponse)
    .query(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input,
        ctx.user.id,
      );

      const summaries = await ctx.expenseService.getParticipantSummaries(sheet);

      return summaries.sort(({ participantId }) =>
        participantId === ctx.user.id ? -1 : 1,
      );
    }),
});
